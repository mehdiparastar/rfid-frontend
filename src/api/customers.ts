import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useDebounce } from 'use-debounce';
import { api, getCustomerItems, type Customer, type Page, type SortingState } from "../lib/api";
import { customersQueryKey } from "./queryKeys";

export interface ICustomer {
    id: number;
    name: string;
    phone: string;
    nid: string
}
export function useCustomerSearch(query: string) {
    const [debounced] = useDebounce(query, 300);
    return useQuery({
        queryKey: ['customers', 'search', debounced],
        queryFn: async ({ signal }) => {
            if (!debounced || debounced.length < 2) return [];
            const res = await api<Customer[]>(`/api/customers/search?q=${encodeURIComponent(debounced)}`, { signal });
            return res;
        },
        enabled: debounced.length >= 2,
        staleTime: 60_000,
    });
}

// get all tags
export function useCustomers({
    limit = 20,
    sorting = [{ id: 'createdAt', desc: true }],
    filters = {},
}: {
    limit?: number
    sorting?: SortingState
    filters?: Record<string, any>
}) {
    return useInfiniteQuery({
        queryKey: customersQueryKey(limit, sorting, filters),
        queryFn: ({ pageParam }) => getCustomerItems({ cursor: pageParam ?? null, limit, sorting, filters }),
        initialPageParam: null as string | null,
        // Return `undefined` when there's no next page
        getNextPageParam: (last: Page<ICustomer>) => last.nextCursor ?? undefined,
        // v5 way to keep old data visible while params change
        placeholderData: (prev) => prev,
    })
}