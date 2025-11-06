import { Close } from "@mui/icons-material";
import { Alert, AppBar, Badge, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, Divider, IconButton, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Slide, Slider, Stack, styled, Switch, Toolbar, Typography, useTheme, type BadgeProps } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef } from "react";
import { useCurrentScenario, useInitJrdModules, useSetIsActiveModule, useSetModuleScanPower, useSetScanMode } from "../../../api/jrdDevices";
import { type Mode } from "../../../api/modules";
import { powerDbmToPercent, powerPercentToDbm } from "../../../utils/percentDbm";
import { translate } from "../../../utils/translate";
import { useModulePrefs, type ActiveMap, type ModeMap, type PowerMap } from "./jrd-modules-default-storage";

interface IProps {
    openSettings: boolean,
    setOpenSettings: React.Dispatch<React.SetStateAction<boolean>>,
    fullScreenSettingsDialog: boolean,
    scanMode: Mode
}

export const scanModeScanPowerInPercent = 12
export const inventoryModeScanPowerInPercent = 100
export const newProductModeScanPowerInPercent = 12

export const DialogTransition = forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<unknown>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const ModuleSettings: React.FC<IProps> = ({ openSettings, setOpenSettings, fullScreenSettingsDialog, scanMode }) => {
    const { data: scenarioState = [], error: getScenarioStateError, isLoading: isLoadingScenarioState, isFetching: isFetchingScenarioState, refetch: refetchScenarioState } = useCurrentScenario();

    const { powerById, activeById, modeById, setPowerFor, setActiveFor, setModeFor } = useModulePrefs();

    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)! as any

    const initJrdModulesMutation = useInitJrdModules();
    const { mutate: setScanModeMutation, isPending: setScanModeIsPending } = useSetScanMode()
    const { mutate: setIsActiveModuleMutation, isPending: setIsActiveModuleIsPending } = useSetIsActiveModule()
    const { mutate: setModuleScanPowerMutation, isPending: setModuleScanPowerIsPending } = useSetModuleScanPower()


    const handleInitModules = (powerById: PowerMap, activeById: ActiveMap, modeById: ModeMap) => {
        // Trigger the mutation on button click
        const initVars = Array
            .from(new Set<string>([
                ...Object.keys(powerById ?? {}),
                ...Object.keys(activeById ?? {}),
                ...Object.keys(modeById ?? {}),
            ]))
            .map((deviceId) => ({
                deviceId,
                power: powerPercentToDbm(powerById[deviceId] ?? (scanMode === "Inventory" ? inventoryModeScanPowerInPercent : scanMode === "Scan" ? scanModeScanPowerInPercent : newProductModeScanPowerInPercent)) || 15,
                mode: modeById[deviceId],
                isActive: activeById[deviceId]
            }))
        initJrdModulesMutation.mutate(initVars);
    };

    const isLoading = setScanModeIsPending || setIsActiveModuleIsPending || setModuleScanPowerIsPending || isLoadingScenarioState || isFetchingScenarioState || initJrdModulesMutation.status === "pending"

    return (
        <Dialog
            fullScreen={fullScreenSettingsDialog}
            open={openSettings}
            onClose={() => setOpenSettings(false)}
            aria-labelledby="responsive-dialog-title"
            disableScrollLock
            slots={{
                transition: DialogTransition,
            }}
        >
            <AppBar sx={{ position: 'relative' }}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => setOpenSettings(false)}
                        aria-label="close"
                    >
                        <Close />
                    </IconButton>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                        {t["Settings"]}
                    </Typography>
                </Toolbar>
            </AppBar>
            <DialogContent sx={{ p: 1 }}>
                <DialogContentText py={1}>
                    {t["You can see connected Module(s) and re-init them, also you can change modules power of scanning."]}
                </DialogContentText>
                {
                    isLoading ?
                        <LinearProgress sx={{ mx: -1 }} /> :
                        <Divider variant="fullWidth" sx={{ mx: -1, pb: '3px' }} />
                }
                {
                    (!!getScenarioStateError || initJrdModulesMutation.status === "error") ?
                        <Alert severity="error" sx={{ mt: 4 }}>
                            {
                                JSON.parse(getScenarioStateError?.message || "{}")?.message ||
                                JSON.parse(initJrdModulesMutation.error?.message || "{}")?.message ||
                                t["An Error accured."]
                            }
                        </Alert> :
                        (scenarioState || []).length > 0 ?
                            <List sx={{ width: '100%', mt: 4 }}>
                                {(scenarioState || []).map(m => {
                                    return (
                                        <ListItem key={m.id} sx={{ px: 1, mb: 2 }}>
                                            <Stack gap={0.5} width={1} direction={'column'}>
                                                <Slider
                                                    aria-label="power"
                                                    getAriaValueText={(value: number) => `${value}%`}
                                                    valueLabelDisplay="auto"
                                                    value={powerDbmToPercent(m.state.power)}
                                                    onChangeCommitted={(_, v) => {
                                                        if (typeof v === "number") {
                                                            setModuleScanPowerMutation({ deviceId: m.id, power: powerPercentToDbm(v) ?? 15 })
                                                            setPowerFor(m.id, v);
                                                        }
                                                    }}
                                                    shiftStep={10}
                                                    step={null}
                                                    marks={[0, 5, 8, 12, 16, 20, 24, 27, 31, 35, 39, 43, 47, 50, 54, 58, 62, 65, 69, 73, 77, 81, 85, 88, 92, 96, 100].map((value) => ({ value }))}
                                                    min={0}
                                                    max={110}
                                                    sx={{ width: 1 }}
                                                    color="warning"
                                                    slotProps={{
                                                        root: { style: { paddingBottom: 0 } },
                                                        rail: { style: { height: 24, borderTopRightRadius: 4, borderTopLeftRadius: 4, borderBottomRightRadius: 0, borderBottomLeftRadius: 0, } },
                                                        track: { style: { height: 22, borderTopRightRadius: 4, borderTopLeftRadius: 4, borderBottomRightRadius: 0, borderBottomLeftRadius: 0, backgroundColor: `hsl(${120 - ((powerDbmToPercent(m.state.power) || 58) * 1.2)}, 100%, 40%)` } },
                                                        thumb: { style: { color: theme.palette.warning.light, borderRadius: 2, height: 14, width: 14 } }
                                                    }}
                                                />
                                                <Stack bgcolor={theme.palette.mode === 'light' ? 'whitesmoke' : theme.palette.divider} direction={'row'} mb={-1.5} alignItems="center" width={1}>
                                                    <ListItemIcon sx={{ justifyContent: 'center', mt: 2 }}>
                                                        <StyledBadge badgeContent={m.id} color="warning">
                                                            <Box sx={{ width: 40 }} component={"img"} src="/images/icons/RFIDRadiation.png" />
                                                        </StyledBadge>
                                                    </ListItemIcon>
                                                    <Divider sx={{ mr: 0.5 }} orientation="vertical" flexItem />
                                                    <ListItemText
                                                        slotProps={{ primary: { component: Box, fontSize: 14 }, secondary: { component: Box } }}
                                                        primary={
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <Stack direction={'row'} gap={0.5} >
                                                                    {(["Inventory", "Scan", "NewProduct"] as Mode[]).map((mMode) => (
                                                                        <Chip
                                                                            key={mMode}
                                                                            size="small"
                                                                            clickable
                                                                            label={t[mMode]}
                                                                            color={m.state.mode === mMode ? "success" : "default"}
                                                                            variant={"filled"}
                                                                            onClick={() => {
                                                                                setScanModeMutation({ deviceId: m.id, mode: mMode })
                                                                                setModeFor(m.id, mMode)
                                                                            }}
                                                                            sx={{ fontWeight: m.state.mode === mMode ? 'bold' : 'inherit', borderRadius: 0.2 }}
                                                                        />
                                                                    ))}
                                                                </Stack>
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box sx={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
                                                                <Typography
                                                                    component="span"
                                                                    variant="body2"
                                                                    sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: 12, pt: 0.5, pb: 0 }}
                                                                >
                                                                    {/* {m.info.find(el => el.type === 'hw')?.text} - {m.info.find(el => el.type === 'mfg')?.text} - {m.info.find(el => el.type === 'sw')?.text} */}
                                                                    {m.state.type} - jrd100
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />

                                                    <Divider orientation="vertical" flexItem />
                                                    <IsActiveSwitch
                                                        color="success"
                                                        checked={m.state.isActive}
                                                        onChange={(_, c) => {
                                                            setIsActiveModuleMutation({ deviceId: m.id, isActive: c })
                                                            setActiveFor(m.id, c)
                                                        }}
                                                    />
                                                </Stack>
                                            </Stack>
                                        </ListItem>
                                    )
                                })}
                            </List> :
                            <Button onClick={() => refetchScenarioState()} color="warning" fullWidth variant="contained">{t["Fetch Latest State"]}</Button>
                }
                {(scenarioState || []).length > 0 &&
                    <DialogActions>
                        <Button
                            fullWidth
                            variant="contained"
                            color="warning"
                            sx={{
                                width: 1,
                            }}
                            size="small"
                            onClick={() => { handleInitModules(powerById, activeById, modeById) }}
                            disabled={initJrdModulesMutation.status === "pending"}
                        >
                            {initJrdModulesMutation.status === "pending" ? t['Initializing...'] : t['RE-INIT']}
                        </Button>
                    </DialogActions>
                }
            </DialogContent>
        </Dialog>
    )
}


export default ModuleSettings

const StyledBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
    '& .MuiBadge-badge': {
        right: 20,
        top: -4,
        border: `1px solid ${(theme.vars ?? theme).palette.background.paper}`,
        padding: '0 4px',
    },
}));

const IsActiveSwitch = styled(Switch)(({ theme }) => ({
    padding: 8,
    '& .MuiSwitch-track': {
        borderRadius: 22 / 2,
        '&::before, &::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
        },
        '&::before': {
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
                theme.palette.getContrastText(theme.palette.primary.main),
            )}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
            left: 12,
        },
        '&::after': {
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
                theme.palette.getContrastText(theme.palette.primary.main),
            )}" d="M19,13H5V11H19V13Z" /></svg>')`,
            right: 12,
        },
    },
    '& .MuiSwitch-thumb': {
        boxShadow: 'none',
        width: 16,
        height: 16,
        margin: 2,
    },
}));