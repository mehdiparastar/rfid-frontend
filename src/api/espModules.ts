import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { serialSafeQueryDefaults, type Mode } from "./modules";
import type { Tag } from "./tags";

type TagScan = Partial<Tag> & { scantimestamp: number }
type TagScanResults = Record<Mode, TagScan[]>;
interface Esp32StatusPayload {
    rssi: number;

    batteryVoltage: number;
    batteryPercent: number;
    powerSource: 'USB' | 'BATTERY';

    esp: {
        chipModel: string;
        chipRevision: number;
        cores: number;
        sdkVersion: string;
        cpuFreqMHz: number;

        flashSize: number;
        flashSpeed: number;

        heapFree: number;
        sketchSize: number;
        sketchFree: number;

        mac: string;

        resetReasonCpu0: number;
        resetReasonCpu1: number;
    };

    timestamp: number; // epoch milliseconds
}

export interface Esp32ClientInfo {
    id?: string;
    ip?: string;
    socket: WebSocket;
    lastSeen: number;
    mode: Mode;
    currentHardPower: number; // in dbm ben 15 and 26
    currentSoftPower: number; // enable if request power be less than 15
    isActive: boolean;
    isScan: boolean;
    tagScanResults: TagScanResults;
    status?: Esp32StatusPayload;
}
export function useEspModules() {
    return useQuery({
        queryKey: ["esp-modules"],
        queryFn: ({ signal }) => api<Esp32ClientInfo>(`/api/jrd/all-connected-esp-modules`, { signal }),
        ...serialSafeQueryDefaults,
    });
}