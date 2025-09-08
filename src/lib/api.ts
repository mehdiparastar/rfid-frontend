let refreshPromise: Promise<void> | null = null;
let isLoggedOut = false;

async function doRefresh() {
    if (isLoggedOut) {
        throw new Error("User is logged out, login again.");
    }

    const r = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    if (!r.ok) throw new Error("refresh failed");
}

export async function api<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
    const req = () =>
        fetch(input, {
            ...init,
            credentials: "include",
            headers: { "Content-Type": "application/json", ...(init.headers || {}) },
        });

    let res = await req();
    if (res.status === 401) {
        if (!refreshPromise) refreshPromise = doRefresh().finally(() => (refreshPromise = null));
        try {
            await refreshPromise;
        } catch (ex) {
            // refresh failed -> bubble 401
            isLoggedOut = true; // Set flag to indicate the user is logged out
            throw ex;
        }
        res = await req(); // retry once
    }
    if (!res.ok) throw new Error((await res.text()) || "Request failed");
    // Some endpoints (logout) may return empty
    const text = await res.text();
    return (text ? JSON.parse(text) : ({} as T)) as T;
}
