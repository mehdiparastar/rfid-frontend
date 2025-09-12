import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { scanResultsKey, scenarioKey } from "./queryKeys";
import type { ScanResult } from "../lib/socket";

export type Mode = "Inventory" | "Invoice" | "NewProduct";

export type ModuleRow = {
    path: string;
    baudRate: number;
    manufacturer: string;
    serialNumber: string;
    pnpId: string;
    productId: string;
    vendorId: string;
    locationId: string;
    powerSetSuccess?: boolean;
    powerPercent?: number;
    powerDbm?: number;
    scanMode?: Mode;
};

export type ModulesResponse = ModuleRow[];

export type ScenarioState = {
    isActiveScenario: boolean;
    scanMode: Mode | null;
};

/**
 * ⛑ Anti-staleness defaults for serial devices:
 *  - staleTime: 0 => never trust cache
 *  - gcTime: 0  => drop cache as soon as unused
 *  - refetchOnMount / refocus: 'always' => keep data fresh
 *  - structuralSharing: false => never re-use old arrays/objects
 *  - retry: false => fail fast (hardware can be fickle)
 */
const serialSafeQueryDefaults = {
    staleTime: 0 as const,
    gcTime: 0 as const,
    refetchOnMount: "always" as const,
    refetchOnWindowFocus: "always" as const,
    structuralSharing: false as const,
    retry: false as const,
};

/** Get current power for a specific mode */
export function usePower(mode: Mode) {
    return useQuery({
        queryKey: ["power", mode],
        queryFn: ({ signal }) => api<number>(`/api/serial/modules/power?mode=${encodeURIComponent(mode)}`, { signal }),
        ...serialSafeQueryDefaults,
    });
}

/** Get modules list for a specific mode */
export function useModules(mode: Mode) {
    return useQuery({
        queryKey: ["modules", mode],
        queryFn: ({ signal }) =>
            api<ModulesResponse>(
                `/api/serial/modules?mode=${encodeURIComponent(mode)}`,
                { signal }
            ),
        ...serialSafeQueryDefaults,
    });
}

/**
 * Initialize modules with given power + mode.
 * - On success: refresh/update the modules list for that mode.
 * - On error: set the modules list to an empty array (optimistic clarity).
 */
export function useInitModules() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (vars: { power: number; mode: Mode }) =>
            api<{ modules?: ModulesResponse }>(`/api/serial/modules/init`, {
                method: "POST",
                body: JSON.stringify(vars),
            }),

        // If server returns a fresh modules list, trust it immediately.
        // Otherwise, invalidate to force a re-fetch.
        onSuccess: (data, vars) => {
            const key = ["modules", vars.mode] as const;
            if (data && Array.isArray(data)) {
                qc.setQueryData<ModulesResponse>(key, data);
            } else {
                qc.invalidateQueries({ queryKey: key });
            }
            qc.invalidateQueries({ queryKey: [...scenarioKey] })
        },

        // If init fails, surface a clear empty-list state for that mode.
        onError: (_err, vars) => {
            const key = ["modules", vars.mode] as const;
            qc.setQueryData<ModulesResponse>(key, []);
        },
    });
}

/**
 * ⭐ Handy helpers (optional but cheerful quality-of-life):
 * Trigger a fresh read (ignores any cache) for the current modules/power of a mode.
 */
export function useRefreshSerial(mode: Mode) {
    const qc = useQueryClient();
    return {
        refreshPower: () => qc.invalidateQueries({ queryKey: ["power", mode] }),
        refreshModules: () => qc.invalidateQueries({ queryKey: ["modules", mode] }),
    };
}

/** Get current scenario state (persists across refresh via server) */
export function useScenarioState() {
    return useQuery({
        queryKey: scenarioKey,
        queryFn: ({ signal }) => api<ScenarioState>("/api/serial/modules/scenario-state", { signal }),
        ...serialSafeQueryDefaults,
    });
}

export function useStartScenario() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (vars: { mode: Mode }) =>
            api<ScenarioState>(`/api/serial/modules/scenario/start?mode=${encodeURIComponent(vars.mode)}`, {
                method: "POST",
                body: JSON.stringify(vars),
            }),
        onMutate: async ({ mode }) => {
            await qc.cancelQueries({ queryKey: scenarioKey });
            const prev = qc.getQueryData<ScenarioState>(scenarioKey);
            qc.setQueryData<ScenarioState>(scenarioKey, { isActiveScenario: true, scanMode: mode });
            return { prev };
        },
        onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(scenarioKey, ctx.prev),
        onSuccess: (serverState) => qc.setQueryData(scenarioKey, serverState),
        onSettled: () => qc.invalidateQueries({ queryKey: scenarioKey }),
    });
}

export function useStopScenario() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => api<ScenarioState>("/api/serial/modules/scenario/stop", { method: "POST" }),
        onMutate: async () => {
            await qc.cancelQueries({ queryKey: scenarioKey });
            const prev = qc.getQueryData<ScenarioState>(scenarioKey);
            qc.setQueryData<ScenarioState>(scenarioKey, { isActiveScenario: false, scanMode: null });
            return { prev };
        },
        onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(scenarioKey, ctx.prev),
        onSuccess: (serverState) => qc.setQueryData(scenarioKey, serverState),
        onSettled: () => qc.invalidateQueries({ queryKey: scenarioKey }),
    });
}

export function useScanResults(mode: Mode) {
    return useQuery({
        queryKey: scanResultsKey(mode),
        queryFn: ({ signal }) => api<ScanResult[]>(`/api/serial/modules/scan-results?mode=${encodeURIComponent(mode)}`, { signal }),
        ...serialSafeQueryDefaults,
    });
}