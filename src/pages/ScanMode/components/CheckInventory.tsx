import {
    ArrowDownward as ArrowDownwardIcon,
    ArrowUpward as ArrowUpwardIcon,
    Clear,
    PlayArrow,
    Settings,
    Stop
} from '@mui/icons-material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import {
    Alert,
    Box,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useGoldCurrency } from '../../../api/goldCurrency';
import { clearScenarioHistory, useCurrentScenario, useInitJrdModules, useScanResults, useStartScenario, useStopScenario } from '../../../api/jrdDevices';
import { useScanResultsLive } from '../../../features/useScanResultsLive';
import { GOLD_PRODUCT_SUB_TYPES } from '../../../store/useProductFormStore';
import { calculateGoldPrice } from '../../../utils/calculateGoldPrice';
import { getIRRCurrency } from '../../../utils/getIRRCurrency';
import { powerPercentToDbm } from '../../../utils/percentDbm';
import { translate } from '../../../utils/translate';
import ModuleSettings, { inventoryModeScanPowerInPercent } from './ModuleSettings';
import { useModulePrefs } from './jrd-modules-default-storage';



const CheckInventory: React.FC = () => {
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!
    const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(30);
    const [sortBy, setSortBy] = useState<'name' | 'weight' | 'latest'>('latest');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [openSettings, setOpenSettings] = React.useState(false);
    const fullScreenSettingsDialog = useMediaQuery(theme.breakpoints.down('md'));

    const { data: scenarioState = [] } = useCurrentScenario()
    const { mutate: clearScenarioHistoryMutate } = clearScenarioHistory()
    const { mutate: stopScenarioMutate } = useStopScenario()
    const { mutate: startScenarioMutate } = useStartScenario()
    const { data: scanResults = { Inventory: [] } } = useScanResults("Inventory");

    const { data: spotPrice, /*isLoading: spotPriceIsLoading, error: spotPriceError*/ } = useGoldCurrency();
    const { powerById, activeById, modeById } = useModulePrefs();
    const initJrdModulesMutation = useInitJrdModules();


    useScanResultsLive("Inventory", 5000, true);

    const products = scanResults.Inventory

    const inventoryCurrentScenario = scenarioState?.filter(el => el.state.isActive && el.state.mode === "Inventory")


    const handleInitModules = async () => {
        // Trigger the mutation on button click
        const serverIds = scenarioState.map(el => el.id)

        const localIds = Array
            .from(new Set<string>([
                ...Object.keys(powerById ?? {}),
                ...Object.keys(activeById ?? {}),
                ...Object.keys(modeById ?? {}),
            ])).filter(el => serverIds.includes(el))

        const initVars =
            Array.from(new Set<string>([...localIds, ...serverIds]))
                .map((deviceId) => {
                    return ({
                        deviceId,
                        power: powerPercentToDbm(powerById[deviceId]) ?? powerPercentToDbm(inventoryModeScanPowerInPercent) ?? 100,
                        mode: modeById[deviceId] ?? "Inventory",
                        isActive: activeById[deviceId] ?? true
                    })
                })

        if (initVars.length > 0) {
            initJrdModulesMutation.mutate(initVars);
        }
    };

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSortOrderToggle = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        setPage(0);
    };

    const handleSortChange = (e: any, value: any) => {
        e.preventDefault();
        setSortBy(value);
        setPage(0);
    };

    const handleViewMode = (e: any, value: any) => {
        e.preventDefault();
        setViewMode(value);
    };

    const handleStartScenario = async () => {
        startScenarioMutate({ mode: "Inventory", ids: (inventoryCurrentScenario || [])?.map(el => el.id) })
    }

    const handleStopScenario = async () => {
        stopScenarioMutate({ mode: "Inventory" })
    }

    const handleClearScenarioHistory = async () => {
        clearScenarioHistoryMutate({ mode: "Inventory" })
    }

    const sortedProducts = useMemo(() => {
        const sorted = [...(products || [])];
        sorted.sort((a, b) => {
            if (sortBy === 'name') {
                return sortOrder === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            } else {
                if (sortBy === 'latest') {
                    const scantimestampA = a.scantimestamp;
                    const scantimestampB = b.scantimestamp;
                    return sortOrder === 'asc' ? scantimestampA - scantimestampB : scantimestampB - scantimestampA;
                } else {
                    const weightA = a.weight;
                    const weightB = b.weight;
                    return sortOrder === 'asc' ? weightA - weightB : weightB - weightA;
                }
            }
        });
        return sorted;
    }, [sortBy, sortOrder, products]);

    const paginatedProducts = sortedProducts.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
        // This cleanup function runs when the component unmounts

        return () => {
            handleStopScenario();
        };
    }, []);

    useEffect(() => { handleInitModules() }, [scenarioState.map(x => x.id).sort().join()])



    const isScanning = (inventoryCurrentScenario || []).filter(el => el.state.isScan).length > 0

    return (
        <Paper elevation={3} sx={{ pt: 1, pb: 4, px: 1, width: 1, mx: 'auto' }}>
            <Stack width={1} spacing={0} direction={{ xs: 'column', sm: 'row' }}>
                <Alert
                    icon={false}
                    sx={{
                        textAlign: 'center',
                        width: { xs: "100%", sm: 240 },
                        mb: 1,
                        padding: '8px 10px',
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
                        variant="button"
                        fontWeight="bold"
                        sx={{
                            display: 'inline-block',
                            color: 'warning.main',
                        }}
                    >
                        {t["Scanning IDs"]}
                    </Typography>
                    {initJrdModulesMutation.isPending ? <CircularProgress size={20} /> : <Typography variant='caption'>{inventoryCurrentScenario?.map(el => el.id).join(" - ")}</Typography>}
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
                        justifyContent="space-between"
                        alignItems="center"
                        width="100%"
                    >
                        <Stack gap={0.5} direction={'row'} alignItems={'center'} display={'flex'} >
                            <ToggleButtonGroup disabled={(inventoryCurrentScenario || []).length === 0} value={isScanning ? 'started' : 'stopped'}>
                                <ToggleButton value={'started'} onClick={handleStartScenario} title='start'>
                                    <PlayArrow
                                        sx={{
                                            ...(isScanning && {
                                                position: 'relative',
                                                animation: 'iconPulse 1.6s ease-in-out infinite',
                                                filter: 'drop-shadow(0 0 6px rgba(76,175,80,0.7))',
                                                '@keyframes iconPulse': {
                                                    '0%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 6px rgba(76,175,80,0.6))' },
                                                    '50%': { transform: 'scale(1.2)', filter: 'drop-shadow(0 0 14px rgba(76,175,80,1))' },
                                                    '100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 6px rgba(76,175,80,0.6))' },
                                                },
                                            }),
                                        }}
                                        color={isScanning ? 'success' : 'inherit'}
                                    />
                                </ToggleButton>
                                <ToggleButton value={'stopped'} onClick={handleStopScenario} title='stop'><Stop /></ToggleButton>
                            </ToggleButtonGroup>
                            <IconButton onClick={handleClearScenarioHistory} title='stop'><Clear /></IconButton>
                        </Stack>
                        <IconButton onClick={() => setOpenSettings(true)}><Settings /></IconButton>
                    </Stack>
                </Alert>
            </Stack>
            <Divider />
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', py: 1 }}>
                    <ToggleButtonGroup
                        value={sortBy}
                        exclusive
                        onChange={handleSortChange}
                        size="small"
                        aria-label="sort by"
                    >
                        <ToggleButton value="latest" aria-label="sort by latest">
                            <Tooltip title="Sort by Latest">
                                <Typography>{t["Latest"]}</Typography>
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="name" aria-label="sort by name">
                            <Tooltip title="Sort by Name">
                                <Typography>{t["Name"]}</Typography>
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="weight" aria-label="sort by weight">
                            <Tooltip title="Sort by Weight">
                                <Typography>{t["Weight"]}</Typography>
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Tooltip title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}>
                        <IconButton onClick={handleSortOrderToggle} size="small">
                            {sortOrder === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewMode}
                    size="small"
                    aria-label="view by"
                >
                    <ToggleButton value="card" aria-label="view by card mode">
                        <Tooltip title="View by Card mode">
                            <ViewModuleIcon />
                        </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="table" aria-label="view by table mode">
                        <Tooltip title="View by Table mode">
                            <ViewListIcon />
                        </Tooltip>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            {viewMode === 'card' ? (
                <>
                    <Grid container spacing={3}>
                        {paginatedProducts.map((product) => {
                            const productSpotPrice = 10 * (spotPrice?.gold.find(it => it.symbol === product.subType)?.price || 0)
                            const productSpotKarat = (spotPrice?.gold.find(it => it.symbol === product.subType)?.karat || 0)
                            const soldQuantity = product.saleItems?.reduce((p, c) => p + c.quantity, 0) || 0

                            return (
                                <Grid
                                    size={{
                                        xs: 12,
                                        sm: 6,
                                        md: 4,
                                    }}
                                    key={product.id}
                                    component="div"
                                >
                                    <Card sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }}>
                                        <CardMedia
                                            component="img"
                                            height={300}
                                            width={400}
                                            image={`api${product.photos[0]}` || "/default-product-image.jpg"}
                                            alt={product.name}
                                        />
                                        <CardContent>
                                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Tooltip title={product.createdBy?.email}>
                                                    <Typography variant="h6">{product.name}</Typography>
                                                </Tooltip>
                                                <Chip label={t[product.type]} />
                                            </Box>
                                            <Divider sx={{ mx: -2, my: 1 }} variant="fullWidth" />
                                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="textSecondary" fontWeight={'bold'} fontFamily={"IRANSans, sans-serifRoboto, Arial, sans-serif"}>
                                                    Unit Price: {getIRRCurrency(calculateGoldPrice(product.karat, product.weight, product.makingCharge, product.profit, product.vat, { price: productSpotPrice, karat: productSpotKarat }, product.accessoriesCharge) || 0)}
                                                </Typography>
                                                <Chip
                                                    label={(product.quantity - soldQuantity) > 0 ?
                                                        <Typography variant="body2">
                                                            {t["Available"]}: {product.quantity - soldQuantity}
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
                                        </CardContent>
                                        <CardActions>
                                            {
                                                <>
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
                                                </>
                                            }
                                        </CardActions>
                                    </Card>
                                </Grid>
                            )
                        })}
                    </Grid>
                    <TablePagination
                        rowsPerPageOptions={[30, 60, 90]}
                        component="div"
                        count={(products || []).length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        slotProps={{
                            root: {
                                sx: (theme) => ({
                                    mt: 2,
                                    p: 0,
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    background: theme.palette.mode === "light" ?
                                        'linear-gradient(45deg, #fffbeaff, #fff8e0ff)' :
                                        'linear-gradient(45deg, #fff8e13d, #f5e8b831)'
                                })
                            },
                            displayedRows: {
                                sx: {
                                    m: 0,
                                    fontWeight: 'bold',
                                    color: '#8b6508',
                                }
                            },
                            selectLabel: {
                                sx: {
                                    fontWeight: 'bold',
                                    color: '#8b6508',
                                }
                            },
                            select: {
                                sx: {
                                    fontWeight: 'bold',
                                    color: '#8b6508',
                                }
                            },
                            actions: {
                                nextButton: {
                                    sx: (theme) => ({
                                        p: 2,
                                        backgroundColor: theme.alpha("#8b6508", 0.8),
                                        borderRadius: 0,
                                        transition: 'background-color 0.2s',
                                        '&:hover': {
                                            backgroundColor: '#a67c00',
                                        },
                                        '&.Mui-disabled': {
                                            backgroundColor: theme.palette.mode === "light" ? '#d4d4d4' : "#d4d4d49f",
                                        },
                                    }),
                                },
                                previousButton: {
                                    sx: (theme) => ({
                                        p: 2,
                                        backgroundColor: theme.alpha("#8b6508", 0.8),
                                        borderRadius: 0,
                                        transition: 'background-color 0.2s',
                                        '&:hover': {
                                            backgroundColor: '#a67c00',
                                        },
                                        '&.Mui-disabled': {
                                            backgroundColor: theme.palette.mode === "light" ? '#d4d4d4' : "#d4d4d49f",
                                        },
                                    }),
                                }
                            }
                        }}
                        labelRowsPerPage={t["page rows"]}
                        labelDisplayedRows={({ from, to, count }) => {
                            return (
                                <Stack direction={"column"} p={0} m={0} width={70} color='#8b6508'>
                                    <Typography variant='button' p={0} m={0} textAlign={'center'}>
                                        {`${from}–${to}`}
                                    </Typography>
                                    <Typography variant='button' p={0} m={0} textAlign={'center'}>
                                        {`${count !== -1 ? count : `more than ${to}`}`}
                                    </Typography>
                                </Stack>
                            )
                        }}
                        slots={{ displayedRows: 'div' }}
                    />
                </>
            ) : (
                <>
                    <TableContainer sx={{ borderRadius: 0, border: 1 }}>
                        <Table>
                            <TableHead >
                                <TableRow sx={theme => ({ bgcolor: theme.palette.mode === "light" ? theme.alpha("#c57213ff", .5) : theme.alpha("#AA6F2A", .6) })}>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        {t["Preview"]}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        {t["Name"]}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        {t["Type"]}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        {t["Unit Price (ریال)"]}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        {t["Availability"]}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        {t["Unit Weight (g)"]}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        {t["Making Charge"]}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        {t["Sold Qty"]}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        {t["Sub Type"]}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        {t["Tags"]}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedProducts.map((product) => {
                                    const productSpotPrice = 10 * (spotPrice?.gold.find(it => it.symbol === product.subType)?.price || 0)
                                    const productSpotKarat = (spotPrice?.gold.find(it => it.symbol === product.subType)?.karat || 0)
                                    const soldQuantity = product.saleItems?.reduce((p, c) => p + c.quantity, 0) || 0

                                    return (
                                        <TableRow title={product.deviceId} hover key={product.id}>
                                            <TableCell align="center">
                                                <Box
                                                    component={'img'}
                                                    src={`api${product.previews[0]}` || "/default-product-image.jpg"}
                                                    alt={product.name}
                                                    sx={{ width: 70, height: 70, borderRadius: 1, objectFit: "cover", }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title={product.createdBy?.email ?? ""}>
                                                    <Typography variant="subtitle2">{product.name}</Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={t[product.type]} size="small" />
                                            </TableCell>
                                            <TableCell align="center" variant="body" color="textSecondary" sx={{ fontWeight: 'bold', fontFamily: "IRANSans, sans-serifRoboto, Arial, sans-serif" }} >
                                                {getIRRCurrency(Math.round(calculateGoldPrice(product.karat, product.weight, product.makingCharge, product.profit, product.vat, { price: productSpotPrice, karat: productSpotKarat }, product.accessoriesCharge) || 0)).replace("ریال", "")}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    size="small"
                                                    color={(product.quantity - soldQuantity) > 0 ? "success" : "warning"}
                                                    sx={{ borderRadius: 1 }}
                                                    label={
                                                        (product.quantity - soldQuantity) > 0 ? (
                                                            <Typography variant="body2" component="span">
                                                                {t["Available"]}: {product.quantity - soldQuantity}
                                                            </Typography>
                                                        ) : (
                                                            t["Out of stock"]
                                                        )
                                                    }
                                                    aria-label={(product.quantity - soldQuantity) > 0 ? `${t["Available"]} ${product.quantity - soldQuantity}` : "Out of stock"}
                                                />
                                            </TableCell>
                                            <TableCell align="center" variant="body" color="textSecondary">
                                                {product.weight}
                                            </TableCell>
                                            <TableCell align="center" variant="body" color="textSecondary">
                                                {product.makingCharge}%
                                            </TableCell>
                                            <TableCell align="center" variant="body" color="textSecondary">
                                                {soldQuantity}
                                            </TableCell>
                                            <TableCell align="center" variant="body" color="textSecondary">
                                                {GOLD_PRODUCT_SUB_TYPES.find(it => it.symbol === product.subType)?.name}
                                            </TableCell>
                                            <TableCell align="center">
                                                {product.tags?.length ? (
                                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: 'center' }}>
                                                        {product.tags.map((tag) => (
                                                            <Box
                                                                key={tag.id}
                                                                sx={{
                                                                    bgcolor: "primary.main",
                                                                    color: "darkslategrey",
                                                                    px: 1,
                                                                    py: 0.5,
                                                                    borderRadius: 1,
                                                                    fontSize: 12,
                                                                    fontWeight: 800,
                                                                    border: (products || []).reduce((max, obj) => obj.scantimestamp > (max?.scantimestamp ?? -Infinity) ? obj : max).scantimestamp === product.scantimestamp ? '1px solid red' : ''
                                                                }}
                                                            >
                                                                {tag.epc}
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        —
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[30, 60, 90]}
                        component="div"
                        count={(products || []).length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        slotProps={{
                            root: {
                                sx: (theme) => ({
                                    mt: 2,
                                    p: 0,
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    background: theme.palette.mode === "light" ?
                                        'linear-gradient(45deg, #fffbeaff, #fff8e0ff)' :
                                        'linear-gradient(45deg, #fff8e13d, #f5e8b831)'
                                })
                            },
                            displayedRows: {
                                sx: {
                                    m: 0,
                                    fontWeight: 'bold',
                                    color: '#8b6508',
                                }
                            },
                            selectLabel: {
                                sx: {
                                    fontWeight: 'bold',
                                    color: '#8b6508',
                                }
                            },
                            select: {
                                sx: {
                                    fontWeight: 'bold',
                                    color: '#8b6508',
                                }
                            },
                            actions: {
                                nextButton: {
                                    sx: (theme) => ({
                                        p: 2,
                                        backgroundColor: theme.alpha("#8b6508", 0.8),
                                        borderRadius: 0,
                                        transition: 'background-color 0.2s',
                                        '&:hover': {
                                            backgroundColor: '#a67c00',
                                        },
                                        '&.Mui-disabled': {
                                            backgroundColor: theme.palette.mode === "light" ? '#d4d4d4' : "#d4d4d49f",
                                        },
                                    }),
                                },
                                previousButton: {
                                    sx: (theme) => ({
                                        p: 2,
                                        backgroundColor: theme.alpha("#8b6508", 0.8),
                                        borderRadius: 0,
                                        transition: 'background-color 0.2s',
                                        '&:hover': {
                                            backgroundColor: '#a67c00',
                                        },
                                        '&.Mui-disabled': {
                                            backgroundColor: theme.palette.mode === "light" ? '#d4d4d4' : "#d4d4d49f",
                                        },
                                    }),
                                }
                            }
                        }}
                        labelRowsPerPage={t["page rows"]}
                        labelDisplayedRows={({ from, to, count }) => {
                            return (
                                <Stack direction={"column"} p={0} m={0} width={70} color='#8b6508'>
                                    <Typography variant='button' p={0} m={0} textAlign={'center'}>
                                        {`${from}–${to}`}
                                    </Typography>
                                    <Typography variant='button' p={0} m={0} textAlign={'center'}>
                                        {`${count !== -1 ? count : `more than ${to}`}`}
                                    </Typography>
                                </Stack>
                            )
                        }}
                        slots={{ displayedRows: 'div' }}
                    />
                </>
            )}

            <ModuleSettings
                openSettings={openSettings}
                setOpenSettings={setOpenSettings}
                fullScreenSettingsDialog={fullScreenSettingsDialog}
                scanMode='Inventory'
            />
        </Paper>
    );
};

export default CheckInventory;