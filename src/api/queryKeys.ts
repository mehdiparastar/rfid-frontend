import type { SortingState } from "../lib/api";
import type { Mode } from "./modules";

export const scenarioKey = ["scenario"] as const;

export const scanResultsKey = (mode: Mode) => ["scan-results", mode] as const;

export const tagsQueryKey = ['tags'];

export const productsQueryKey = (limit?: number, sorting?: SortingState, filters?: Record<string, any>) => ['products', { limit, sorting, filters }];

export const productQueryKey = (id: string | number) => ['product', String(id)];
