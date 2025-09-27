// src/features/inventory/useScanResultsLive.ts
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { Mode } from "../api/modules";
import { scanResultsKey } from "../api/queryKeys";
import type { ScanResult } from "../lib/socket";
import { useSocketStore } from "../store/socketStore";
import dingUrl from "../assets/sounds/ding.mp3"; // Vite: imports as URL

/** Minimal upsert by id/epc, newest first, cap at maxItems */
function upsert(list: ScanResult[] | undefined, item: ScanResult, maxItems = 500) {
    const key = item.id ?? item.epc;
    if (!key) return list ?? [];
    const arr = list ? [...list] : [];
    const i = arr.findIndex(r => (r.id ?? r.epc) === key);
    if (i >= 0) arr.splice(i, 1);
    arr.unshift(item);
    if (arr.length > maxItems) arr.length = maxItems;
    return arr;
}

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
        const onResult = (payload: ScanResult) => {
            // play ding
            const a = audioRef.current;
            if (a) {
                // restart sound if rapid events
                a.pause();
                a.currentTime = 0;
                // browsers may block without prior user interaction
                a.play().catch(() => {/* ignore */ });
            }
            qc.setQueryData<ScanResult[]>(key, (prev) => upsert(prev, payload, maxItems));
        };

        socket.on("new-scan-result", onResult);

        const onReconnect = () => {
            if (refetchOnReconnect) qc.invalidateQueries({ queryKey: key });
        };
        socket.io.on("reconnect", onReconnect);

        return () => {
            socket.off("new-scan-result", onResult);
            socket.io.off("reconnect", onReconnect);
        };
    }, [qc, socket, key, mode, maxItems, refetchOnReconnect]);
}
