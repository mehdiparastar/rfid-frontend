import { Close } from "@mui/icons-material";
import { Alert, AppBar, Badge, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, Divider, IconButton, List, ListItem, ListItemAvatar, ListItemText, Slide, Slider, Stack, styled, Switch, ToggleButton, ToggleButtonGroup, Toolbar, Typography, useTheme, type BadgeProps } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef } from "react";
import { useGetAllJrdModules, useInitJrdModules } from "../../../api/jrdDevices";
import { type Mode } from "../../../api/modules";
import { RFIDIcon } from "../../../svg/RFIDIcon/RFIDIcon";
import { powerDbmToPercent, powerPercentToDbm } from "../../../utils/percentDbm";
import { translate } from "../../../utils/translate";
import { MINPowerPercent, useModulePrefs, type ActiveMap, type ModeMap, type PowerMap } from "./jrd-modules-default-storage";

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
    const { powerById, activeById, modeById, setPowerFor, setActiveFor, setModeFor, /*cycleMode*/ } = useModulePrefs();

    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)! as any

    const { data: jrdModules, error: getJrdModulesError, isLoading: isLoadingJrdModules, isFetching: isFetchingJrdModules, refetch: refetchJrdModules } = useGetAllJrdModules();
    const initJrdModulesMutation = useInitJrdModules();

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
                power: powerPercentToDbm(powerById[deviceId]),
                mode: modeById[deviceId],
                isActive: activeById[deviceId]
            }))
        initJrdModulesMutation.mutate(initVars);
    };

    return (
        <Dialog
            fullScreen={fullScreenSettingsDialog}
            open={openSettings}
            onClose={() => setOpenSettings(false)}
            aria-labelledby="responsive-dialog-title"
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
                <Divider variant="fullWidth" sx={{ mx: -1, mb: 1 }} />
                {
                    (isLoadingJrdModules || isFetchingJrdModules || initJrdModulesMutation.status === "pending") ?
                        <Box sx={{ width: 1, my: 4, justifyContent: 'center', display: 'flex' }}><CircularProgress /></Box> :
                        (!!getJrdModulesError || initJrdModulesMutation.status === "error") ?
                            <Alert severity="error" sx={{ mt: 4 }}>
                                {
                                    JSON.parse(getJrdModulesError?.message || "{}")?.message ||
                                    JSON.parse(initJrdModulesMutation.error?.message || "{}")?.message ||
                                    t["An Error accured."]
                                }
                            </Alert> :
                            (jrdModules || []).length > 0 ?
                                <List sx={{ width: '100%', mt: 4 }}>
                                    {(jrdModules && [...jrdModules,] || []).map(m => {
                                        const thisPowerPercent = powerById[m.dev.id] ?? (scanMode === "Inventory" ? inventoryModeScanPowerInPercent : scanMode === "Scan" ? scanModeScanPowerInPercent : scanMode === "NewProduct" ? newProductModeScanPowerInPercent : Math.max(Number(m.currentPower ?? MINPowerPercent), MINPowerPercent));
                                        const isActive = activeById[m.dev.id] ?? true;
                                        const mode: Mode = modeById[m.dev.id] ?? scanMode ?? "Inventory";

                                        return (
                                            <ListItem key={m.dev.id} sx={{ px: 1 }}>
                                                <Stack gap={0.5} width={1} direction={'column'}>
                                                    <Slider
                                                        aria-label="power"
                                                        getAriaValueText={(value: number) => `${value}%`}
                                                        valueLabelDisplay="auto"
                                                        defaultValue={powerDbmToPercent(m.currentPower)}
                                                        // value={thisPowerPercent}
                                                        onChangeCommitted={(_, v) => {
                                                            if (typeof v === "number") setPowerFor(m.dev.id, v);
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
                                                            track: { style: { height: 22, borderTopRightRadius: 4, borderTopLeftRadius: 4, borderBottomRightRadius: 0, borderBottomLeftRadius: 0, backgroundColor: `hsl(${120 - (thisPowerPercent * 1.2)}, 100%, 40%)` } },
                                                            thumb: { style: { color: theme.palette.warning.light, borderRadius: 2, height: 14, width: 14 } }
                                                        }}
                                                    />
                                                    <Stack bgcolor={theme.palette.mode === 'light' ? 'whitesmoke' : theme.palette.divider} direction={'row'} mb={-1.5} alignItems="center" width={1}>
                                                        <ListItemAvatar sx={{ mt: 0 }}>
                                                            <RFIDIcon color="primary" sx={{ width: 56, height: 56 }} />
                                                        </ListItemAvatar>
                                                        <Divider sx={{ mr: 0.5 }} orientation="vertical" flexItem />
                                                        <ListItemText
                                                            slotProps={{ primary: { component: Box, fontSize: 14 }, secondary: { component: Box } }}
                                                            primary={
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Stack direction={'row'} gap={0.5}>
                                                                        <Chip size="small" color="secondary" clickable sx={{ borderRadius: 0.2 }} label={m.dev.id} />
                                                                        <Chip size="small" color={m.isActive ? "success" : "error"} clickable sx={{ borderRadius: 0.2 }} label={m.isActive ? t["Active"] : t["Disable"]} />
                                                                        <Chip size="small" color="info" clickable sx={{ borderRadius: 0.2 }} label={t[m.mode]} />
                                                                    </Stack>
                                                                </Box>
                                                            }
                                                            secondary={
                                                                <Box sx={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Typography
                                                                        component="span"
                                                                        variant="body2"
                                                                        sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: 12 }}
                                                                    >
                                                                        {m.info.find(el => el.type === 'hw')?.text} - {m.info.find(el => el.type === 'mfg')?.text} - {m.info.find(el => el.type === 'sw')?.text}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                        <IconButton aria-label="cart">
                                                            <StyledBadge max={100} badgeContent={powerDbmToPercent(m.currentPower)} color="warning">
                                                                <Box sx={{ width: 36 }} component={"img"} src="/images/icons/RFIDRadiation.png"/>
                                                            </StyledBadge>
                                                        </IconButton>
                                                        <Divider orientation="vertical" flexItem />
                                                        <IsActiveSwitch checked={isActive} onChange={(_, c) => setActiveFor(m.dev.id, c)} />

                                                    </Stack>
                                                    <ToggleButtonGroup
                                                        exclusive
                                                        value={mode}
                                                        color="warning"
                                                        onChange={(_, val) => val && setModeFor(m.dev.id, val)}
                                                        size="small"
                                                        sx={{
                                                            width: 1,
                                                            mt: 1,
                                                            borderTopLeftRadius: 0, borderTopRightRadius: 0,
                                                        }}
                                                    >
                                                        <ToggleButton color="warning" sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, width: 1 }} value="Inventory">{t["Inventory"]}</ToggleButton>
                                                        <ToggleButton color="warning" sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, width: 1 }} value="Scan">{t["Scan"]}</ToggleButton>
                                                        <ToggleButton color="warning" sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, width: 1 }} value="NewProduct">{t["New"]}</ToggleButton>
                                                    </ToggleButtonGroup>
                                                </Stack>
                                            </ListItem>
                                        )
                                    })}
                                </List> :
                                <Button onClick={() => refetchJrdModules()} color="warning" fullWidth variant="contained">{t["Fetch Latest State"]}</Button>
                }
                {(jrdModules || []).length > 0 &&
                    <DialogActions>
                        <Button
                            fullWidth
                            variant="contained"
                            color="warning"
                            sx={{
                                width: 1,
                                borderTopLeftRadius: 0,
                                borderTopRightRadius: 0,
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
        right: 18,
        top: -4,
        border: `2px solid ${(theme.vars ?? theme).palette.background.paper}`,
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