import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Esp32ClientInfo } from "../api/espModules";
import { useSocketStore } from "../store/socketStore";
import type { ESPModulesProductScan, ESPModulesScanResult } from "../lib/socket";
import type { Mode } from "../api/modules";


export function useESPModulesScanLive(refetchOnReconnect = true) {
    const qc = useQueryClient();
    const socket = useSocketStore(s => s.socket);

    useEffect(() => {
        const onESPModulesNewScanRecieved = (payload: ESPModulesProductScan[]) => {
            qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"], (prev) => {
                const next: Esp32ClientInfo[] = [];

                for (const patch of payload) {

                    const old = (prev ?? []).filter(m => m.id != null).find(m => m.id! === patch.deviceId);
                    const oldScanned = (old?.tagScanResults?.Inventory ?? []).find(p => p.id === patch.id)

                    if (old && oldScanned) {
                        next.push({
                            ...old,
                            tagScanResults: {
                                ...old.tagScanResults,
                                Inventory: (old.tagScanResults?.Inventory ?? []).map(el => el.id === oldScanned.id ? patch : el) ?? [],
                                Scan: old.tagScanResults?.Scan ?? [],
                                NewProduct: old.tagScanResults?.NewProduct ?? []
                            }
                        });
                    } else if (old && !oldScanned) {
                        next.push({
                            ...old,
                            tagScanResults: {
                                ...old.tagScanResults,
                                Inventory: [...(old.tagScanResults?.Inventory ?? []), patch],
                                Scan: old.tagScanResults?.Scan ?? [],
                                NewProduct: old.tagScanResults?.NewProduct ?? []
                            }
                        });
                    }
                }

                return next;
            })
        }
        const onESPModulesClearScanHistoryByMode = (payload: { id: number, mode: Mode }) => {
            qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"], (prev) => {
                if (!prev) return prev

                return prev.filter(el => el.id != null).map(el => el.id === payload.id ? ({ ...el, tagScanResults: { ...el.tagScanResults!, [payload.mode]: [] } }) : el)
            })
        }


        socket.on("esp-modules-new-inventory-scan-recieved", onESPModulesNewScanRecieved);
        socket.on("esp-modules-clear-scan-history-by-mode", onESPModulesClearScanHistoryByMode);

        const onReconnect = () => {
            if (refetchOnReconnect) qc.invalidateQueries({ queryKey: ["esp-modules"] });
        };
        socket.io.on("reconnect", onReconnect);

        return () => {
            socket.off("esp-modules-new-inventory-scan-recieved", onESPModulesNewScanRecieved);
            socket.io.off("reconnect", onReconnect);
        };
    }, [qc, socket, refetchOnReconnect]);
}
