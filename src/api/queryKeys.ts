import type { Mode } from "./modules";

export const scenarioKey = ["scenario"] as const;

export const scanResultsKey = (mode: Mode) => ["scan-results", mode] as const;
