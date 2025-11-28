import { ArrowDownward, ArrowUpward, Clear, ViewWeek as ColumnIcon, Delete, Edit, ViewStream as ModuleIcon, PlayArrow, PresentToAll, Search, Stop } from "@mui/icons-material";
import { Alert, Backdrop, Box, Button, Card, CardActions, CardContent, CardMedia, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, Grid, IconButton, InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, useTheme } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClearEspModulesScanHistory, useEspModules, useSetESPModulePower, useSetESPModulesIsActive, useSetESPModulesMode, useStartESPModulesScanByMode, useStopESPModulesScanByMode } from "../../../api/espModules";
import { useGoldCurrency } from "../../../api/goldCurrency";
import { useDeleteProduct } from "../../../api/products";
import dingUrl from "../../../assets/sounds/ding.mp3"; // Vite: imports as URL
import { ErrorSnack } from "../../../components/ErrorSnack";
import PhotoLightbox from "../../../components/PhotoLightbox";
import { useESPModulesLive } from "../../../features/useESPModulesLive";
import { useESPModulesScanLive } from "../../../features/useESPModulesScanLive";
import type { Product } from "../../../lib/api";
import type { ESPModulesProductScan } from "../../../lib/socket";
import { GOLD_PRODUCT_SUB_TYPES } from "../../../store/useProductFormStore";
import { calculateGoldPrice } from "../../../utils/calculateGoldPrice";
import { getIRRCurrency } from "../../../utils/getIRRCurrency";
import { rssiToDistanceStrength } from "../../../utils/rssiToDistanceStrength";
import { translate } from "../../../utils/translate";
import { uniqueByIdAndTimeStamp } from "../../../utils/uniqueArrayOfObjectsBasedOnIdAndTimestamp";
import ESPProductRegistration from "./ESPProductRegistration";

const ESPScan: React.FC = () => {

    const navigate = useNavigate();
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [sortField, setSortField] = useState("latest");
    const [sortDirection, setSortDirection] = useState("desc");
    const [selectedProducts, setSelectedProducts] = useState<number[]>([])
    const [searchQuery, setSearchQuery] = useState(""); // New state for search query
    const [columnCount, setColumnCount] = useState(3); // Default to 2 columns
    const [openBackDrop, setOpenBackDrop] = useState<boolean>(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);

    const { data: allEspModules = [] } = useEspModules();
    const { mutate: setESPModulesPower, } = useSetESPModulePower()
    const { mutate: setESPModulesIsActive, } = useSetESPModulesIsActive()
    const { mutate: setESPModulesMode, } = useSetESPModulesMode()

    useESPModulesLive(true)
    useESPModulesScanLive(true)

    const { mutate: clearScanHistoryMutate, isPending: clearScanHistoryPending } = useClearEspModulesScanHistory()
    const { mutate: startESPModulesScanByMode, isPending: startScanPending } = useStartESPModulesScanByMode()
    const { mutate: stopESPModulesScanByMode, isPending: stopScanPending } = useStopESPModulesScanByMode()

    const { data: spotPrice, error: spotPriceError, isError: spotPriceIsError } = useGoldCurrency();

    const { mutateAsync: deleteProductMutateAsync, error: deleteProductError, isError: deleteProductIsError } = useDeleteProduct()

    const products = uniqueByIdAndTimeStamp(
        allEspModules
            .filter(m => m.tagScanResults && m.tagScanResults.Scan)
            .map(el => el.tagScanResults!.Scan)
            .flat()
    ) as unknown as ESPModulesProductScan[]

    const handleStartScenario = async () => {
        startESPModulesScanByMode({ mode: "Scan" })
    }

    const handleStopScenario = async () => {
        stopESPModulesScanByMode({ mode: "Scan" })
    }

    const handleInvoiceInquiry = () => {
        navigate(`/issue-invoice?${new URLSearchParams({ ids: selectedProducts.join(",") }).toString()}`, {
            state: {
                snapshot: products.filter(it => selectedProducts.includes(it.id))
            }
        })
    }

    const handleClearScanHistory = async () => {
        clearScanHistoryMutate({ mode: "Scan" })
    }

    const confirmDelete = async () => {
        if (productToDelete)
            await deleteProductMutateAsync(productToDelete.id)
        setProductToDelete(null);
    };

    // Filter scan results based on search query
    const filteredScanResults = products
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
            } else
                if (sortField === 'latest') {
                    const scantimestampA = a.scantimestamp;
                    const scantimestampB = b.scantimestamp;
                    return sortDirection === 'asc' ? scantimestampA - scantimestampB : scantimestampB - scantimestampA;
                } else
                    if (sortField === "name") {
                        return directionMultiplier * a.name.localeCompare(b.name);
                    }
            return 0;
        });

    useEffect(() => {
        // create & preload once
        const a = new Audio(dingUrl);
        a.preload = "auto";
        a.volume = 1.0; // tweak if needed
        audioRef.current = a;

        if (allEspModules.length === 1) {
            const deviceId = allEspModules[0].id!
            setESPModulesIsActive({ deviceId, isActive: true })
            setESPModulesMode({ deviceId, mode: "Scan" })
            setESPModulesPower({ deviceId, power: 7 })
        }

        return () => {
            a.pause();
            audioRef.current = null;
            stopESPModulesScanByMode({ mode: "Scan" })
        };
    }, []);

    useEffect(() => {
        // play ding
        const a = audioRef.current;
        if (a && products && products.length > 0) {
            // restart sound if rapid events
            a.pause();
            a.currentTime = 0;
            // browsers may block without prior user interaction
            a.play().catch(() => {/* ignore */ });
        }
    }, [products?.length])

    const thisModeModules = allEspModules?.filter(m => m.mode === "Scan")
    const isScanning = thisModeModules.filter(m => m.isActive && m.isScan).length > 0

    const getGridSize = (columns: number) => {
        switch (columns) {
            case 2:
                return { xs: 12, sm: 6 };
            case 3:
            default:
                return { xs: 12, sm: 4 };
        }
    };

    // Icon mapping for better visual indication
    const getColumnIcon = (columns: number) => {
        return columns === 2 ? <ModuleIcon sx={{ transform: 'rotate(90deg)' }} fontSize="small" /> : <ColumnIcon fontSize="small" />;
    };


    return (
        <>
            {
                !openBackDrop ?
                    <Paper elevation={3} sx={{ pt: 1, pb: 4, px: 1, width: 1, mx: 'auto' }}>
                        <Stack width={1} spacing={0} direction={{ xs: 'column', sm: 'row' }}>
                            <Alert
                                icon={false}
                                sx={{
                                    textAlign: 'center',
                                    alignItems: 'center',
                                    width: { xs: "100%", sm: 240 },
                                    mb: 1,
                                    borderTopRightRadius: { sm: 0 },
                                    borderBottomRightRadius: { sm: 0 },
                                    borderRight: { xs: 0, sm: 1 },
                                    overflow: 'hidden',
                                    position: 'relative',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: isScanning ? 'inherit' : 'yellow',
                                        opacity: theme.palette.mode === "light" ? 0.1 : 0.2,
                                        zIndex: 0,
                                    },
                                    '& > *': {
                                        position: 'relative',
                                        zIndex: 1,
                                    },
                                    '& .MuiAlert-message': {
                                        width: '100%',
                                        padding: 1,
                                    },
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
                                    variant="h5"
                                    fontWeight="bold"
                                    sx={{
                                        display: 'inline-block',
                                        color: 'warning.main',
                                        m: 0, p: 0
                                    }}
                                >
                                    {t["Scan"]}
                                </Typography>
                            </Alert>
                            <Alert
                                icon={false}
                                sx={{
                                    mb: 1,
                                    width: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderTopLeftRadius: { sm: 0 },
                                    borderBottomLeftRadius: { sm: 0 },
                                    overflow: 'hidden',
                                    position: 'relative',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: isScanning ? 'inherit' : 'yellow',
                                        opacity: theme.palette.mode === "light" ? 0.1 : 0.2,
                                        zIndex: 0,
                                    },
                                    '& > *': {
                                        position: 'relative',
                                        zIndex: 1,
                                    },
                                    '& .MuiAlert-message': {
                                        width: '100%',
                                        padding: 1,
                                    },
                                }}
                            >
                                <Stack
                                    direction="row"
                                    justifyContent="flex-end"
                                    alignItems="center"
                                    width="100%"
                                >
                                    <ToggleButtonGroup size='small' value={isScanning ? 'started' : 'stopped'}>
                                        <ToggleButton value={'started'} onClick={handleStartScenario} title='start'>
                                            {
                                                startScanPending ?
                                                    <CircularProgress size={22} /> :
                                                    <PlayArrow
                                                        sx={{
                                                            width: 22,
                                                            ...(isScanning && {
                                                                position: 'relative',
                                                                animation: 'iconPulse 1.6s ease-in-out infinite',
                                                                filter: 'drop-shadow(0 0 6px rgba(76,175,80,0.7))',
                                                                '@keyframes iconPulse': {
                                                                    '0%': { transform: 'scale(.9)', filter: 'drop-shadow(0 0 6px rgba(76,175,80,0.6))' },
                                                                    '50%': { transform: 'scale(1.3)', filter: 'drop-shadow(0 0 14px rgba(76,175,80,1))' },
                                                                    '100%': { transform: 'scale(.9)', filter: 'drop-shadow(0 0 6px rgba(76,175,80,0.6))' },
                                                                },
                                                            }),
                                                        }}
                                                        color={isScanning ? 'success' : 'inherit'}
                                                    />
                                            }
                                        </ToggleButton>
                                        <ToggleButton size='small' value={'stopped'} onClick={handleStopScenario} title='stop'>
                                            {
                                                stopScanPending ?
                                                    <CircularProgress size={22} /> :
                                                    <Stop sx={{ width: 22 }} />
                                            }
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                    <IconButton onClick={handleClearScanHistory} title={t["clear history"]}>
                                        {
                                            clearScanHistoryPending ?
                                                <CircularProgress size={22} /> :
                                                <Clear sx={{ width: 22 }} />
                                        }
                                    </IconButton>
                                </Stack>
                            </Alert>
                        </Stack>
                        <Divider />
                        <>
                            {/* Filters Section */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 1 }}>
                                <TextField
                                    label={t["Search Products"]}
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
                                        <InputLabel>{t["Sort By"]}</InputLabel>
                                        <Select
                                            value={sortField}
                                            onChange={(event) => setSortField(event.target.value as string)}
                                            label={t["Sort By"]}
                                            size="small"
                                            sx={{ width: 125 }}
                                        >
                                            <MenuItem value="latest">{t["Latest"]}</MenuItem>
                                            <MenuItem value="createdAt">{t["Created At"]}</MenuItem>
                                            <MenuItem value="name">{t["Name"]}</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2, pt: 1 }}>
                                <Typography variant="button" sx={{ borderBottom: '2px solid black' }}>
                                    {t["All"]}: {filteredScanResults.length || 0}
                                </Typography>
                                {selectedProducts.length > 0 && <Typography variant="caption">{selectedProducts.length}{t["product(s) selected."]}</Typography>}
                                <Stack direction={"row"} gap={2} alignItems={'center'}>
                                    <ToggleButton
                                        size="small"
                                        value="check"
                                        selected={openBackDrop}
                                        onChange={() => setOpenBackDrop((prevSelected) => !prevSelected)}
                                    >
                                        <PresentToAll fontSize="small" />
                                    </ToggleButton>
                                    <ToggleButtonGroup
                                        value={columnCount}
                                        exclusive
                                        onChange={(_, newValue) => setColumnCount(newValue)}
                                        aria-label="Select column layout"
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            '& .MuiToggleButtonGroup-grouped': {
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                '&:not(:first-of-type)': { borderLeft: 0 },
                                                '&:first-of-type': { borderRadius: '4px 0 0 4px' },
                                                '&:last-of-type': { borderRadius: '0 4px 4px 0' },
                                                '&.Mui-selected': {
                                                    backgroundColor: 'primary.main',
                                                    color: 'white',
                                                    '&:hover': { backgroundColor: 'primary.dark' },
                                                },
                                            },
                                        }}
                                    >
                                        {[2, 3].map((value) => (
                                            <ToggleButton key={value} value={value} size="small">
                                                {getColumnIcon(value)}
                                            </ToggleButton>
                                        ))}
                                    </ToggleButtonGroup>
                                    <Button variant="contained" sx={{ width: 125 }} disabled={selectedProducts.length === 0} onClick={handleInvoiceInquiry}>{t["INVOICE"]}</Button>
                                </Stack>
                            </Box>

                            {/* Product Grid */}
                            <Grid container spacing={2}>
                                {
                                    (filteredScanResults || []).map((product) => {
                                        const productSpotPrice = 10 * (spotPrice?.gold.find(it => it.symbol === product.subType)?.price || 0)
                                        const productSpotKarat = (spotPrice?.gold.find(it => it.symbol === product.subType)?.karat || 0)
                                        const soldQuantity = product.saleItems?.reduce((p, c) => p + c.quantity, 0) || 0

                                        const distansePercentByRSSI = rssiToDistanceStrength(product.scanRSSI)
                                        return (
                                            <Grid size={getGridSize(columnCount)} key={product.id}>
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
                                                    <LinearProgress variant='determinate' value={distansePercentByRSSI} />
                                                    <CardMedia
                                                        component="img"
                                                        height={300}
                                                        width={400}
                                                        image={`api${product.photos[0]}` || "/default-product-image.jpg"}
                                                        alt={product.name}
                                                        sx={{ objectFit: "cover", cursor: "pointer" }}
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
                                                            <Chip label={t[product.type]} />
                                                            <Checkbox disabled={product.quantity - soldQuantity === 0} checked={selectedProducts.includes(product.id)} onClick={() => setSelectedProducts(p => p.includes(product.id) ? p.filter(el => el !== product.id) : [...p, product.id])} />
                                                        </Box>
                                                        <Divider sx={{ mx: -2, mb: 1 }} variant="fullWidth" />
                                                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Typography variant="body2" color="textSecondary" fontWeight={'bold'} fontFamily={"IRANSans, sans-serifRoboto, Arial, sans-serif"}>
                                                                {t["Unit Price:"]} {getIRRCurrency(Math.round(calculateGoldPrice(product.karat, product.weight, product.makingCharge, product.profit, product.vat, { price: productSpotPrice, karat: productSpotKarat }, product.accessoriesCharge) || 0))}
                                                            </Typography>
                                                            <Chip
                                                                label={(product.quantity - soldQuantity) > 0 ?
                                                                    <Typography variant="body2">
                                                                        {t["Available:"]} {product.quantity - soldQuantity}
                                                                    </Typography> :
                                                                    t["Out of stock"]
                                                                }
                                                                sx={{ borderRadius: 1 }}
                                                                color={(product.quantity - soldQuantity) > 0 ? "success" : "warning"}
                                                            />
                                                        </Box>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {t["Unit Weight:"]} {product.weight}g
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {t["Making Charge:"]} {product.makingCharge}%
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {t["Sold Quantity:"]} {soldQuantity}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {t["Sub Type:"]} {GOLD_PRODUCT_SUB_TYPES.find(it => it.symbol === product.subType)?.name}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {t["Inventory Item:"]} {<Checkbox checked={!!product.inventoryItem} />}
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
                                                                                bgcolor: "primary.light",
                                                                                color: "darkslategrey",
                                                                                px: 1,
                                                                                py: 0.3,
                                                                                borderRadius: 1,
                                                                                fontSize: 13,
                                                                                fontWeight: 800,
                                                                            }}
                                                                        >
                                                                            {tag.epc.slice(-6)}
                                                                        </Box>
                                                                    ))}
                                                                </Box>
                                                            )}
                                                        </Box>
                                                        <Stack direction={'row'}>
                                                            <IconButton onClick={() => setProductToEdit(product)} aria-label="edit">
                                                                <Edit color="info" />
                                                            </IconButton>
                                                            <IconButton onClick={() => setProductToDelete(product)} aria-label="delete">
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

                        {/* Edit confirm dialog */}
                        <Dialog disableScrollLock maxWidth="md" fullWidth open={!!productToEdit} onClose={() => setProductToEdit(null)}>
                            <DialogTitle>{t["edit"]} {productToEdit?.name}</DialogTitle>
                            <DialogContent sx={{ p: 2 }}>
                                {productToEdit && <ESPProductRegistration setProductToEdit={setProductToEdit} mode={"Edit"} toEditData={productToEdit as any} />}
                            </DialogContent>
                        </Dialog>


                        {/* Delete confirm dialog */}
                        <Dialog disableScrollLock maxWidth="md" fullWidth open={!!productToDelete} onClose={() => setProductToDelete(null)}>
                            <DialogTitle>{t["Confirm delete"]} {productToDelete?.name}</DialogTitle>
                            <DialogContent>
                                <DialogContentText>
                                    {t["This action cannot be undone. Continue?"]}
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setProductToDelete(null)}>{t["Cancel"]}</Button>
                                <Button onClick={confirmDelete} autoFocus color="error" variant="contained">
                                    {t["Delete"]}
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* Error Message */}
                        {spotPriceIsError && (
                            <Snackbar open={true} autoHideDuration={6000}>
                                <Alert severity="error">{JSON.parse((spotPriceError as Error)?.message).message || t["Something went wrong."]}</Alert>
                            </Snackbar>
                        )}
                        <ErrorSnack
                            deleteProductIsError={deleteProductIsError}
                            deleteProductError={deleteProductError}
                            t={t}
                        />
                    </Paper>
                    :
                    <Backdrop
                        open={openBackDrop}
                        onClick={() => setOpenBackDrop(false)}
                        sx={{
                            zIndex: (theme) => theme.zIndex.drawer + 1,
                            backdropFilter: "blur(8px)",
                        }}
                    >
                        <BackDropBox product={products.sort((a, b) => b.scantimestamp - a.scantimestamp)[0]} />
                    </Backdrop>
            }
        </>
    )
}

export default ESPScan;


interface BackDropBoxProps {
    product: ESPModulesProductScan
}

function BackDropBox({ product }: BackDropBoxProps) {
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!

    const { data: spotPrice } = useGoldCurrency();

    const productSpotPrice = 10 * (spotPrice?.gold.find(it => it.symbol === product.subType)?.price || 0)
    const productSpotKarat = (spotPrice?.gold.find(it => it.symbol === product.subType)?.karat || 0)
    const soldQuantity = product.saleItems?.reduce((p, c) => p + c.quantity, 0) || 0

    return (
        <Card
            sx={{
                minWidth: 400,
                minHeight: 300,
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
                height={300}
                width={400}
                image={`api${product.photos[0]}` || "/default-product-image.jpg"}
                alt={product.name}
                sx={{ objectFit: "cover", cursor: "pointer" }}
            />
            <CardContent sx={{ py: 0.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tooltip title={product.createdBy?.email}>
                        <Typography variant="h5" fontWeight={'bold'}>{product.name}</Typography>
                    </Tooltip>
                    <Chip label={t[product.type]} />
                </Box>
                <Divider sx={{ mx: -2, my: 1 }} variant="fullWidth" />
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" color="textSecondary" fontWeight={'bold'} fontFamily={"IRANSans, sans-serifRoboto, Arial, sans-serif"}>
                        {t["Unit Price:"]} {getIRRCurrency(Math.round(calculateGoldPrice(product.karat, product.weight, product.makingCharge, product.profit, product.vat, { price: productSpotPrice, karat: productSpotKarat }, product.accessoriesCharge) || 0))}
                    </Typography>
                    <Chip
                        label={(product.quantity - soldQuantity) > 0 ?
                            <Typography variant="body1">
                                {t["Available:"]} {product.quantity - soldQuantity}
                            </Typography> :
                            t["Out of stock"]
                        }
                        sx={{ borderRadius: 1 }}
                        color={(product.quantity - soldQuantity) > 0 ? "success" : "warning"}
                    />
                </Box>
                <Typography variant="body1" color="textSecondary">
                    {t["Unit Weight:"]} {product.weight}g
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    {t["Making Charge:"]} {product.makingCharge}%
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    {t["Sold Quantity:"]} {soldQuantity}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    {t["Sub Type:"]} {GOLD_PRODUCT_SUB_TYPES.find(it => it.symbol === product.subType)?.name}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    {t["Inventory Item:"]} {<Checkbox checked={!!product.inventoryItem} />}
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
                                        bgcolor: "primary.light",
                                        color: "darkslategrey",
                                        px: 1,
                                        py: 0.3,
                                        borderRadius: 1,
                                        fontSize: 13,
                                        fontWeight: 800,
                                    }}
                                >
                                    {tag.epc.slice(-6)}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </CardActions>
        </Card>
    )
}