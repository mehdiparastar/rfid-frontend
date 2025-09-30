import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, getInvoiceItems, type Invoice, type Page, type SortingState } from '../lib/api';
import { invoicesByIdsQueryKey, invoicesQueryKey } from './queryKeys';

// Serial-safe query defaults from your modules.ts
const serialSafeQueryDefaults = {
    staleTime: 0 as const,
    gcTime: 0 as const,
    refetchOnMount: 'always' as const,
    refetchOnWindowFocus: 'always' as const,
    structuralSharing: false as const,
    retry: false as const,
};

// batch fetch (comma-separated ids)
export async function fetchInvoicesByIds(ids: Array<string | number>) {
    const unique = Array.from(new Set(ids.map(String))).filter(Boolean);
    if (unique.length === 0) return [] as Invoice[];

    // /api/invoices?ids=1,2,3
    const qs = new URLSearchParams({ ids: unique.join(",") });
    return api<Invoice[]>(`/api/invoices?${qs.toString()}`);
}

// batch hook returning Invoice[]
export function useInvoicesByIds(
    ids: Array<string | number>,
    opts?: { initialData?: Invoice[] }
) {
    const enabled = ids?.length > 0;
    return useQuery({
        queryKey: invoicesByIdsQueryKey(ids),
        queryFn: () => fetchInvoicesByIds(ids),
        initialData: opts?.initialData,
        ...serialSafeQueryDefaults,
        enabled,
    });
}



// get all invoices
export function useInvoices({
    limit = 20,
    sorting = [{ id: 'createdAt', desc: true }],
    filters = {},
}: {
    limit?: number
    sorting?: SortingState
    filters?: Record<string, any>
}) {
    return useInfiniteQuery({
        queryKey: invoicesQueryKey(limit, sorting, filters),
        queryFn: ({ pageParam }) => getInvoiceItems({ cursor: pageParam ?? null, limit, sorting, filters }),
        initialPageParam: null as string | null,
        // Return `undefined` when there's no next page
        getNextPageParam: (last: Page<Invoice>) => last.nextCursor ?? undefined,
        // v5 way to keep old data visible while params change
        placeholderData: (prev) => prev,
    })
}