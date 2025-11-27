// module-prefs.ts
import * as React from "react";

type Mode = "Inventory" | "Scan" | "NewProduct";
export type PowerMap = Record<string, number>;
export type ActiveMap = Record<string, boolean>;
export type ModeMap = Record<string, Mode>;

type PrefsV1 = {
  version: 1;
  powerById: PowerMap;
  activeById: ActiveMap;
  modeById: ModeMap;
};

const KEY = "modulePrefs:v1";
export const MINPowerPercent = 5;
export const MAXPowerPercent = 100;
const clamp = (v: number) => Math.min(Math.max(v, MINPowerPercent), MAXPowerPercent);

const defaultPrefs: PrefsV1 = { version: 1, powerById: {}, activeById: {}, modeById: {} };

// — storage utils —
function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota/private mode — ignore */ }
}

export function useModulePrefs() {
  const [state, setState] = React.useState<PrefsV1>(() => readJSON(KEY, defaultPrefs));

  // persist on change
  React.useEffect(() => { writeJSON(KEY, state); }, [state]);

  // cross-tab sync
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try { setState(JSON.parse(e.newValue) as PrefsV1); } catch { }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // actions
  const setPowerFor = React.useCallback((id: string, v: number) => {
    setState(s => ({ ...s, powerById: { ...s.powerById, [id]: clamp(v) } }));
  }, []);

  const setActiveFor = React.useCallback((id: string, active: boolean) => {
    setState(s => ({ ...s, activeById: { ...s.activeById, [id]: !!active } }));
  }, []);

  const toggleActive = React.useCallback((id: string) => {
    setState(s => ({ ...s, activeById: { ...s.activeById, [id]: !s.activeById[id] } }));
  }, []);

  const setModeFor = React.useCallback((id: string, mode: Mode) => {
    setState(s => ({ ...s, modeById: { ...s.modeById, [id]: mode } }));
  }, []);

  const cycleMode = React.useCallback((id: string) => {
    setState(s => {
      const current = s.modeById[id] ?? "Inventory";
      const next = current === "Inventory" ? "Scan" : current === "Scan" ? "NewProduct" : "Inventory";
      return { ...s, modeById: { ...s.modeById, [id]: next } };
    });
  }, []);

  const removeId = React.useCallback((id: string) => {
    setState(s => {
      const { [id]: _p, ...restP } = s.powerById;
      const { [id]: _a, ...restA } = s.activeById;
      const { [id]: _m, ...restM } = s.modeById;
      return { ...s, powerById: restP, activeById: restA, modeById: restM };
    });
  }, []);

  const clearAll = React.useCallback(() => setState(defaultPrefs), []);

  return {
    powerById: state.powerById,
    activeById: state.activeById,
    modeById: state.modeById,
    setPowerFor,
    setActiveFor,
    toggleActive,
    setModeFor,
    cycleMode,
    removeId,
    clearAll,
  };
}
