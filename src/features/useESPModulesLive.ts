import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Esp32ClientInfo, Esp32StatusPayload } from "../api/espModules";
import type { Mode } from "../api/modules";
import { useSocketStore } from "../store/socketStore";


export function useESPModulesLive(refetchOnReconnect = true) {
    const qc = useQueryClient();
    const socket = useSocketStore(s => s.socket);


    useEffect(() => {
        const onESPModulesRegistrationUpdate = (payload: Partial<Esp32ClientInfo>[]) => {
            qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"], (prev) => {
                const next: Esp32ClientInfo[] = [];

                for (const patch of payload) {
                    if (patch.id == null) continue;

                    const old = (prev ?? []).find(m => m.id === patch.id);

                    if (old) {
                        next.push({ ...old, ...patch });
                    } else {
                        next.push({ ...patch } as Esp32ClientInfo);
                    }
                }

                return next;
            })
        }
        const onESPModulesStatusUpdate = (payload: Partial<Esp32StatusPayload> & { id: number }) => {
            qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"], (prev) => {
                if (!prev) return prev;

                return prev.map(el =>
                    el.id === payload.id
                        ? { ...el, ...payload }
                        : el
                );
            })
        }

        const onESPModulesUpdatePower = (payload: { id: number, currentHardPower: number, currentSoftPower: number }) => {
            qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"], (prev) => {
                if (!prev) return prev;

                return prev.map(el => el.id === payload.id ? ({ ...el, currentHardPower: payload.currentHardPower, currentSoftPower: payload.currentSoftPower }) : el)
            });
        }

        const onESPModulesUpdateIsActive = (payload: { id: number, isActive: boolean }) => {
            qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"], (prev) => {
                if (!prev) return prev;

                return prev.map(el => el.id === payload.id ? ({ ...el, isActive: payload.isActive }) : el)
            });
        }

        const onESPModulesUpdateMode = (payload: { id: number, mode: Mode }) => {
            qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"], (prev) => {
                if (!prev) return prev;

                return prev.map(el => el.id === payload.id ? ({ ...el, mode: payload.mode }) : el)
            });
        }

        const onStartESPModulesScan = (payload: { id: number }) => {
            qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"], (prev) => {
                if (!prev) return prev;

                return prev.map(el => el.id === payload.id ? ({ ...el, isScan: true }) : el)
            });
        }

        const onStopESPModulesScan = (payload: { id: number }) => {
            qc.setQueryData<Esp32ClientInfo[]>(["esp-modules"], (prev) => {
                if (!prev) return prev;

                return prev.map(el => el.id === payload.id ? ({ ...el, isScan: false }) : el)
            });
        }

        socket.on("esp-modules-registration-updated", onESPModulesRegistrationUpdate);
        socket.on("esp-modules-status-updated", onESPModulesStatusUpdate);
        socket.on("esp-modules-updated-power", onESPModulesUpdatePower);
        socket.on("esp-modules-updated-is-active", onESPModulesUpdateIsActive);
        socket.on("esp-modules-updated-mode", onESPModulesUpdateMode);
        socket.on("esp-modules-updated-mode", onESPModulesUpdateMode);
        socket.on("esp-modules-start-scan", onStartESPModulesScan);
        socket.on("esp-modules-stop-scan", onStopESPModulesScan);

        const onReconnect = () => {
            if (refetchOnReconnect) qc.invalidateQueries({ queryKey: ["esp-modules"] });
        };
        socket.io.on("reconnect", onReconnect);

        return () => {
            socket.off("esp-modules-stop-scan", onStopESPModulesScan);
            socket.off("esp-modules-start-scan", onStartESPModulesScan);
            socket.off("esp-modules-updated-mode", onESPModulesUpdateMode);
            socket.off("esp-modules-updated-is-active", onESPModulesUpdateIsActive);
            socket.off("esp-modules-updated-power", onESPModulesUpdatePower);
            socket.off("esp-modules-status-updated", onESPModulesStatusUpdate);
            socket.off("esp-modules-registration-updated", onESPModulesRegistrationUpdate);
            socket.io.off("reconnect", onReconnect);
        };
    }, [qc, socket, refetchOnReconnect]);
}
