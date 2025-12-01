import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Invoice, type SaleItem } from "../lib/api";
import type { GoldProductSUBType, GoldProductType } from "../store/useProductFormStore";

export type CreateSalePayload = {
    sellDate: Date;
    payType: string;
    description?: string;
    customer: { name: string; phone: string; nid: string };
    items: Array<{ productId: number; quantity: number; soldPrice: number, spotPrice: number }>;
};

export interface TopCustomer {
    id: number;
    name: string;
    totalSpent: number;
}

export interface SalesStats {
    totals: {
        productsCount: number
        totalSoldUniqueItem: number
        totalSoldQuantity: number
        totalWeight: number
        totalSoldWeight: number
        totalSoldWeightPlusMakingChargeBuy: number
        totalAvailableWeight: number
        totalSoldPrice: number
        totalSoldWeightPrice: number
        totalSoldVatPrice: number
        totalSoldProfitPrice: number
        totalSoldMakingChargeBuyPrice: number
        totalAvailableWeightPlusMakingChargeBuy: number
        totalWeightPlusMakingChargeBuy: number
    }
    groupByTypes: {
        type: GoldProductType
        productsCount: number
        totalSoldUniqueItem: number
        totalSoldQuantity: number
        totalWeight: number
        totalSoldWeight: number
        totalSoldWeightPlusMakingChargeBuy: number
        totalAvailableWeight: number
        totalSoldPrice: number
        totalSoldWeightPrice: number
        totalSoldVatPrice: number
        totalSoldProfitPrice: number
        totalSoldMakingChargeBuyPrice: number
        totalAvailableWeightPlusMakingChargeBuy: number
        totalWeightPlusMakingChargeBuy: number
    }[]
    groupBySubTypes: {
        subType: GoldProductSUBType
        productsCount: number
        totalSoldUniqueItem: number
        totalSoldQuantity: number
        totalWeight: number
        totalSoldWeight: number
        totalSoldWeightPlusMakingChargeBuy: number
        totalAvailableWeight: number
        totalSoldPrice: number
        totalSoldWeightPrice: number
        totalSoldVatPrice: number
        totalSoldProfitPrice: number
        totalSoldMakingChargeBuyPrice: number
        totalAvailableWeightPlusMakingChargeBuy: number
        totalWeightPlusMakingChargeBuy: number
    }[]
    newCustomersCount: number
    topCustomers: TopCustomer[]
    period: PeriodType
}


export function createSale(payload: CreateSalePayload) {
    return api<Invoice>("/api/sales", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function useCreateSale() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createSale,
        onSuccess: async () => {
            await Promise.all([
                qc.invalidateQueries({ queryKey: ["products"] }),
                qc.invalidateQueries({ queryKey: ["sales"] }),
            ]);
        },
    });
}

export function useSales() {
    return useQuery({
        queryKey: ["sales"],
        queryFn: ({ signal }) => api<SaleItem[]>("/api/sales", { signal }),
        staleTime: 1000 * 60 * 2, // cache 2 minutes
        refetchOnWindowFocus: false,
    });
}

export type PeriodType = 'day' | 'month' | '6months' | 'year';


export function useSalesStats(period: PeriodType) {
    return useQuery({
        queryKey: ["sales", "stats", period],
        queryFn: ({ signal }) => api<SalesStats>(`/api/sales/stats?period=${period}`, { signal }),
        // staleTime: 1000 * 60 * 2, // 2 minutes cache
        refetchOnWindowFocus: false,
        refetchInterval: 1000 * 60, // auto-refresh every 1 minute
    });
}