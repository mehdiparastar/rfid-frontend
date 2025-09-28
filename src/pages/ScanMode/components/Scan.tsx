import { PlayArrow, Settings, Stop } from "@mui/icons-material";
import { Alert, Divider, IconButton, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useScanResults, useScenarioState, useStartScenario, useStopScenario } from "../../../api/modules";
import { useScanResultsLive } from "../../../features/useScanResultsLive";
import { useState } from "react";
import ModuleSettings from "./ModuleSettings";

const Scan: React.FC = () => {

    const theme = useTheme();
    const fullScreenSettingsDialog = useMediaQuery(theme.breakpoints.down('md'));
    const [openSettings, setOpenSettings] = useState(false);
    const { data: scenarioState } = useScenarioState()
    const { mutateAsync: stopScenarioMutateAsync } = useStopScenario()
    const { mutateAsync: startScenarioMutateAsync } = useStartScenario()
    const { data: scanResults = { Scan: [] } } = useScanResults("Scan");

    useScanResultsLive("Scan", 5000, true);


    const handleStartScenario = async () => {
        await startScenarioMutateAsync({ mode: "Scan" })
    }

    const handleStopScenario = async () => {
        await stopScenarioMutateAsync()
    }

    return (
        <Paper elevation={3} sx={{ pt: 1, pb: 4, px: 1, width: 1, mx: 'auto' }}>
            <Stack width={1} spacing={0} direction={{ xs: 'column', sm: 'row' }}>
                <Alert
                    icon={false}
                    sx={{
                        textAlign: 'center',
                        width: { xs: "100%", sm: 200 },
                        mb: 1,
                        padding: '8px 10px',
                        '& .MuiAlert-message': {
                            width: '100%',
                            padding: 0
                        },
                        borderTopRightRadius: { sm: 0 },
                        borderBottomRightRadius: { sm: 0 },
                        borderRight: { xs: 0, sm: 1 }
                    }}
                    slotProps={{
                        message: {
                            sx: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexDirection: { xs: 'row', sm: 'column', md: 'column', lg: 'column', xl: 'column' }
                            }
                        }
                    }}
                >
                    <Typography
                        variant="button"
                        fontWeight="bold"
                        sx={{
                            animation: 'shake 0.2s ease-in-out infinite',
                            display: 'inline-block',
                            color: 'warning.main',
                            '@keyframes shake': {
                                '0%, 100%': {
                                    transform: 'translateX(0)',
                                    // color: 'warning.main'
                                },
                                '50%': {
                                    transform: 'translateX(1px)',
                                    // color: 'error.main'
                                }
                            }
                        }}
                    >
                        Checking Mode
                    </Typography>
                    <Typography variant='caption'>{scenarioState?.scanMode}</Typography>
                </Alert>
                <Alert
                    icon={false}
                    sx={{
                        mb: 1,
                        width: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        '& .MuiAlert-message': {
                            width: '100%',
                            padding: 0
                        },
                        borderTopLeftRadius: { sm: 0 },
                        borderBottomLeftRadius: { sm: 0 },
                    }}
                >
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        width="100%"
                    >
                        <ToggleButtonGroup disabled={!(scenarioState?.scanMode === "Scan")} value={scenarioState?.isActiveScenario ? 'started' : 'stopped'}>
                            <ToggleButton value={'started'} onClick={handleStartScenario} title='start'><PlayArrow /></ToggleButton>
                            <ToggleButton value={'stopped'} onClick={handleStopScenario} title='stop'><Stop /></ToggleButton>
                        </ToggleButtonGroup>
                        <IconButton onClick={() => setOpenSettings(true)}><Settings /></IconButton>
                    </Stack>
                </Alert>
            </Stack>
            <Divider />
            {
                scanResults.Scan?.map(it => <p key={it.id}>{it.name}</p>)
            }

            <ModuleSettings
                openSettings={openSettings}
                setOpenSettings={setOpenSettings}
                fullScreenSettingsDialog={fullScreenSettingsDialog}
                scanMode='Scan'
            />
        </Paper>
    )
}

export default Scan;