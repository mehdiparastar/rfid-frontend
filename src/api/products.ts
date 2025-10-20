import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiUpload, getProductItems, type Page, type Product, type SortingState } from '../lib/api';
import type { ProductFormValues } from '../store/useProductFormStore';
import { productsByIdsQueryKey, productsQueryKey, tagsQueryKey } from './queryKeys';



export type Tag = {
    id?: number;
    epc: string;
    rssi: number;
    pc: number;
    pl: number;
    scantimestamp: number
    deviceId: string
};

// Serial-safe query defaults from your modules.ts
const serialSafeQueryDefaults = {
    staleTime: 0 as const,
    gcTime: 0 as const,
    refetchOnMount: 'always' as const,
    refetchOnWindowFocus: 'always' as const,
    structuralSharing: false as const,
    retry: false as const,
};

// Fetch all available tags
export function useTags() {
    return useQuery({
        queryKey: tagsQueryKey,
        queryFn: () => api<Tag[]>('/api/tags'),
        ...serialSafeQueryDefaults,
    });
}

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
            formData.append('weight', payload.weight);
            formData.append('type', payload.type);
            formData.append('subType', payload.subType);
            formData.append('inventoryItem', String(payload.inventoryItem));
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