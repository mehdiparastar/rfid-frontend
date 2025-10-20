import { AddBox, FactCheck } from "@mui/icons-material";
import { Alert, AppBar, Box, CircularProgress, Container, Grid, Tab, Tabs, useTheme, Zoom } from "@mui/material";
import React, { useState } from "react";
import { useMe } from "../../api/auth";
import type { Mode } from "../../api/modules";
import { useSocketStore } from "../../store/socketStore";
import { RFIDIcon } from "../../svg/RFIDIcon/RFIDIcon";
import CheckInventory from "./components/CheckInventory";
import ProductRegistration from "./components/ProductRegistration";
import Scan from "./components/Scan";
import { translate } from "../../utils/translate";


const ScanMode: React.FC = () => {
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!
    const { data: me, isLoading } = useMe(); // useMe() already handles cookie-based auth
    const [selectedScenario, setSelectedScenario] = useState<Mode>("Inventory")
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
            <Box sx={{ width: 1, bgcolor: isConnected ? 'green' : 'red', height: 5 }} />
            <Container maxWidth="lg" sx={{ px: 0 }}>
                <Grid container pt={1} spacing={1}>
                    <AppBar position="static" color="warning">
                        <Tabs
                            value={selectedScenario}
                            onChange={(_e: React.SyntheticEvent, newValue: Mode) => setSelectedScenario(newValue)}
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
                            <CheckInventory />
                        </Box>
                    </Zoom>

                    <Zoom key={"Scan"} in={selectedScenario === "Scan"} style={{ transitionDelay: `${selectedScenario === "Scan" ? transitionDuration.exit : 0}ms` }} unmountOnExit>
                        <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                            <Scan />
                        </Box>
                    </Zoom>

                    <Zoom key={"NewProduct"} in={selectedScenario === "NewProduct"} style={{ transitionDelay: `${selectedScenario === "NewProduct" ? transitionDuration.exit : 0}ms` }} unmountOnExit>
                        <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                            <ProductRegistration />
                        </Box>
                    </Zoom>


                </Grid>
            </Container>
        </>
    );
};

export default ScanMode;
