import type { User } from "../api/auth";
import type { IProductRange } from "../api/products";
import type { Tag } from "../api/tags";
import type { GoldProductSUBType, GoldProductType } from "../store/useProductFormStore";

export class ApiError extends Error {
    status: number;
    body?: string;
    constructor(status: number, message: string, body?: string) {
        super(message);
        this.status = status;
        this.body = body;
    }
}

export const isAuthError = (e: unknown): e is ApiError => e instanceof ApiError && (e.status === 401 || e.status === 403);

let refreshPromise: Promise<void> | null = null;
let isLoggedOut = false;

// allow app to react (e.g., route to /login) when refresh finally fails
let onHardLogout: (() => void) | null = null;
export const setOnHardLogout = (fn: () => void) => (onHardLogout = fn);

async function doRefresh() {
    if (isLoggedOut) throw new ApiError(401, 'User is logged out, login again.');

    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
        });
        if (!response.ok) throw new ApiError(response.status, 'Refresh failed');
    } catch (error) {
        isLoggedOut = true;
        onHardLogout?.();
        throw error;
    }
}

export async function api<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
    const headers = init.body instanceof FormData
        ? { ...init.headers } // Omit Content-Type for FormData
        : { "Content-Type": "application/json", ...init.headers };

    const req = () =>
        fetch(input, {
            ...init,
            credentials: "include",
            headers
        });

    let res = await req();
    if (res.status === 401) {
        if (!refreshPromise) refreshPromise = doRefresh().finally(() => (refreshPromise = null));
        try {
            await refreshPromise;
        } catch (ex) {
            // refresh failed -> bubble 401
            isLoggedOut = true; // Set flag to indicate the user is logged out
            throw ex;
        }
        res = await req(); // retry once
    }

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new ApiError(res.status, body || 'Request failed', body);
    }

    const text = await res.text();
    return (text ? JSON.parse(text) : ({} as T)) as T;
}

export function apiUpload<T>(
    url: string,
    formData: FormData,
    onProgress?: (percent: number, loaded: number, total: number) => void,
    method: 'POST' | 'PUT' | 'PATCH' = 'POST'  // New: Configurable HTTP method, default POST
): Promise<T> {
    const send = () =>
        new Promise<T>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, true);  // Updated: Use the method parameter
            xhr.withCredentials = true;

            if (xhr.upload && onProgress) {
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const pct = Math.round((e.loaded / e.total) * 100);
                        onProgress(pct, e.loaded, e.total);
                    }
                };
            }

            xhr.onload = async () => {
                // attempt refresh on 401 once
                if (xhr.status === 401) {
                    try {
                        if (!refreshPromise) refreshPromise = doRefresh().finally(() => (refreshPromise = null));
                        await refreshPromise;
                        resolve(await apiUpload<T>(url, formData, onProgress, method)); // retry once with same method
                        return;
                    } catch (err) {
                        isLoggedOut = true;
                        onHardLogout?.();
                        reject(err);
                        return;
                    }
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.responseText ? JSON.parse(xhr.responseText) : ({} as T));
                } else {
                    reject(new Error(xhr.responseText || 'Request failed'));
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });

    return send();
}

export type Customer = {
    id: number;
    name: string;
    phone: string;
    nid: string;  // National ID
    sales?: SaleItem[];
    createdBy?: User;
    createdAt?: Date;
    updatedAt?: Date;
}

export type Invoice = {
    id: number;
    sellDate: Date;
    customer: Customer;
    items: SaleItem[];
    payType: string;  // Payment type (e.g., 'credit', 'cash')
    description: string;  // Description of the sale (optional)
    createdBy: User;
    createdAt?: Date;
    updatedAt?: Date;
}

export type SaleItem = {
    id: number;
    invoice: Invoice;
    product: Product;
    quantity: number;
    spotPrice: number;  // Spot price at the time of sale
    soldPrice: number;
    createdBy: User;
    createdAt?: Date;
    updatedAt?: Date;
}

export type Product = {
    id: number;
    name: string
    photos: string[];  // Local file paths for photos
    previews: string[];  // Local file paths for preview images
    weight: number;  // In grams or kilograms, depending on your unit system
    type: GoldProductType;
    subType: GoldProductSUBType;
    inventoryItem: boolean;
    createdBy?: User;
    quantity: number;  // Available quantity of the product
    makingCharge: number;  // Charge for making the product
    vat: number;  // vat for making the product
    profit: number;  // profit for making the product
    tags?: Tag[];
    saleItems?: SaleItem[];
    createdAt?: Date;
    updatedAt?: Date;
    scantimestamp: number
    deviceId: string
}

export type Page<T> = {
    items: T[]
    nextCursor?: string | null
    total?: number,
    ranges?: IProductRange
}

export type SortingState = Array<{ id: string; desc: boolean }>;

function encodeSort(sorting: SortingState | undefined) {
    // Server expects "field:asc,other:desc"
    if (!sorting?.length) return undefined
    return sorting.map(s => `${s.id}:${s.desc ? 'desc' : 'asc'}`).join(',')
}

export async function getProductItems({
    cursor,
    limit,
    sorting,
    filters,
}: {
    cursor?: string | null
    limit?: number
    sorting?: SortingState
    filters?: Record<string, string | number | boolean | undefined>
}) {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', JSON.stringify(cursor))
    if (limit) params.set('limit', String(limit))
    const sort = encodeSort(sorting)
    if (sort) params.set('sort', sort)

    // Object.entries(filters ?? {}).forEach(([k, v]) => {
    //     if (v !== undefined && v !== null) params.set(k, String(v))
    // })

    // Properly stringify filters object before sending
    if (filters && Object.keys(filters).length > 0) {
        params.set('filters', JSON.stringify(filters));  // Send as JSON string
    }

    return api<Page<Product>>(`/api/products/all?${params.toString()}`)
}

export async function getTagItems({
    cursor,
    limit,
    sorting,
    filters,
}: {
    cursor?: string | null
    limit?: number
    sorting?: SortingState
    filters?: Record<string, string | number | boolean | undefined>
}) {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', JSON.stringify(cursor))
    if (limit) params.set('limit', String(limit))
    const sort = encodeSort(sorting)
    if (sort) params.set('sort', sort)

    // Properly stringify filters object before sending
    if (filters && Object.keys(filters).length > 0) {
        params.set('filters', JSON.stringify(filters));  // Send as JSON string
    }

    return api<Page<Tag>>(`/api/tags/all?${params.toString()}`)
}

export async function getInvoiceItems({
    cursor,
    limit,
    sorting,
    filters,
}: {
    cursor?: string | null
    limit?: number
    sorting?: SortingState
    filters?: Record<string, string | number | boolean | undefined>
}) {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', JSON.stringify(cursor))
    if (limit) params.set('limit', String(limit))
    const sort = encodeSort(sorting)
    if (sort) params.set('sort', sort)

    // Object.entries(filters ?? {}).forEach(([k, v]) => {
    //     if (v !== undefined && v !== null) params.set(k, String(v))
    // })

    // Properly stringify filters object before sending
    if (filters && Object.keys(filters).length > 0) {
        params.set('filters', JSON.stringify(filters));  // Send as JSON string
    }

    return api<Page<Invoice>>(`/api/invoices/all?${params.toString()}`)
}

