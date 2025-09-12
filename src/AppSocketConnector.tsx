import { useEffect } from "react";
import { useSocketStore } from "./store/socketStore";

export function AppSocketConnector() {
    const connect = useSocketStore((s) => s.connect);
    const disconnect = useSocketStore((s) => s.disconnect);

    useEffect(() => {
        connect(); // kicks off handshake; cookies go automatically
        return () => disconnect(true); // HARD teardown on unmount (logout/nav away)
    }, [connect, disconnect]);

    return null; // just a lifecycle helper
}
