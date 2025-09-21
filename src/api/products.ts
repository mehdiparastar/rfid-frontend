import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiUpload, type SortingState, getItems, type Page, type Product } from '../lib/api';
import type { ProductFormValues } from '../store/useProductFormStore';
import { productQueryKey, productsQueryKey, tagsQueryKey } from './queryKeys';



export type Tag = {
    id?: number;
    epc: string;
    rssi: number;
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


export async function fetchProduct(id: string | number) { return api<Product>(`/api/products/${id}`) }

export function useProduct(id: string | number, opts?: { initialData?: Product }) {
    return useQuery({
        queryKey: productQueryKey(id),
        queryFn: () => fetchProduct(id),
        initialData: opts?.initialData,
        ...serialSafeQueryDefaults,
    });
}

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
        queryFn: ({ pageParam }) => getItems({ cursor: pageParam ?? null, limit, sorting, filters }),
        initialPageParam: null as string | null,
        // Return `undefined` when there's no next page
        getNextPageParam: (last: Page<Product>) => last.nextCursor ?? undefined,
        // v5 way to keep old data visible while params change
        placeholderData: (prev) => prev,
    })
}