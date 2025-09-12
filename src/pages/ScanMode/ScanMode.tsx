import { Factory, ProductionQuantityLimits } from "@mui/icons-material";
import { Alert, Box, ButtonBase, CircularProgress, Container, Fade, Grid, styled, Typography } from "@mui/material";
import React, { useState } from "react";
import { useMe } from "../../api/auth";
import type { Mode } from "../../api/modules";
import CheckInventory from "./components/CheckInventory";

const images: { url: string; title: string; width: string; key: Mode }[] = [
    {
        url: '/images/buttons/gold_jewelry_resized.png',
        title: 'Inventory Check',
        width: '33.3333%',
        key: "Inventory"
    },
    {
        url: '/images/buttons/gold_invoice_resized.png',
        title: 'Issue Invoice',
        width: '33.3333%',
        key: "Invoice"
    },
    {
        url: '/images/buttons/gold_registration_rfid_resized.png',
        title: 'Register New Product',
        width: '33.3333%',
        key: 'NewProduct'
    },
];

const ImageButton = styled(ButtonBase)(({ theme }) => ({
    position: 'relative',
    height: 200,
    [theme.breakpoints.down('sm')]: {
        width: '100% !important', // Overrides inline-style
        height: 100,
    },
    '&:hover, &.Mui-focusVisible': {
        zIndex: 1,
        '& .MuiImageBackdrop-root': {
            opacity: 0.15,
        },
        '& .MuiImageMarked-root': {
            opacity: 0,
        },
        '& .MuiTypography-root': {
            border: '4px solid currentColor',
        },
    },
}));

const ImageSrc = styled('span')({
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center 40%',
});

const Image = styled('span')(({ theme }) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.common.white,
}));

const ImageBackdrop = styled('span')(({ theme }) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.palette.common.black,
    opacity: 0.7,
    transition: theme.transitions.create('opacity'),
}));

const ImageMarked = styled('span')(({ theme }) => ({
    height: 3,
    width: 18,
    backgroundColor: theme.palette.common.white,
    position: 'absolute',
    bottom: -2,
    left: 'calc(50% - 9px)',
    transition: theme.transitions.create('opacity'),
}))

const ScanMode: React.FC = () => {
    const { data: me, isLoading } = useMe(); // useMe() already handles cookie-based auth
    const [selectedScenario, setSelectedScenario] = useState<Mode>("Inventory")

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
                <Alert severity="error">{"User not authenticated, please login"}</Alert>
            </Box>
        )
    }

    return (
        <Container maxWidth="lg" sx={{ px: 0 }}>
            <Grid container pt={1} spacing={1}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', minWidth: 300, width: '100%', pt: 1 }}>
                    {images.map((image) => (
                        <ImageButton
                            onClick={() => setSelectedScenario(image.key)}
                            focusRipple
                            key={image.title}
                            style={{
                                width: image.width,
                                minHeight: 150
                            }}
                            sx={{
                                ...(selectedScenario === image.key && {
                                    zIndex: 1,
                                    '& .MuiImageBackdrop-root': {
                                        opacity: 0.15,
                                    },
                                    '& .MuiImageMarked-root': {
                                        opacity: 0,
                                    },
                                    '& .MuiTypography-root': {
                                        border: '4px solid currentColor',
                                    },
                                })
                            }}
                        >
                            <ImageSrc style={{ backgroundImage: `url(${image.url})` }} />
                            <ImageBackdrop className="MuiImageBackdrop-root" />
                            <Image>
                                <Typography
                                    component="span"
                                    variant="subtitle1"
                                    color="inherit"
                                    sx={(theme) => ({
                                        position: 'relative',
                                        p: 4,
                                        pt: 2,
                                        pb: `calc(${theme.spacing(1)} + 6px)`,
                                    })}
                                >
                                    {image.title}
                                    <ImageMarked className="MuiImageMarked-root" />
                                </Typography>
                            </Image>
                        </ImageButton>
                    ))}
                </Box>
                <Fade key={"Inventory"} in={selectedScenario === "Inventory"} mountOnEnter unmountOnExit>
                    <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                        <CheckInventory />
                    </Box>
                </Fade>

                <Fade key={"Invoice"} in={selectedScenario === "Invoice"} mountOnEnter unmountOnExit>
                    <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                        <Factory />
                    </Box>
                </Fade>

                <Fade key={"NewProduct"} in={selectedScenario === "NewProduct"} mountOnEnter unmountOnExit>
                    <Box sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
                        <ProductionQuantityLimits />
                    </Box>
                </Fade>


            </Grid>
            {/* <div>
                <button onClick={handleScan}>Start Scan</button>
            </div> */}
        </Container>
    );
};

export default ScanMode;
