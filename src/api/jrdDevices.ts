import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ScanResult } from "../lib/socket";
import { serialSafeQueryDefaults, type Mode } from "./modules";
import { jrdKeys, scanResultsKey } from "./queryKeys";

export type JrdStateResponse = {
    info: {
        type: string;
        text: string;
    }[];
    dev: {
        id: string;
        host: string;
        port: number;
    };
    currentPower: number;
    isActive: boolean;
    isScan: boolean;
    mode: Mode
}

export type CurrentScenarioRow = {
    id: string;
    state: { mode: Mode; isActive: boolean; isScan: boolean; power: number; type: string; tagsScanResult: ScanResult };
};

/** Get list of connected jrd modules */
export function useGetAllJrdModules_() {
    return useQuery({
        queryKey: jrdKeys.list(),
        queryFn: ({ signal }) => api<JrdStateResponse[]>(`/api/jrd/devices`, { signal }),
        // placeholderData: keepPreviousData,
        // staleTime: 300_000,
        retry: 5,
    });
}

export function useGetAllJrdModules() {
    return useQuery({
        queryKey: jrdKeys.list(),
        queryFn: async ({ signal }) => await api<JrdStateResponse[]>(`/api/jrd/devices`, { signal }),
        placeholderData: keepPreviousData,
        // staleTime: 300_000,
        retry: 3,
    });
}

export function useInitJrdModules() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: [...jrdKeys.modules(), 'init'],
        mutationFn: async (vars: { power: number; mode: Mode, deviceId: string }[]) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return api<JrdStateResponse[]>(`/api/jrd/modules/init`, {
                method: "POST",
                body: JSON.stringify(vars),
            })
        },
        retry: 5,

        onSuccess: async (data) => {

            // Server returns the canonical list -> commit it
            qc.setQueryData<JrdStateResponse[]>(jrdKeys.list(), data);
            await qc.refetchQueries({ queryKey: ["current-scenario"], type: "active" });
        },

    });
}

export function useCurrentScenario() {
    const stopScenario = useStopScenario();

    return useQuery({
        queryKey: ['current-scenario'],
        queryFn: ({ signal }) => api<CurrentScenarioRow[]>("/api/jrd/current-scenario", { signal }),
        // refetchInterval: 5 * 1000,
        ...serialSafeQueryDefaults,
        enabled: !stopScenario.isPending,
    });
}

export function useStartScenario() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: [...jrdKeys.modules(), "startScenario"],
        mutationFn: (vars: { ids: string[], mode: Mode }) =>
            api<JrdStateResponse[]>(`/api/jrd/modules/start-scenario`, {
                method: "POST",
                body: JSON.stringify(vars),
            }),
        retry: 0,
        // optimistic update both lists we keep locally:
        // 1) the modules list (/api/jrd/devices)
        // 2) the current scenario (/api/jrd/current-scenario) if you show it
        onMutate: async ({ ids }) => {
            await Promise.all([
                qc.cancelQueries({ queryKey: jrdKeys.list() }),
                qc.cancelQueries({ queryKey: ["current-scenario"] }),
            ]);

            const prevList = qc.getQueryData<JrdStateResponse[]>(jrdKeys.list());
            const prevScenario = qc.getQueryData<CurrentScenarioRow[]>(["current-scenario"]);

            if (prevList) {
                const nextList = prevList.map((row) =>
                    ids.includes(row.dev.id) ? { ...row, isScan: true } : row
                );
                qc.setQueryData(jrdKeys.list(), nextList);
            }

            if (prevScenario) {
                const nextScenario = prevScenario.map((r) =>
                    ids.includes(r.id) ? { ...r, state: { ...r.state, isScan: true } } : r
                );
                qc.setQueryData(["current-scenario"], nextScenario);
            }

            return { prevList, prevScenario };
        },

        onError: (_err, _vars, ctx) => {
            if (ctx?.prevList) qc.setQueryData(jrdKeys.list(), ctx.prevList);
            if (ctx?.prevScenario) qc.setQueryData(["current-scenario"], ctx.prevScenario);
        },

        // server returns canonical state; commit it
        onSuccess: (data) => {
            // If your endpoint returns only the updated devices, you can merge;
            // here we assume it returns the full list like /api/jrd/devices
            qc.setQueryData<JrdStateResponse[]>(jrdKeys.list(), data);
            // Also refetch scenario if you want to be sure:
            qc.invalidateQueries({ queryKey: ["current-scenario"] });
        },
    });
}

export function useStopScenario() {

    return useMutation({
        mutationKey: [...jrdKeys.modules(), "stopScenario"],
        mutationFn: (vars: { mode: Mode }) =>
            api<JrdStateResponse[]>(`/api/jrd/modules/stop-scenario`, {
                method: "POST",
                body: JSON.stringify(vars),
            }),
        retry: 5,
    });
}

export function clearScenarioHistory() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: [...jrdKeys.modules(), "clearScenarioHistory"],
        mutationFn: (vars: { mode: Mode }) =>
            api<boolean>(`/api/jrd/modules/clear-scenario-history`, {
                method: "POST",
                body: JSON.stringify(vars),
            }),
        retry: 5,
        onSuccess: (_data, variables) => {
            // Invalidate the scan results query for the specific mode
            qc.invalidateQueries({
                queryKey: scanResultsKey(variables.mode)
            });
        }

    });
}

export function useScanResults(mode: Mode) {
    return useQuery({
        queryKey: scanResultsKey(mode),
        queryFn: ({ signal }) => api<ScanResult>(`/api/jrd/modules/scan-results?mode=${encodeURIComponent(mode)}`, { signal }),
        ...serialSafeQueryDefaults,
    });
}

export function useSetScanMode() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: [...jrdKeys.modules(), "setScanMode"],
        mutationFn: (vars: { deviceId: string; mode: Mode; }) =>
            api<JrdStateResponse[]>(
                `/api/jrd/modules/setScanMode`,
                {
                    method: "POST",
                    body: JSON.stringify(vars),
                }
            ),
        retry: 5,
        async onSuccess(data, variables, context) {
            qc.setQueryData<JrdStateResponse[]>(jrdKeys.list(), data);
            await qc.refetchQueries({ queryKey: ["current-scenario"], type: "active" });
        },
    })
}

export function useSetIsActiveModule() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: [...jrdKeys.modules(), "setIsActiveModule"],
        mutationFn: (vars: { deviceId: string; isActive: boolean; }) =>
            api<JrdStateResponse[]>(
                `/api/jrd/modules/setIsActiveModule`,
                {
                    method: "POST",
                    body: JSON.stringify(vars),
                }
            ),
        retry: 5,
        async onSuccess(data, variables, context) {
            qc.setQueryData<JrdStateResponse[]>(jrdKeys.list(), data);
            await qc.refetchQueries({ queryKey: ["current-scenario"], type: "active" });
        },
    })
}

export function useSetModuleScanPower() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: [...jrdKeys.modules(), "setModuleScanPower"],
        mutationFn: (vars: { deviceId: string; power: number; }) =>
            api<JrdStateResponse[]>(
                `/api/jrd/modules/setModuleScanPower`,
                {
                    method: "POST",
                    body: JSON.stringify(vars),
                }
            ),
        retry: 5,
        async onSuccess(data, variables, context) {
            qc.setQueryData<JrdStateResponse[]>(jrdKeys.list(), data);
            await qc.refetchQueries({ queryKey: ["current-scenario"], type: "active" });
        },
    })
}

