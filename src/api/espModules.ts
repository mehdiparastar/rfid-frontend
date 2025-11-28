import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ScanMode } from "../constants/scanMode";
import { api, type Product } from "../lib/api";
import type { ESPModulesTagScanResults } from "../lib/socket";

export interface Esp32StatusPayload {
    rssi: number;
    batteryVoltage: number;
    timestamp: number; // epoch milliseconds
}

export interface Esp32ClientInfo {
    id?: number;
    ip?: string;
    socket?: WebSocket;
    lastSeen: number;
    mode: ScanMode;
    currentHardPower: number; // in dbm ben 15 and 26
    currentSoftPower: number; // enable if request power be less than 15
    isActive: boolean;
    isScan: boolean;
    tagScanResults?: ESPModulesTagScanResults;
    status?: Esp32StatusPayload;
}
export function useEspModules() {
    return useQuery({
        queryKey: ["esp-modules"],
        queryFn: ({ signal }) => api<Esp32ClientInfo[]>(`/api/jrd/all-connected-esp-modules`, { signal }),
    });
}

export function useSetESPModulePower() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["setESPModulesPower"],
        mutationFn: (vars: { deviceId: number; power: number; }) =>
            api<{
                currentSoftPower: number;
                currentHardPower: number;
                sent: boolean;
                command: string;
                requestedPower: number;
            }>(
                `/api/jrd/${vars.deviceId}/power`,
                {
                    method: "POST",
                    body: JSON.stringify({ dbm: vars.power }),
                }
            ),
        async onSuccess(data, variables/*, context*/) {
            const prevList = qc.getQueryData<Esp32ClientInfo[]>(["esp-modules"]);
            if (prevList && prevList.length > 0) {
                qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"],
                    prevList
                        .filter(m => m.id != null)
                        .map(m =>
                            m.id === variables.deviceId ? ({ ...m, currentHardPower: data.currentHardPower, currentSoftPower: data.currentSoftPower }) : (m)
                        ));
            }
            return data
        },
    })
}

export function useSetESPModulesIsActive() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["setESPModulesIsActive"],
        mutationFn: (vars: { deviceId: number; isActive: boolean; }) =>
            api<{ command: string, isActive: boolean, sent: boolean }>(
                `/api/jrd/${vars.deviceId}/is-active`,
                {
                    method: "POST",
                    body: JSON.stringify({ isActive: vars.isActive }),
                }
            ),
        async onSuccess(data, variables/*, context*/) {
            const prevList = qc.getQueryData<Esp32ClientInfo[]>(["esp-modules"]);
            if (prevList && prevList.length > 0) {
                qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"],
                    prevList
                        .filter(m => m.id != null)
                        .map(m =>
                            m.id === variables.deviceId ? ({ ...m, isActive: data.isActive }) : (m)
                        ));
            }
            return data
        },
    })
}

export function useSetESPModulesMode() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["setESPModulesMode"],
        mutationFn: (vars: { deviceId: number; mode: ScanMode; }) =>
            api<{ command: string, mode: ScanMode, sent: boolean }>(
                `/api/jrd/${vars.deviceId}/mode`,
                {
                    method: "POST",
                    body: JSON.stringify({ mode: vars.mode }),
                }
            ),
        async onSuccess(data, variables/*, context*/) {
            const prevList = qc.getQueryData<Esp32ClientInfo[]>(["esp-modules"]);
            if (prevList && prevList.length > 0) {
                qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"],
                    prevList
                        .filter(m => m.id != null)
                        .map(m =>
                            m.id === variables.deviceId ? ({ ...m, mode: data.mode }) : (m)
                        ));
            }
            return data
        },
    })
}

export function useStartESPModulesScan() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["setStartESPModulesScan"],
        mutationFn: (vars: { deviceId: number; mode: ScanMode; }) =>
            api<{ sent: boolean; command: string; started: boolean; }>(
                `/api/jrd/${vars.deviceId}/start-scan`,
                {
                    method: "POST",
                }
            ),
        async onSuccess(data, variables/*, context*/) {
            const prevList = qc.getQueryData<Esp32ClientInfo[]>(["esp-modules"]);
            if (prevList && prevList.length > 0) {
                qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"],
                    prevList
                        .filter(m => m.id != null)
                        .map(m =>
                            m.id === variables.deviceId ? ({ ...m, isScan: data.started }) : (m)
                        ));
            }
            return data
        },
    })
}

export function useStartESPModulesScanByMode() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["setStartESPModulesScanByMode"],
        mutationFn: (vars: { mode: ScanMode; }) =>
            api<
                {
                    sent: boolean;
                    command: string;
                    res: {
                        id: number;
                        started: boolean;
                    }[];
                }
            >(
                `/api/jrd/${vars.mode}/start-scan-by-mode`,
                { method: "POST" }
            ),
        async onSuccess(data, variables/*, context*/) {
            const prevList = qc.getQueryData<Esp32ClientInfo[]>(["esp-modules"]);
            if (prevList && prevList.length > 0) {
                qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"],
                    prevList
                        .filter(m => m.id != null)
                        .map(m =>
                            m.mode === variables.mode ? ({ ...m, isScan: data.res.filter(el => el.id != null).find(el => el.id === m.id)!.started }) : (m)
                        ));
            }
            return data
        },
    })
}

export function useStartESPModulesScanByIds() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["setStartESPModulesScanByIds"],
        mutationFn: (vars: { ids: number[]; }) =>
            api<
                {
                    sent: boolean;
                    command: string;
                    res: {
                        id: number;
                        started: boolean;
                    }[];
                }
            >(
                `/api/jrd/ids/start-scan-by-ids`,
                {
                    method: "POST",
                    body: JSON.stringify({ ids: vars.ids })
                }
            ),
        async onSuccess(data, variables/*, context*/) {
            const prevList = qc.getQueryData<Esp32ClientInfo[]>(["esp-modules"]);
            if (prevList && prevList.length > 0) {
                qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"],
                    prevList
                        .filter(m => m.id != null)
                        .map(m =>
                            variables.ids.includes(m.id!) ? ({ ...m, isScan: data.res.filter(el => el.id != null).find(el => el.id === m.id)!.started }) : (m)
                        ));
            }
            return data
        },
    })
}

export function useStopESPModulesScan() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["setStopESPModulesScan"],
        mutationFn: (vars: { deviceId: number; }) =>
            api<{ sent: boolean; command: string; stopped: boolean; }>(
                `/api/jrd/${vars.deviceId}/stop-scan`,
                { method: "POST" }
            ),
        async onSuccess(data, variables/*, context*/) {
            const prevList = qc.getQueryData<Esp32ClientInfo[]>(["esp-modules"]);
            if (prevList && prevList.length > 0) {
                qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"],
                    prevList
                        .filter(m => m.id != null)
                        .map(m =>
                            m.id === variables.deviceId ? ({ ...m, isScan: !data.stopped }) : (m)
                        ));
            }
            return data
        },
    })
}

export function useStopESPModulesScanByMode() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["setStopESPModulesScanByMode"],
        mutationFn: (vars: { mode: ScanMode; }) =>
            api<{
                sent: boolean;
                command: string;
                res: {
                    id: number;
                    stopped: boolean;
                }[];
            }>(
                `/api/jrd/${vars.mode}/stop-scan-by-mode`,
                { method: "POST" }
            ),
        async onSuccess(data, variables/*, context*/) {
            const prevList = qc.getQueryData<Esp32ClientInfo[]>(["esp-modules"]);
            if (prevList && prevList.length > 0) {
                qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"],
                    prevList
                        .filter(m => m.id != null)
                        .map(m =>
                            (m.mode === variables.mode && data.res.find(e => e.id === m.id)?.stopped) ? ({ ...m, isScan: !(data.res.filter(el => el.id != null).find(el => el.id === m.id)!.stopped) }) : (m)
                        ));
            }
            return data
        },
    })
}

export function useClearEspModulesScanHistory() {
    const qc = useQueryClient();

    return useMutation({
        mutationKey: ["clearESPModulesScanHistoryByMode"],
        mutationFn: (vars: { mode: ScanMode; }) => api<{ cleared: boolean; sent: boolean; command: string; }>(`/api/jrd/${vars.mode}/clear-scan-history`, { method: "POST" }),
        onSuccess(data, variables) {
            const prevList = qc.getQueryData<Esp32ClientInfo[]>(["esp-modules"]);
            if (prevList && prevList.length > 0) {
                qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"],
                    prevList
                        .filter(m => m.id != null)
                        .map(m =>
                            m.mode === variables.mode ? ({ ...m, tagScanResults: { ...m.tagScanResults!, [variables.mode]: [] } }) : (m)
                        ));
            }
            return data
        }
    })
}

export function useEspModulesInventoryItemShouldBeScanned() {
    return useMutation({
        mutationKey: ["clearESPModulesInventoryItemShouldBeScanned"],
        mutationFn: (vars: { epcList: string[]; }) => {
            const controller = new AbortController();

            return api<Product[]>(
                `/api/jrd/inventory-item-should-be-scanned`,
                {
                    method: "POST",
                    signal: controller.signal,
                    body: JSON.stringify({ epcList: vars.epcList })
                },
            )
        },
    })
}