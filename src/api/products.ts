import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiUpload, getProductItems, type Page, type Product, type SortingState } from '../lib/api';
import type { GoldProductSUBType, ProductFormValues } from '../store/useProductFormStore';
import { productsByIdsQueryKey, productsQueryKey } from './queryKeys';


// Serial-safe query defaults from your modules.ts
const serialSafeQueryDefaults = {
    staleTime: 0 as const,
    gcTime: 0 as const,
    refetchOnMount: 'always' as const,
    refetchOnWindowFocus: 'always' as const,
    structuralSharing: false as const,
    retry: false as const,
};

type CreateProductArgs = {
    payload: ProductFormValues;
    onProgress?: (percent: number, loaded: number, total: number) => void;
};

// Create a new product
export function useCreateProduct() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ payload, onProgress }: CreateProductArgs) => {
            const formData = new FormData();
            formData.append('name', payload.name);
            formData.append('karat', payload.karat);
            formData.append('weight', payload.weight);
            formData.append('type', payload.type);
            formData.append('subType', payload.subType);
            formData.append('inventoryItem', payload.inventoryItem === true ? '1' : '0');
            formData.append('quantity', payload.quantity);
            formData.append('makingCharge', payload.makingCharge);
            formData.append('vat', payload.vat);
            formData.append('profit', payload.profit);
            formData.append('tags', JSON.stringify(payload.tags));
            payload.photos.forEach((photo) => formData.append('photos', photo));
            payload.previews.forEach((preview) => formData.append('previews', preview));

            // await api('/api/products/new', {
            //     method: 'POST',
            //     body: formData,
            //     headers: {}, // No Content-Type, let browser handle multipart
            // });

            await apiUpload('/api/products/new', formData, onProgress);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['products'] })
        },
        ...serialSafeQueryDefaults,
    });
}

interface UpdateProductArgs {
    id: string;
    payload: Partial<ProductFormValues>;
    onProgress: (pct: number, loaded: number, total: number) => void;
}

export function useUpdateProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload, onProgress }: UpdateProductArgs) => {
            const formData = new FormData();
            // formData.append('id', id);
            if (payload.name !== undefined) formData.append('name', payload.name);
            if (payload.karat !== undefined) formData.append('karat', payload.karat);
            if (payload.weight !== undefined) formData.append('weight', payload.weight);
            if (payload.type !== undefined) formData.append('type', payload.type);
            if (payload.subType !== undefined) formData.append('subType', payload.subType);
            if (payload.inventoryItem !== undefined) formData.append('inventoryItem', payload.inventoryItem === true ? '1' : '0');
            if (payload.quantity !== undefined) formData.append('quantity', payload.quantity);
            if (payload.makingCharge !== undefined) formData.append('makingCharge', payload.makingCharge);
            if (payload.vat !== undefined) formData.append('vat', payload.vat);
            if (payload.profit !== undefined) formData.append('profit', payload.profit);
            if (payload.tags !== undefined) formData.append('tags', JSON.stringify(payload.tags));
            if (payload.photos) {
                payload.photos.forEach((photo) => formData.append('photos', photo));
            }
            if (payload.previews) {
                payload.previews.forEach((preview) => formData.append('previews', preview));
            }

            await apiUpload(`/api/products/${id}`, formData, onProgress, 'PUT');
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['products'] });
        },
        ...serialSafeQueryDefaults,
    });
}

// batch fetch (comma-separated ids)
export async function fetchProductsByIds(ids: Array<string | number>) {
    const unique = Array.from(new Set(ids.map(String))).filter(Boolean);
    if (unique.length === 0) return [] as Product[];

    // /api/products?ids=1,2,3
    const qs = new URLSearchParams({ ids: unique.join(",") });
    return api<Product[]>(`/api/products?${qs.toString()}`);
}

// batch hook returning Product[]
export function useProductsByIds(
    ids: Array<string | number>,
    opts?: { initialData?: Product[] }
) {
    const enabled = ids?.length > 0;
    return useQuery({
        queryKey: productsByIdsQueryKey(ids),
        queryFn: () => fetchProductsByIds(ids),
        initialData: opts?.initialData,
        ...serialSafeQueryDefaults,
        enabled,
    });
}

// get all products
export function useProducts({
    limit = 20,
    sorting = [{ id: 'createdAt', desc: true }],
    filters = {},
}: {
    limit?: number
    sorting?: SortingState
    filters?: Record<string, any>
}) {
    return useInfiniteQuery({
        queryKey: productsQueryKey(limit, sorting, filters),
        queryFn: ({ pageParam }) => getProductItems({ cursor: pageParam ?? null, limit, sorting, filters }),
        initialPageParam: null as string | null,
        // Return `undefined` when there's no next page
        getNextPageParam: (last: Page<Product>) => last.nextCursor ?? undefined,
        // v5 way to keep old data visible while params change
        placeholderData: (prev) => prev,
    })
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => api<void>(`/api/products/${id}`, { method: "DELETE" }),

        // Simple path: just refetch everything related to products
        onSuccess: (_data, /*id*/) => {
            // If you have a canonical prefix in your keys, use that:
            // e.g. ['products', { limit, sorting, filters }]
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
}

export type UpdateProductPayload = {
    id: number;
    values: Partial<ProductFormValues>; // same shape you already use to create
    newPhotos?: File[]; // optional new images to append
    removedPhotoPaths?: string[]; // server paths to delete
    onProgress?: (percent: number, loaded: number, total: number) => void;
};

interface IRange {
    min: number;
    max: number;
}

interface IProductPrice {
    subType: GoldProductSUBType,
    weight: number,
    vat: number,
    profit: number,
    makingCharge: number,
    price: number,
    karat: number
}
export interface IProductRange {
    weight: IRange,
    quantity: IRange,
    makingCharge: IRange,
    profit: IRange,
    price: { min: [IProductPrice, IProductPrice], max: [IProductPrice, IProductPrice] },
}

export function useProductsRanges() {
    return useQuery({
        queryKey: ["products-ranges"],
        queryFn: ({ signal }) => api<IProductRange>("/api/products/get-all-ranges", { signal })
    })
}