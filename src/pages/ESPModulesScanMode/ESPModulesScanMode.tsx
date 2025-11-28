import { AddBox, FactCheck } from "@mui/icons-material";
import { Alert, AppBar, Box, CircularProgress, Grid, Tab, Tabs, useTheme, Zoom } from "@mui/material";
import React from "react";
import { useMe } from "../../api/auth";
import { useLocalStorageData } from "../../features/useLocalStorageData";
import { useSocketStore } from "../../store/socketStore";
import { RFIDIcon } from "../../svg/RFIDIcon/RFIDIcon";
import { translate } from "../../utils/translate";
import ESPCheckInventory from "./components/ESPCheckInventory";
import ESPProductRegistration from "./components/ESPProductRegistration";
import ESPScan from "./components/ESPScan";
import type { ScanMode } from "../../constants/scanMode";


const ESPModulesScanMode: React.FC = () => {
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!
    const { data: me, isLoading } = useMe(); // useMe() already handles cookie-based auth
    const [selectedScenario, setSelectedScenario] = useLocalStorageData<ScanMode>("selectedScenario", "Inventory");
    const isConnected = useSocketStore((s) => s.isConnected);

    const transitionDuration = {
        enter: theme.transitions.duration.enteringScreen,
        exit: theme.transitions.duration.leavingScreen,
    };

    if (isLoading) {
        return (
            <Box sx={{ p: 3, display: "grid", placeItems: "center" }}>
                <CircularProgress />
            </Box>
        )
    }

    if (!me) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{t["User not authenticated, please login"]}</Alert>
            </Box>
        )
    }

    return (
        <>
            <Box sx={{ bgcolor: isConnected ? 'green' : 'red', height: 5 }} />
            <Grid container pt={1} spacing={1}>
                <AppBar position="static" color="warning">
                    <Tabs
                        value={selectedScenario}
                        onChange={(_e: React.SyntheticEvent, newValue: ScanMode) => setSelectedScenario(newValue)}
                        indicatorColor="secondary"
                        textColor="inherit"
                        variant="fullWidth"
                        aria-label="Scan Mode selection tabs"
                    >
                        <Tab icon={<FactCheck />} label={t["Inventory"]} value="Inventory" />
                        <Tab icon={<RFIDIcon />} label={t["Scan"]} value="Scan" />
                        <Tab icon={<AddBox />} label={t["New Product"]} value="NewProduct" />
                    </Tabs>
                </AppBar>

                <Zoom key={"Inventory"} in={selectedScenario === "Inventory"} style={{ transitionDelay: `${selectedScenario === "Inventory" ? transitionDuration.exit : 0}ms` }} unmountOnExit>
                    <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                        <ESPCheckInventory />
                    </Box>
                </Zoom>

                <Zoom key={"Scan"} in={selectedScenario === "Scan"} style={{ transitionDelay: `${selectedScenario === "Scan" ? transitionDuration.exit : 0}ms` }} unmountOnExit>
                    <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                        <ESPScan />
                    </Box>
                </Zoom>

                <Zoom key={"NewProduct"} in={selectedScenario === "NewProduct"} style={{ transitionDelay: `${selectedScenario === "NewProduct" ? transitionDuration.exit : 0}ms` }} unmountOnExit>
                    <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                        <ESPProductRegistration mode="New" />
                    </Box>
                </Zoom>


            </Grid>
        </>
    );
};

export default ESPModulesScanMode;
