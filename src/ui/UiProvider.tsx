import React, {
    createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

// ---- Performance: create caches once (no re-creation on each render)
const ltrCache = createCache({ key: "mui", prepend: true });
const rtlCache = createCache({ key: "mui-rtl", stylisPlugins: [prefixer, rtlPlugin], prepend: true });

type Mode = "light" | "dark";
type Dir = "ltr" | "rtl";

const STORAGE = { mode: "ui-mode", dir: "ui-dir" };

function loadInitialMode(): Mode {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem(STORAGE.mode) as Mode | null;
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function loadInitialDir(): Dir {
    if (typeof window === "undefined") return "ltr";
    const saved = localStorage.getItem(STORAGE.dir) as Dir | null;
    if (saved === "ltr" || saved === "rtl") return saved;
    const htmlDir = document.documentElement.getAttribute("dir");
    if (htmlDir === "rtl" || htmlDir === "ltr") return htmlDir as Dir;
    const rtlLangs = ["ar", "fa", "he", "ur"];
    const lang = navigator.language?.slice(0, 2).toLowerCase();
    return rtlLangs.includes(lang) ? "rtl" : "ltr";
}

type UiContextValue = {
    mode: Mode;
    dir: Dir;
    setMode: (m: Mode) => void;
    setDir: (d: Dir) => void;
    toggleMode: () => void;
    toggleDir: () => void;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<Mode>(loadInitialMode);
    const [dir, setDir] = useState<Dir>(loadInitialDir);

    // Persist + reflect in <html> for native scrollbars & layout
    useEffect(() => {
        localStorage.setItem(STORAGE.mode, mode);
        document.documentElement.setAttribute("data-mode", mode);
    }, [mode]);

    useEffect(() => {
        localStorage.setItem(STORAGE.dir, dir);
        document.documentElement.dir = dir;
    }, [dir]);

    const toggleMode = useCallback(() => {
        setMode((m) => (m === "light" ? "dark" : "light"));
    }, []);
    const toggleDir = useCallback(() => {
        setDir((d) => (d === "ltr" ? "rtl" : "ltr"));
    }, []);

    // Recreate theme ONLY when mode or dir changes
    const theme = useMemo(
        () =>
            createTheme({
                direction: dir,
                palette: { mode },
                // Add your shared design tokens here to avoid recalculations elsewhere
                // shape: { borderRadius: 12 },
            }),
        [dir, mode]
    );

    const cache = dir === "rtl" ? rtlCache : ltrCache;

    const value = useMemo(
        () => ({ mode, dir, setMode, setDir, toggleMode, toggleDir }),
        [mode, dir, toggleMode, toggleDir]
    );

    return (
        <UiContext.Provider value={value}>
            <CacheProvider value={cache}>
                <ThemeProvider theme={theme}>
                    {/* enableColorScheme -> native UI (scrollbars, form controls) match dark/light */}
                    <CssBaseline enableColorScheme />
                    {children}
                </ThemeProvider>
            </CacheProvider>
        </UiContext.Provider>
    );
}

export function useUi() {
    const ctx = useContext(UiContext);
    if (!ctx) throw new Error("useUi must be used within UiProvider");
    return ctx;
}
