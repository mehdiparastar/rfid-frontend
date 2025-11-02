// useRestoreProgress.ts (fix for cleanup return type)
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocketStore } from "../store/socketStore";
import { restoreProgress } from "../api/queryKeys";

interface RestoreProgress {
    restoreDBProgress: number;
    restoreFilesProgress: number;
}

const initialProgress: RestoreProgress = {
    restoreDBProgress: 0,
    restoreFilesProgress: 0,
};

export function useRestoreProgress() {
    const socket = useSocketStore(s => s.socket);
    const queryClient = useQueryClient();

    const { data: progressData = initialProgress } = useQuery({
        queryKey: restoreProgress,
        queryFn: () => initialProgress,
        initialData: initialProgress,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });

    useEffect(() => {
        const onRestoreProgress = (data: Record<"restore_db" | "restore_files", number>) => {
            const [[restoreType, newProgress]] = Object.entries(data);

            queryClient.setQueryData<RestoreProgress>(restoreProgress, (prev = initialProgress) => {
                if (restoreType === "restore_db") {
                    return { ...prev, restoreDBProgress: newProgress };
                }
                if (restoreType === "restore_files") {
                    return { ...prev, restoreFilesProgress: newProgress };
                }

                return prev;
            });
        };

        socket.on("restoreProgress", onRestoreProgress);

        return () => {
            socket.off("restoreProgress", onRestoreProgress);
        };
    }, [socket, queryClient]);

    const resetProgress = () => {
        queryClient.setQueryData(restoreProgress, initialProgress);
    };

    return {
        ...progressData,
        resetProgress,
        isComplete: progressData.restoreDBProgress >= 100 && progressData.restoreFilesProgress >= 100,
    };
}