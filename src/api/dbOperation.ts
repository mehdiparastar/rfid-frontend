import { useMutation } from "@tanstack/react-query";
import { api, apiUpload } from "../lib/api";

export function useBackupRequest() {
    return useMutation({
        mutationKey: ["backup-request"],
        mutationFn: () => api<{ url: string }>(`/api/db-operations/backup-request`, { method: "GET" }),
        retry: 5,
    });
}


interface UploadResponse {
    success: boolean;
    message: string;
    // Add other fields as needed, e.g., fileId?: string
}

interface RestoreBackupArgs {
    file: File;
    onProgress: (percent: number) => void;
}

export function useRestoreBackup() {
    return useMutation<UploadResponse, unknown, RestoreBackupArgs>({
        mutationFn: async ({ file, onProgress }) => {
            const formData = new FormData();
            formData.append('backupZipFile', file);

            return apiUpload<UploadResponse>(
                '/api/db-operations/restore-backup',
                formData,
                (percent, /*loaded, total*/) => {
                    onProgress(percent);
                },
                'POST' // Or 'PUT' if needed
            );
        },
        // Add shared logic here if needed, e.g., onSuccess: () => qc.invalidateQueries({ queryKey: ['backups'] })
    });
}