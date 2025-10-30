// useBackupProgress.ts (fix for cleanup return type)
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocketStore } from "../store/socketStore";
import { backupProgress } from "../api/queryKeys";

interface BackupProgress {
    backUpDBProgress: number;
    backupFilesProgress: number;
    url?: string;
}

const initialProgress: BackupProgress = {
    backUpDBProgress: 0,
    backupFilesProgress: 0,
    url: undefined,
};

export function useBackupProgress() {
    const socket = useSocketStore(s => s.socket);
    const queryClient = useQueryClient();

    const { data: progressData = initialProgress } = useQuery({
        queryKey: backupProgress,
        queryFn: () => initialProgress,
        initialData: initialProgress,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });

    useEffect(() => {
        const onBackupProgress = (data: Record<"backup_db" | "backup_files", number>) => {
            const [[backupType, newProgress]] = Object.entries(data);

            queryClient.setQueryData<BackupProgress>(backupProgress, (prev = initialProgress) => {
                if (backupType === "backup_db") {
                    return { ...prev, backUpDBProgress: newProgress };
                }
                if (backupType === "backup_files") {
                    return { ...prev, backupFilesProgress: newProgress };
                }

                return prev;
            });
        };

        socket.on("backupProgress", onBackupProgress);

        return () => {
            socket.off("backupProgress", onBackupProgress);
        };
    }, [socket, queryClient]);

    const resetProgress = () => {
        queryClient.setQueryData(backupProgress, initialProgress);
    };

    return {
        ...progressData,
        resetProgress,
        isComplete: progressData.backUpDBProgress >= 100 && progressData.backupFilesProgress >= 100,
    };
}