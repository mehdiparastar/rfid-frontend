// src/features/inventory/useScanResultsLive.ts
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Esp32ClientInfo } from "../api/espModules";
import { useSocketStore } from "../store/socketStore";


export function useESPModulesLive(refetchOnReconnect = true) {
    const qc = useQueryClient();
    const socket = useSocketStore(s => s.socket);


    useEffect(() => {
        const onNewResult = (payload: Partial<Esp32ClientInfo>) => {

            qc.setQueryData<Esp32ClientInfo>(["esp-modules"], (prev) => {
                return prev;
            });
        };

        const onUpdateCurrentScenario = (payload: Partial<Esp32ClientInfo>) => {
            qc.setQueryData<Esp32ClientInfo>(["esp-modules"], (prev) => {
                return prev
            })
        }

        socket.on("esp-modules-new-scan-recieved", onNewResult);
        socket.on("esp-modules-status-updated", onUpdateCurrentScenario);

        const onReconnect = () => {
            if (refetchOnReconnect) qc.invalidateQueries({ queryKey: ["esp-modules"] });
        };
        socket.io.on("reconnect", onReconnect);

        return () => {
            socket.off("esp-modules-new-scan-recieved", onNewResult);
            socket.off("esp-modules-status-updated", onUpdateCurrentScenario);
            socket.io.off("reconnect", onReconnect);
        };
    }, [qc, socket, refetchOnReconnect]);
}
