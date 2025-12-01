// ErrorSnack.tsx
import { useEffect, useMemo, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

export function ErrorSnack({
    deleteIsError,
    deleteError,
    t,
}: {
    deleteIsError: boolean;
    deleteError?: unknown;
    t: Record<string, string>;
}) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (deleteIsError) setOpen(true);
    }, [deleteIsError]);

    const serverMessage = useMemo(() => {
        try {
            const raw = (deleteError as Error)?.message ?? "";
            const parsed = JSON.parse(raw);
            return parsed?.message as string | undefined;
        } catch {
            return undefined;
        }
    }, [deleteError]);

    const message = useMemo(() => {
        const map: Record<string, string> = {
            "Cannot delete: product has related sales.": t["Cannot delete: product has related sales."],
            "You are not allowed to delete this product": t["You are not allowed to delete this product"],
            "Product not found": t["Product not found"],
        };

        return map[serverMessage ?? ""] ?? serverMessage ?? t["Something went wrong."];
    }, [serverMessage, t]);

    const handleClose = (
        _e?: React.SyntheticEvent | Event,
        reason?: "timeout" | "clickaway" | "escapeKeyDown"
    ) => {
        if (reason === "clickaway") return;
        setOpen(false);
    };

    return (
        <Snackbar
            open={open}
            autoHideDuration={6000}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
            <Alert severity="error" onClose={() => setOpen(false)} sx={{ width: "100%" }}>
                {message}
            </Alert>
        </Snackbar>
    );
}
