import type { ItariffType, SortingState } from "../lib/api";

export const scenarioKey = ["scenario"] as const;

export const productsQueryKey = (limit?: number, sorting?: SortingState, filters?: Record<string, any>, tariffType?: ItariffType) => ['products', { limit, sorting, filters, tariffType }];

export const tagsQueryKey = (limit?: number, sorting?: SortingState, filters?: Record<string, any>) => ['tags', { limit, sorting, filters }];

export const customersQueryKey = (limit?: number, sorting?: SortingState, filters?: Record<string, any>) => ['customers', { limit, sorting, filters }];

export const productQueryKey = (id: string | number) => ['product', String(id)];

export const tagQueryKey = (id: string | number) => ['tag', String(id)];

export const invoicesQueryKey = (limit?: number, sorting?: SortingState, filters?: Record<string, any>) => ['invoices', { limit, sorting, filters }];

// NEW: multi id key
export const productsByIdsQueryKey = (ids: Array<string | number>) => {
    const sorted = Array.from(new Set(ids.map(String))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );
    return ["products", "byIds", ...sorted] as const;
};

// NEW: multi id key
export const tagsByIdsQueryKey = (ids: Array<string | number>) => {
    const sorted = Array.from(new Set(ids.map(String))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );
    return ["tags", "byIds", ...sorted] as const;
};

// NEW: multi id key
export const invoicesByIdsQueryKey = (ids: Array<string | number>) => {
    const sorted = Array.from(new Set(ids.map(String))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
    );
    return ["invoices", "byIds", ...sorted] as const;
};

export const jrdKeys = {
    all: ['jrd'] as const,
    modules: () => [...jrdKeys.all, 'modules'] as const,
    list: () => [...jrdKeys.modules(), 'list'] as const,
};

export const backupProgress = ["backup-progress"] as const
export const restoreProgress = ["restore-progress"] as const