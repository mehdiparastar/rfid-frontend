import { useQuery } from "@tanstack/react-query";
import { api, type Customer } from "../lib/api";
import { useDebounce } from 'use-debounce';

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