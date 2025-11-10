// src/features/inventory/useScanResultsLive.ts
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { CurrentScenarioRow } from "../api/jrdDevices";
import type { Mode } from "../api/modules";
import { scanResultsKey } from "../api/queryKeys";
import type { Tag } from "../api/tags";
import dingUrl from "../assets/sounds/ding.mp3"; // Vite: imports as URL
import type { Product } from "../lib/api";
import type { ScanResult } from "../lib/socket";
import { useSocketStore } from "../store/socketStore";


export function useScanResultsLive(mode: Mode, maxItems = 5000, refetchOnReconnect = true) {
    const qc = useQueryClient();
    const socket = useSocketStore(s => s.socket);
    const key = scanResultsKey(mode);
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
        const onNewResult = (payload: ScanResult) => {
            // play ding
            const a = audioRef.current;
            if (a) {
                // restart sound if rapid events
                a.pause();
                a.currentTime = 0;
                // browsers may block without prior user interaction
                a.play().catch(() => {/* ignore */ });
            }

            qc.setQueryData<ScanResult>(key, (prev) => {
                // Bootstrap if no cache yet
                const base: ScanResult = prev ?? {
                    Inventory: [] as Product[],
                    Scan: [] as Product[],
                    NewProduct: [] as Tag[],
                    deviceId: ""
                };
                // Clone top object and each array so references change
                const next: ScanResult = {
                    ...base,
                    Inventory: [...(base.Inventory || [])],
                    Scan: [...(base.Scan || [])],
                    NewProduct: [...(base.NewProduct || [])],
                };

                const [mode, values] = Object.entries(payload)[0] as [Mode, Product[] | Tag[]];

                if (mode === "Inventory" || mode === "Scan") {
                    const existing = new Set((next[mode] as Product[]).map(p => p.id));
                    for (const item of values as Product[]) {
                        if (!existing.has(item.id)) {
                            next[mode] = [...(next[mode] as Product[]), item]; // new array ref
                        }
                    }
                } else {
                    const existing = new Set((next[mode] as Tag[]).map(t => t.epc));
                    for (const item of values as Tag[]) {
                        if (!existing.has(item.epc)) {
                            next[mode] = [...(next[mode] as Tag[]), item]; // new array ref
                        }
                    }
                }

                return next; // <- new reference
            });
        };

        const onUpdateCurrentScenario = (payload: { mode: Mode, data: CurrentScenarioRow[] }) => {
            qc.setQueryData<CurrentScenarioRow[]>(['current-scenario'], () => {
                return payload.data
            })
        }

        socket.on("new-scan-result", onNewResult);
        socket.on("update-current-scenario", onUpdateCurrentScenario);

        const onReconnect = () => {
            if (refetchOnReconnect) qc.invalidateQueries({ queryKey: key });
        };
        socket.io.on("reconnect", onReconnect);

        return () => {
            socket.off("new-scan-result", onNewResult);
            socket.off("update-current-scenario", onUpdateCurrentScenario);
            socket.io.off("reconnect", onReconnect);
        };
    }, [qc, socket, key, mode, maxItems, refetchOnReconnect]);
}
