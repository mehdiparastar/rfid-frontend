import { create } from "zustand";
import { ensureSocketConnected, socket, type AppSocket } from "../lib/socket";

type SocketState = {
    socket: AppSocket;
    isConnected: boolean;
    listenersBound: boolean;
    connect: () => void;
    disconnect: (hard?: boolean) => void;
};

export const useSocketStore = create<SocketState>((set, get) => ({
    socket,
    isConnected: socket.connected,
    listenersBound: false,

    connect: () => {
        const s = get().socket;

        // bind listeners only once
        if (!get().listenersBound) {
            s.on("connect", () => set({ isConnected: true }));
            s.on("disconnect", () => set({ isConnected: false }));
            s.on("connect_error", () => set({ isConnected: false }));
            set({ listenersBound: true });
        }

        ensureSocketConnected();
    },


    disconnect: (hard = false) => {
        const s = get().socket;

        // Hard disconnect: fully stop and clear listeners to avoid leaks across logouts
        if (hard) {
            try { s.removeAllListeners(); } catch { }
            set({ listenersBound: false });
            // prevent immediate reconnection race after logout:
            s.io.opts.reconnection = false;
            s.disconnect();
            s.io.opts.reconnection = true; // restore default for next login
        } else {
            s.disconnect();
        }

        set({ isConnected: false });
    },
}));
