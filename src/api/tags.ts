import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, getTagItems, type Page, type SortingState } from '../lib/api';
import { tagsByIdsQueryKey, tagsQueryKey } from './queryKeys';

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


// batch fetch (comma-separated ids)
export async function fetchTagsByIds(ids: Array<string | number>) {
    const unique = Array.from(new Set(ids.map(String))).filter(Boolean);
    if (unique.length === 0) return [] as Tag[];

    // /api/tags?ids=1,2,3
    const qs = new URLSearchParams({ ids: unique.join(",") });
    return api<Tag[]>(`/api/tags?${qs.toString()}`);
}

// batch hook returning Tag[]
export function useTagsByIds(
    ids: Array<string | number>,
    opts?: { initialData?: Tag[] }
) {
    const enabled = ids?.length > 0;
    return useQuery({
        queryKey: tagsByIdsQueryKey(ids),
        queryFn: () => fetchTagsByIds(ids),
        initialData: opts?.initialData,
        ...serialSafeQueryDefaults,
        enabled,
    });
}

// get all tags
export function useTags({
    limit = 20,
    sorting = [{ id: 'createdAt', desc: true }],
    filters = {},
}: {
    limit?: number
    sorting?: SortingState
    filters?: Record<string, any>
}) {
    return useInfiniteQuery({
        queryKey: tagsQueryKey(limit, sorting, filters),
        queryFn: ({ pageParam }) => getTagItems({ cursor: pageParam ?? null, limit, sorting, filters }),
        initialPageParam: null as string | null,
        // Return `undefined` when there's no next page
        getNextPageParam: (last: Page<Tag>) => last.nextCursor ?? undefined,
        // v5 way to keep old data visible while params change
        placeholderData: (prev) => prev,
    })
}