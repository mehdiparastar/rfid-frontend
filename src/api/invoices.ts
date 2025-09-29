import { useInfiniteQuery } from '@tanstack/react-query';
import { getInvoiceItems, type Page, type Invoice, type SortingState } from '../lib/api';
import { invoicesQueryKey } from './queryKeys';



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