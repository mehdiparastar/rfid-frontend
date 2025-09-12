import { Close } from "@mui/icons-material";
import { Alert, AppBar, Badge, Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogContentText, Divider, IconButton, List, ListItem, ListItemAvatar, ListItemText, Slide, Slider, Stack, styled, Toolbar, Typography, useTheme, type BadgeProps } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef, useState } from "react";
import { useInitModules, useModules, type Mode } from "../../../api/modules";
import { RFIDIcon } from "../../../svg/RFIDIcon/RFIDIcon";

interface IProps {
    openSettings: boolean,
    setOpenSettings: React.Dispatch<React.SetStateAction<boolean>>,
    fullScreenSettingsDialog: boolean
}

const Transition = forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<unknown>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const ModuleSettings: React.FC<IProps> = ({ openSettings, setOpenSettings, fullScreenSettingsDialog }) => {
    const [powerValue, setPowerValue] = useState(100)
    const theme = useTheme()
    const { data: modules, error: getModulesError, isLoading } = useModules("Inventory");
    const initModulesMutation = useInitModules();

    const handleInitModules = (power: number, mode: Mode) => {
        // Trigger the mutation on button click
        initModulesMutation.mutate({ power, mode });
    };

    return (
        <Dialog
            fullScreen={fullScreenSettingsDialog}
            open={openSettings}
            onClose={() => setOpenSettings(false)}
            aria-labelledby="responsive-dialog-title"
            slots={{
                transition: Transition,
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
                        Settings
                    </Typography>
                </Toolbar>
            </AppBar>
            <DialogContent>
                <DialogContentText py={1}>
                    You can see connected Module(s) and re-init them, also you can change modules power of scanning.
                </DialogContentText>
                <Divider variant="fullWidth" sx={{ mx: -3, mb: 1 }} />

                <Stack width={1} direction="column" justifyContent={'space-between'}>
                    <Slider
                        disabled={initModulesMutation.status === "pending" ? true : false}
                        aria-label="power"
                        getAriaValueText={(value: number) => `${value}%`}
                        valueLabelDisplay="auto"
                        value={powerValue}
                        onChange={(_, newValue) => {
                            if (typeof newValue === "number" && newValue <= 100) {
                                setPowerValue(Math.max(newValue, 58));
                            }
                        }}
                        shiftStep={10}
                        step={null}
                        marks={[0, 10, 20, 30, 40, 50, 58, 62, 65, 69, 73, 77, 81, 85, 88, 92, 96, 100].map((value) => ({ value }))}
                        min={0}
                        max={110}
                        sx={{ width: 1 }}
                        color="warning"
                        slotProps={{
                            root: { style: { paddingBottom: 0 } },
                            rail: { style: { height: 24, borderTopRightRadius: 4, borderTopLeftRadius: 4, borderBottomRightRadius: 0, borderBottomLeftRadius: 0, } },
                            track: { style: { height: 22, borderTopRightRadius: 4, borderTopLeftRadius: 4, borderBottomRightRadius: 0, borderBottomLeftRadius: 0, backgroundColor: `hsl(${120 - (powerValue * 1.2)}, 100%, 40%)` } },
                            thumb: { style: { color: theme.palette.warning.light, borderRadius: 2, height: 14, width: 14 } }
                        }}
                    />
                    <Button
                        variant="contained"
                        color="warning"
                        sx={{
                            width: 1,
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                        }}
                        size="small"
                        onClick={() => handleInitModules(powerValue, 'Inventory')}
                        disabled={initModulesMutation.status === "pending"}
                    >
                        {initModulesMutation.status === "pending" ? 'Initializing...' : 'RE-INIT'}
                    </Button>
                </Stack>


                {
                    (isLoading || initModulesMutation.status === "pending") ?
                        <Box sx={{ width: 1, mt: 4, justifyContent: 'center', display: 'flex' }}><CircularProgress /> </Box> :
                        (!!getModulesError || initModulesMutation.status === "error") ?
                            <Alert severity="error" sx={{ mt: 4 }}>
                                {
                                    JSON.parse(getModulesError?.message || "{}")?.message ||
                                    JSON.parse(initModulesMutation.error?.message || "{}")?.message ||
                                    "An Error accured."
                                }
                            </Alert> :
                            (modules || []).length > 0 ?
                                <List sx={{ width: '100%', bgcolor: 'background.paper', mt: 4 }}>
                                    {(modules || []).map(m => (
                                        <ListItem key={m.path} alignItems="flex-start">
                                            <ListItemAvatar sx={{ mt: 0 }}>
                                                <RFIDIcon color="primary" sx={{ width: 52, height: 52 }} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                slots={{ primary: Box, secondary: Box }}
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Chip size="small" color="secondary" clickable sx={{ borderRadius: 0.2 }} label={m.path.replace("/dev/", "")} />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            sx={{ color: 'text.primary', fontWeight: 'bold' }}
                                                        >
                                                            productId: {m.productId}
                                                        </Typography>
                                                        vendorId: {m.vendorId}
                                                    </Box>
                                                }
                                            />
                                            <IconButton aria-label="cart">
                                                <StyledBadge max={100} badgeContent={m.powerPercent} color="warning">
                                                    <Box sx={{ width: 36 }} component={"img"} src="/images/icons/RFIDRadiation.png" />
                                                </StyledBadge>
                                            </IconButton>
                                        </ListItem>
                                    ))}
                                </List> :
                                <Alert severity="warning" sx={{ mt: 4 }}>You dont have initing nothing yet.</Alert>
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