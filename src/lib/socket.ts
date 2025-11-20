// src/lib/socket.ts
import { io, Socket } from "socket.io-client";
import type { Product } from "./api";
import type { Tag } from "../api/tags";
import type { Mode } from "../api/modules";
import type { CurrentScenarioRow } from "../api/jrdDevices";
import type { Esp32ClientInfo } from "../api/espModules";

export type ScanResult =
    | { Scan: Product[]; Inventory?: Product[]; NewProduct?: Tag[], deviceId: string }
    | { Inventory: Product[]; Scan?: Product[]; NewProduct?: Tag[], deviceId: string }
    | { NewProduct: Tag[]; Scan?: Product[]; Inventory?: Product[], deviceId: string };

export type ServerToClientEvents = {
    // Example events — add yours:
    "esp-modules-new-scan-recieved": (payload: Partial<Esp32ClientInfo>) => void;
    "esp-modules-status-updated": (payload: Partial<Esp32ClientInfo>) => void;
    "new-scan-result": (payload: ScanResult) => void;
    "backupProgress": (payload: Record<"backup_db" | "backup_files", number>) => void
    "restoreProgress": (payload: Record<"restore_db" | "restore_files", number>) => void
    "update-current-scenario": (payload: { mode: Mode, data: CurrentScenarioRow[] }) => void;
};

export type ClientToServerEvents = {

};

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * IMPORTANT for cookie-based auth:
 * - withCredentials: true => browser sends cookies on the handshake request
 * - server must read cookies from handshake (e.g., using cookie-parser)
 */
export const socket: AppSocket = io(
    import.meta.env.VITE_SOCKET_URL ?? window.location.origin,
    {
        autoConnect: false,          // we control when to connect
        transports: ["websocket"],   // avoid long-polling if your server supports WS
        withCredentials: true,       // send cross-site cookies if needed (CORS must allow it)
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        randomizationFactor: 0.5,
    }
);

/** Helper to (re)connect safely (idempotent). */
export function ensureSocketConnected() {
    if (!socket.connected && socket.disconnected) {
        socket.connect();
    }
}

// In dev, make sure HMR doesn't leave zombie sockets
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        try { socket.removeAllListeners(); socket.close(); } catch { }
    });
}