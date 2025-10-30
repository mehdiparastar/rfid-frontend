import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useBackupRequest() {
    return useMutation({
        mutationKey: ["backup-request"],
        mutationFn: () => api<{ url: string }>(`/api/db-operations/backup-request`, { method: "GET" }),
        retry: 5,
    });
}