import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Invoice, type SaleItem } from "../lib/api";

export type CreateSalePayload = {
    sellDate: Date;
    payType: string;
    description?: string;
    customer: { name: string; phone: string; nid: string };
    items: Array<{ productId: number; quantity: number; soldPrice: number, spotPrice: number }>;
};

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