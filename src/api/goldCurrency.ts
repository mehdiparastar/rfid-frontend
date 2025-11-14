import { useQuery } from '@tanstack/react-query';
import { api, ApiError, isAuthError } from '../lib/api';
import type { GoldProductSUBType } from '../store/useProductFormStore';

export interface GoldCurrencyData {
    gold: {
        change_percent: number;
        change_value: number;
        date: string;
        name: string;
        name_en: string;
        price: number;
        symbol: GoldProductSUBType;
        time: string;
        time_unix: number;
        unit: string;
        karat: number;
    }[]
}

export const useGoldCurrency = () => {
    return useQuery<GoldCurrencyData, ApiError>({
        queryKey: ['gold-currency'],
        queryFn: async () => {
            return api<GoldCurrencyData>('/api/gold-currency');
        },
        staleTime: 60 * 1000, // Cache for 1 minute (60 seconds)
        gcTime: 60 * 1000, // Garbage collection time set to 1 minute
        retry: (failureCount, error) => {
            // Do not retry on 401/403 errors, let the api function handle refresh
            if (isAuthError(error)) return false;
            return failureCount < 3; // Retry up to 3 times for other errors
        },
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,
    });
};