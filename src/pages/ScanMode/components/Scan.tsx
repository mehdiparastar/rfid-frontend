import { ArrowDownward, ArrowUpward, Delete, Edit, PlayArrow, Search, Settings, Stop } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardActions, CardContent, CardMedia, Checkbox, Chip, Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Snackbar, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoldCurrency } from "../../../api/goldCurrency";
import { useScanResults, useScenarioState, useStartScenario, useStopScenario } from "../../../api/modules";
import PhotoLightbox from "../../../components/PhotoLightbox";
import { useScanResultsLive } from "../../../features/useScanResultsLive";
import { useSocketStore } from "../../../store/socketStore";
import { GOLD_PRODUCT_SUB_TYPES } from "../../../store/useProductFormStore";
import { getIRRCurrency } from "../../../utils/getIRRCurrency";
import ModuleSettings from "./ModuleSettings";

const Scan: React.FC = () => {
    const isConnected = useSocketStore((s) => s.isConnected);

    const navigate = useNavigate();
    const theme = useTheme();
    const fullScreenSettingsDialog = useMediaQuery(theme.breakpoints.down('md'));
    const [openSettings, setOpenSettings] = useState(false);
    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");
    const [selectedProducts, setSelectedProducts] = useState<number[]>([])
    const [searchQuery, setSearchQuery] = useState(""); // New state for search query
    const { data: scenarioState } = useScenarioState()
    const { mutateAsync: stopScenarioMutateAsync } = useStopScenario()
    const { mutateAsync: startScenarioMutateAsync } = useStartScenario()
    const { data: scanResults = { Scan: [] } } = useScanResults("Scan");
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
    const { data: spotPrice, isLoading: spotPriceIsLoading, error: spotPriceError, isError: spotPriceIsError } = useGoldCurrency();

    useScanResultsLive("Scan", 5000, true);


    const handleStartScenario = async () => {
        await startScenarioMutateAsync({ mode: "Scan" })
    }

    const handleStopScenario = async () => {
        await stopScenarioMutateAsync()
    }

    const handleInvoiceInquiry = () => {
        navigate(`/issue-invoice?${new URLSearchParams({ ids: selectedProducts.join(",") }).toString()}`, {
            state: {
                snapshot: (scanResults.Scan || []).filter(it => selectedProducts.includes(it.id))
            }
        })
    }

    // Filter scan results based on search query
    const filteredScanResults = (scanResults.Scan || [])
        .filter((product) => {
            const searchText = searchQuery.toLowerCase();
            const tagMatch = product.tags?.some((tag) => tag.epc.toLowerCase().includes(searchText));
            const nameMatch = product.name.toLowerCase().includes(searchText);
            const typeMatch = product.type.toLowerCase().includes(searchText);
            return tagMatch || nameMatch || typeMatch;
        })
        .sort((a, b) => {
            const directionMultiplier = sortDirection === "asc" ? 1 : -1;
            if (sortField === "createdAt") {
                // Handle undefined or invalid createdAt values
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return directionMultiplier * (aDate - bDate);
            } else if (sortField === "name") {
                return directionMultiplier * a.name.localeCompare(b.name);
            }
            return 0;
        });

    return (
        <Paper elevation={3} sx={{ pt: 1, pb: 4, px: 1, width: 1, mx: 'auto', mb: 2 }}>
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

            <>
                {/* Filters Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 1 }}>
                    <TextField
                        label="Search Products"
                        variant="outlined"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ width: { xs: 1, md: 1 }, mr: 2 }}
                        slotProps={{ input: { endAdornment: <Search /> } }}
                        size="small"
                    />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Sort direction */}
                        <Tooltip title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}>
                            <IconButton onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} size="small">
                                {sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
                            </IconButton>
                        </Tooltip>
                        {/* Sort by dropdown */}
                        <FormControl>
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={sortField}
                                onChange={(event) => setSortField(event.target.value as string)}
                                label="Sort By"
                                size="small"
                                sx={{ width: 125 }}
                            >
                                <MenuItem value="createdAt">Created At</MenuItem>
                                <MenuItem value="name">Name</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2, pt: 1 }}>
                    <Typography variant="button" sx={{ borderBottom: '2px solid black' }}>
                        All: {filteredScanResults.length || 0}
                    </Typography>
                    {selectedProducts.length > 0 && <Typography variant="caption">{selectedProducts.length}product(s) selected.</Typography>}
                    <Button variant="contained" sx={{ width: 125 }} disabled={selectedProducts.length === 0} onClick={handleInvoiceInquiry}>INVOICE</Button>
                </Box>

                {/* Product Grid */}
                <Grid container spacing={2}>
                    {
                        (filteredScanResults || []).map((product) => {
                            const productSpotPrice = 10 * (spotPrice?.gold.find(it => it.symbol === product.subType)?.price || 0)
                            const soldQuantity = product.saleItems?.reduce((p, c) => p + c.quantity, 0) || 0

                            return (
                                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={product.id}>
                                    <Card
                                        sx={{
                                            borderRadius: 1,
                                            overflow: "hidden",
                                            boxShadow: 3,
                                            transition: "transform 0.2s, box-shadow 0.2s",
                                            "&:hover": {
                                                transform: "translateY(-5px)",
                                                boxShadow: 6,
                                            },
                                            cursor: "pointer",
                                        }}
                                    >
                                        <CardMedia
                                            component="img"
                                            height={200}
                                            image={`api${product.photos[0]}` || "/default-product-image.jpg"}
                                            alt={product.name}
                                            sx={{ width: "100%", objectFit: "cover", cursor: "pointer" }}
                                            onClick={() => {
                                                setLightboxPhotos(product.photos || []);
                                                setLightboxOpen(true);
                                            }}
                                        />
                                        <CardContent sx={{ py: 0.5 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Tooltip title={product.createdBy?.email}>
                                                    <Typography variant="h6">{product.name}</Typography>
                                                </Tooltip>
                                                <Chip label={product.type} />
                                                <Checkbox disabled={product.quantity - soldQuantity === 0} checked={selectedProducts.includes(product.id)} onClick={() => setSelectedProducts(p => p.includes(product.id) ? p.filter(el => el !== product.id) : [...p, product.id])} />
                                            </Box>
                                            <Divider sx={{ mx: -2, mb: 1 }} variant="fullWidth" />
                                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="textSecondary" fontWeight={'bold'} fontFamily={"IRANSans, sans-serifRoboto, Arial, sans-serif"}>
                                                    Unit Price: {getIRRCurrency(Math.round(product.weight * productSpotPrice * (1 + product.profit / 100 + product.makingCharge / 100 + product.vat / 100)))}
                                                </Typography>
                                                <Chip
                                                    label={(product.quantity - soldQuantity) > 0 ?
                                                        <Typography variant="body2">
                                                            Available: {product.quantity - soldQuantity}
                                                        </Typography> :
                                                        "Out of stock"
                                                    }
                                                    sx={{ borderRadius: 1 }}
                                                    color={(product.quantity - soldQuantity) > 0 ? "success" : "warning"}
                                                />
                                            </Box>
                                            <Typography variant="body2" color="textSecondary">
                                                Unit Weight: {product.weight}g
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Making Charge: {product.makingCharge}%
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Sold Quantity: {soldQuantity}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Sub Type: {GOLD_PRODUCT_SUB_TYPES.find(it => it.symbol === product.subType)?.name}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Inventory Item: {<Checkbox checked={!!product.inventoryItem} />}
                                            </Typography>
                                        </CardContent>
                                        <CardActions sx={{ display: "flex", justifyContent: 'space-between' }}>
                                            <Box>
                                                {product && product.tags && product.tags.length > 0 && (
                                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                                                        {product.tags.map((tag) => (
                                                            <Box
                                                                key={tag.id}
                                                                sx={{
                                                                    bgcolor: "primary.main",
                                                                    color: "darkslategrey",
                                                                    px: 1,
                                                                    py: 0.3,
                                                                    borderRadius: 1,
                                                                    fontSize: 10,
                                                                    fontWeight: 800,
                                                                }}
                                                            >
                                                                {tag.epc}
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                            <Stack direction={'row'}>
                                                <IconButton aria-label="edit">
                                                    <Edit color="info" />
                                                </IconButton>
                                                <IconButton aria-label="delete">
                                                    <Delete color="error" />
                                                </IconButton>
                                            </Stack>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            )
                        })
                    }
                </Grid>



                {/* Error Message */}
                {spotPriceIsError && (
                    <Snackbar open={true} autoHideDuration={6000}>
                        <Alert severity="error">{JSON.parse((spotPriceError as Error)?.message).message || "Something went wrong"}</Alert>
                    </Snackbar>
                )}

                <PhotoLightbox
                    photos={lightboxPhotos}
                    open={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                />
            </>



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