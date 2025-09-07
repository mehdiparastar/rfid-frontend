let refreshPromise: Promise<void> | null = null;

async function doRefresh() {
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
        } catch {
            // refresh failed -> bubble 401
            throw new Error("Unauthorized");
        }
        res = await req(); // retry once
    }
    if (!res.ok) throw new Error((await res.text()) || "Request failed");
    // Some endpoints (logout) may return empty
    const text = await res.text();
    return (text ? JSON.parse(text) : ({} as T)) as T;
}
