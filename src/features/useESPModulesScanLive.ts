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
                if (!prev) return

                const next: Esp32ClientInfo[] = [];
                for (const m of prev) {
                    let inventoryTagScanResults: ESPModulesProductScan[] = []

                    for (const patch of payload) {
                        if (m.id === patch.deviceId) {
                            const oldScannedProduct = (m?.tagScanResults?.Inventory ?? []).find(p => p.id === patch.id)

                            if (oldScannedProduct) {
                                inventoryTagScanResults = (m.tagScanResults?.Inventory ?? []).map(p => p.id === patch.id ? ({ ...oldScannedProduct, ...patch }) : p) as ESPModulesProductScan[]
                            } else {
                                inventoryTagScanResults = [...(m.tagScanResults?.Inventory ?? []), patch]
                            }
                        }
                    }

                    next.push({
                        ...m,
                        tagScanResults: {
                            ...m.tagScanResults,
                            Inventory: inventoryTagScanResults,
                            Scan: m.tagScanResults?.Scan ?? [],
                            NewProduct: m.tagScanResults?.NewProduct ?? []
                        }
                    })
                }

                return next
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
