import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { Esp32ClientInfo } from "../api/espModules";
import dingUrl from "../assets/sounds/ding.mp3"; // Vite: imports as URL
import type { ScanMode } from "../constants/scanMode";
import type { ESPModulesProductScan } from "../lib/socket";
import { useSocketStore } from "../store/socketStore";


export function useESPModulesScanLive(refetchOnReconnect = true) {
    const qc = useQueryClient();
    const socket = useSocketStore(s => s.socket);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // create & preload once
        const a = new Audio(dingUrl);
        a.preload = "auto";
        a.volume = 1.0; // tweak if needed
        audioRef.current = a;

        return () => {
            a.pause();
            audioRef.current = null;
        };
    }, []);

    useEffect(() => {
        const onESPModulesNewScanRecieved = (payload: ESPModulesProductScan[]) => {
            qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"], (prev) => {
                if (!prev) return

                const next: Esp32ClientInfo[] = [];
                for (const m of prev) {
                    const moduleMode = m.mode as "Inventory" | "Scan"
                    let moduleModeTagScanResults: ESPModulesProductScan[] = []

                    for (const patch of payload) {
                        if (m.id === patch.deviceId) {
                            const oldScannedProduct = (m?.tagScanResults?.[moduleMode] ?? []).find(p => p.id === patch.id)

                            if (oldScannedProduct) {
                                moduleModeTagScanResults = (m.tagScanResults?.[moduleMode] ?? []).map(p => p.id === patch.id ? ({ ...oldScannedProduct, ...patch }) : p) as ESPModulesProductScan[]
                            } else {
                                moduleModeTagScanResults = [...(m.tagScanResults?.[moduleMode] ?? []), patch] as ESPModulesProductScan[]
                                const a = audioRef.current;
                                if (a) {
                                    // restart sound if rapid events
                                    a.pause();
                                    a.currentTime = 0;
                                    // browsers may block without prior user interaction
                                    a.play().catch(() => {/* ignore */ });
                                }
                            }
                        }
                    }

                    next.push({
                        ...m,
                        tagScanResults: {
                            ...m.tagScanResults,
                            Inventory: m.tagScanResults?.Inventory ?? [],
                            Scan: m.tagScanResults?.Scan ?? [],
                            NewProduct: m.tagScanResults?.NewProduct ?? [],
                            [moduleMode]: moduleModeTagScanResults,
                        }
                    })
                }

                return next
            })
        }
        const onESPModulesClearScanHistoryByMode = (payload: { id: number, mode: ScanMode }) => {
            qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"], (prev) => {
                if (!prev) return prev

                return prev.filter(el => el.id != null).map(el => el.id === payload.id ? ({ ...el, tagScanResults: { ...el.tagScanResults!, [payload.mode]: [] } }) : el)
            })
        }


        socket.on("esp-modules-new-scan-recieved", onESPModulesNewScanRecieved);
        socket.on("esp-modules-clear-scan-history-by-mode", onESPModulesClearScanHistoryByMode);

        const onReconnect = () => {
            if (refetchOnReconnect) qc.invalidateQueries({ queryKey: ["esp-modules"] });
        };
        socket.io.on("reconnect", onReconnect);

        return () => {
            socket.off("esp-modules-new-scan-recieved", onESPModulesNewScanRecieved);
            socket.io.off("reconnect", onReconnect);
        };
    }, [qc, socket, refetchOnReconnect]);
}
