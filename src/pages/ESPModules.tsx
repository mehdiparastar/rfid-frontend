import { Settings } from "@mui/icons-material";
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Container,
    Grid,
    IconButton,
    LinearProgress,
    Skeleton,
    Slider,
    Stack,
    Tooltip,
    Typography,
    useTheme
} from "@mui/material";
import { useRef } from "react";
import { useEspModules, useSetESPModulePower, useSetESPModulesIsActive, useSetESPModulesMode } from "../api/espModules";
import { IsActiveSwitch } from "../components/IsActiveSwitch";
import type { ScanMode } from "../constants/scanMode";
import { useESPModulesLive } from "../features/useESPModulesLive";
import { RFIDIcon } from "../svg/RFIDIcon/RFIDIcon";
import { powerDbmToPercent, powerPercentToDbm } from "../utils/percentDbm";
import { translate } from "../utils/translate";
import ESPModulesScanMode from "./ESPModulesScanMode/ESPModulesScanMode";


export default function ESPModules() {
    const box1Ref = useRef<HTMLDivElement>(null);
    const box2Ref = useRef<HTMLDivElement>(null);

    const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
        if (!ref.current) return;

        const element = ref.current;
        const top = element.getBoundingClientRect().top + window.scrollY - 64; // AppBar height
        window.scrollTo({ top, behavior: "smooth" });
    };

    const theme = useTheme();
    const ln = theme.direction === "ltr" ? "en" : "fa";
    const t = translate(ln)!;

    const { data: espModules = [], isLoading: espModulesIsLoading, isError } = useEspModules();
    const { mutate: setESPModulesPower, isPending: setESPModulesPowerIsPending } = useSetESPModulePower()
    const { mutate: setESPModulesIsActive, isPending: setESPModulesIsActiveIsPending } = useSetESPModulesIsActive()
    const { mutate: setESPModulesMode, isPending: setESPModulesModeIsPending } = useSetESPModulesMode()

    useESPModulesLive(true)

    const isPending = setESPModulesPowerIsPending || setESPModulesIsActiveIsPending || setESPModulesModeIsPending

    return (
        <>
            {/* === FIXED LEFT ICON BAR === */}
            < Stack
                spacing={1}
                sx={{
                    position: "fixed",
                    top: "50%",
                    right: 10,
                    transform: "translateY(-50%)",
                    zIndex: 2000,
                    background: theme.palette.mode === "light" ? "rgba(255,255,255,0.7)" : "rgba(60, 60, 60, 0.5)",
                    p: 0,
                    borderRadius: 1,
                    boxShadow: 2,
                }}
            >
                <IconButton color="primary" onClick={() => scrollTo(box1Ref)}>
                    <Settings />
                </IconButton>

                <Tooltip placement="left" title={t["Inventory"]}>
                    <IconButton color="primary" onClick={() => scrollTo(box2Ref)}>
                        <RFIDIcon />
                    </IconButton>
                </Tooltip>
            </Stack >

            {/* === MAIN PAGE CONTENT === */}
            < Container maxWidth="xl" sx={{ mb: 12 }}>
                <Box ref={box1Ref} p={1} px={0}>
                    <Stack direction={'row'} gap={2}>
                        <Typography variant="h5" mb={3} fontWeight={700}>
                            {t["Connected Modules"]}
                        </Typography>
                        {isPending && <CircularProgress />}
                    </Stack>


                    {/* Error State */}
                    {isError && (
                        <Typography color="error">
                            {t["An Error accured."]}
                        </Typography>
                    )}

                    {/* Loading Skeleton */}
                    {espModulesIsLoading && (
                        <Grid container spacing={2}>
                            {[1, 2].map((x) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={x}>
                                    <Card sx={{ borderRadius: 0, p: 1 }}>
                                        <Skeleton variant="rectangular" height={120} />
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* No Data */}
                    {!espModulesIsLoading && (espModules ?? []).length === 0 && (
                        <Typography sx={{ opacity: 0.6 }}>
                            {t["No ESP32 modules connected."]}
                        </Typography>
                    )}

                    {/* Main Content */}
                    <Grid container spacing={2}>
                        {[...(espModules ?? [])].filter(el => el.id != null).sort((a, b) => a.id! - b.id!).map((m, _, arr) => {
                            const count = arr.length

                            return (
                                <Grid
                                    size={{
                                        xs: 12,
                                        sm: count === 1 ? 12 : count === 2 ? 6 : 6,
                                        md: count === 1 ? 12 : count === 2 ? 6 : 4,
                                        lg: count === 1 ? 12 : count === 2 ? 6 : 4,
                                        xl: count === 1 ? 12 : count === 2 ? 6 : count === 3 ? 4 : 3
                                    }}
                                    key={m.id}
                                >
                                    <Card
                                        sx={{
                                            borderRadius: 0,
                                            boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
                                            transition: "0.2s",
                                            "&:hover": {
                                                transform: "translateY(-4px)",
                                                boxShadow: "0px 4px 15px rgba(0,0,0,0.15)",
                                            },
                                        }}
                                    >
                                        <LinearProgress variant="determinate" value={100} color={m.isScan ? "success" : "inherit"} />
                                        <CardHeader
                                            title={m.id}
                                            action={
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <BatteryIcon percentage={(m.status && m.status.batteryVoltage && Math.round(Math.min(100, Math.max(0, (((m.status.batteryVoltage) - 3.2) / (4.2 - 3.2)) * 100)))) ?? 50} />
                                                    <WifiIcon rssi={m.status?.rssi ?? -80} />
                                                </Box>
                                            }
                                        />

                                        <CardContent sx={{ p: 2 }}>
                                            <Stack gap={0.5} width={1} direction={'column'}>
                                                <Slider
                                                    disabled={m.isActive === false}
                                                    aria-label="power"
                                                    getAriaValueText={(value: number) => `${value}%`}
                                                    valueLabelDisplay="auto"
                                                    value={powerDbmToPercent(m.currentSoftPower < 15 ? m.currentSoftPower : m.currentHardPower)}
                                                    onChangeCommitted={(_, v) => {
                                                        if (typeof v === "number") {
                                                            setESPModulesPower({ deviceId: m.id!, power: powerPercentToDbm(v) ?? 15 })
                                                        }
                                                    }}
                                                    shiftStep={10}
                                                    step={null}
                                                    marks={[5, 8, 12, 16, 20, 24, 27, 31, 35, 39, 43, 47, 50, 54, 58, 62, 65, 69, 73, 77, 81, 85, 88, 92, 96, 100].map((value) => ({ value }))}
                                                    min={0}
                                                    max={110}
                                                    sx={{ width: 1 }}
                                                    color="warning"
                                                    slotProps={{
                                                        root: { style: { paddingBottom: 0 } },
                                                        rail: { style: { height: 24, borderTopRightRadius: 4, borderTopLeftRadius: 4, borderBottomRightRadius: 0, borderBottomLeftRadius: 0, } },
                                                        track: { style: { height: 22, borderTopRightRadius: 4, borderTopLeftRadius: 4, borderBottomRightRadius: 0, borderBottomLeftRadius: 0, backgroundColor: `hsl(${120 - ((powerDbmToPercent(m.currentSoftPower < 15 ? m.currentSoftPower : m.currentHardPower) || 58) * 1.2)}, 100%, 40%)` } },
                                                        thumb: { style: { color: theme.palette.warning.light, borderRadius: 2, height: 14, width: 14 } }
                                                    }}
                                                />
                                                <Stack justifyContent={'space-between'} bgcolor={theme.palette.mode === 'light' ? 'whitesmoke' : theme.palette.divider} direction={'row'} mb={-1.5} alignItems="center" width={1}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1 }}>
                                                        <Stack direction={'row'} gap={0.5} >
                                                            {(["Inventory", "Scan", "NewProduct"] as ScanMode[]).map((mMode) => (
                                                                <Chip
                                                                    disabled={m.isActive === false}
                                                                    key={mMode}
                                                                    size="small"
                                                                    clickable
                                                                    label={t[mMode]}
                                                                    color={m.mode === mMode ? "success" : "default"}
                                                                    variant={"filled"}
                                                                    onClick={() => {
                                                                        setESPModulesMode({ deviceId: m.id!, mode: mMode })
                                                                    }}
                                                                    sx={{ fontWeight: m.mode === mMode ? 'bold' : 'inherit', borderRadius: 0.2 }}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    </Box>

                                                    <IsActiveSwitch
                                                        disabled={m.isScan}
                                                        color="success"
                                                        checked={m.isActive}
                                                        onChange={(_, c) => {
                                                            setESPModulesIsActive({ deviceId: m.id!, isActive: c })
                                                        }}
                                                    />
                                                </Stack>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )
                        })}
                    </Grid>
                </Box>
                <Box ref={box2Ref} >
                    <ESPModulesScanMode />
                </Box>
            </Container>
        </>
    );
}


export function BatteryIcon({ percentage = 0 }) {
    const level = Math.min(Math.max(percentage, 0), 100);
    const color =
        level > 40 ? "limegreen" : level > 20 ? "gold" : "red";

    return (
        <Box width={65} height={22}>
            <svg
                width="65"
                height="22"
                viewBox="0 0 65 22"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Battery Outline */}
                <rect
                    x="1"
                    y="4"
                    width="26"
                    height="14"
                    rx="3"
                    stroke="#666"
                    strokeWidth="2"
                    fill="transparent"
                />

                {/* Battery head */}
                <rect
                    x="29"
                    y="8"
                    width="3"
                    height="6"
                    rx="1"
                    fill="#666"
                />

                {/* Battery Fill */}
                <rect
                    x="2.4"
                    y="5.2"
                    width={(level / 100) * 22.5}
                    height="11.5"
                    rx="2"
                    fill={color}
                />

                {/* Percentage Text INSIDE SVG */}
                <text
                    x="46"
                    y="15"
                    fontSize="12"
                    fontWeight="600"
                    textAnchor="middle"
                    fill={color}
                >
                    {level}%
                </text>
            </svg>
        </Box>
    );
}

export function NoBatteryIcon() {
    return (
        <Box width={65} height={22}>
            <svg
                width="65"
                height="22"
                viewBox="0 0 65 22"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Battery Outline */}
                <rect
                    x="1"
                    y="4"
                    width="26"
                    height="14"
                    rx="3"
                    stroke="#666"
                    strokeWidth="2"
                    fill="transparent"
                />

                {/* Battery head */}
                <rect
                    x="29"
                    y="8"
                    width="3"
                    height="6"
                    rx="1"
                    fill="#666"
                />

                {/* 🔥 DAMAGED BATTERY RED CROSS */}
                <line
                    x1="6"
                    y1="2"
                    x2="22"
                    y2="20"
                    stroke="red"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <line
                    x1="22"
                    y1="2"
                    x2="6"
                    y2="20"
                    stroke="red"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            </svg>
        </Box>
    )
}


export function WifiIcon({ rssi = -90 }) {
    const strength = Math.min(Math.max(((rssi + 90) / 30) * 100, 0), 100);

    const color = strength > 40 ? "limegreen" : "red";

    return (
        <Box width={28} height={28}>
            <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Background (Outline WiFi icon) */}
                <path
                    d="M4 10C8 6 20 6 24 10"
                    stroke="#777"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path
                    d="M7 14C11 10 17 10 21 14"
                    stroke="#777"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path
                    d="M10 18C13 15 15 15 18 18"
                    stroke="#777"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <circle
                    cx="14"
                    cy="22"
                    r="2"
                    fill="#777"
                />

                {/* ACTIVE SIGNAL colored by strength */}
                {/* 1st ring */}
                {strength > 20 && (
                    <path
                        d="M10 18C13 15 15 15 18 18"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                )}

                {/* 2nd ring */}
                {strength > 50 && (
                    <path
                        d="M7 14C11 10 17 10 21 14"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                )}

                {/* 3rd ring (strongest) */}
                {strength > 80 && (
                    <path
                        d="M4 10C8 6 20 6 24 10"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                )}

                {/* Dot always colored */}
                <circle
                    cx="14"
                    cy="22"
                    r="2"
                    fill={color}
                />
            </svg>
        </Box>
    );
}
