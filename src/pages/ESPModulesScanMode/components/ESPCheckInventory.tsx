import {
    ArrowDownward as ArrowDownwardIcon,
    ArrowUpward as ArrowUpwardIcon,
    Clear,
    HandshakeOutlined,
    PaymentsOutlined,
    PlayArrow,
    Stop
} from '@mui/icons-material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import {
    Alert,
    Backdrop,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
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
    useTheme
} from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useClearEspModulesScanHistory, useEspModules, useEspModulesInventoryItemShouldBeScanned, useSetESPModulePower, useSetESPModulesIsActive, useSetESPModulesMode, useStartESPModulesScanByMode, useStopESPModulesScanByMode } from '../../../api/espModules';
import { useGoldCurrency } from '../../../api/goldCurrency';
import { useESPModulesLive } from '../../../features/useESPModulesLive';
import { useESPModulesScanLive } from '../../../features/useESPModulesScanLive';
import type { ItariffType } from '../../../lib/api';
import type { ESPModulesProductScan } from '../../../lib/socket';
import { GOLD_PRODUCT_SUB_TYPES } from '../../../store/useProductFormStore';
import { calculateGoldPrice } from '../../../utils/calculateGoldPrice';
import { getIRRCurrency } from '../../../utils/getIRRCurrency';
import { rssiToDistanceStrength } from '../../../utils/rssiToDistanceStrength';
import { translate } from '../../../utils/translate';
import { uniqueByIdAndTimeStamp } from '../../../utils/uniqueArrayOfObjectsBasedOnIdAndTimestamp';



const ESPCheckInventory: React.FC = () => {
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!
    const startWaitRef = useRef<NodeJS.Timeout | null>(null);

    const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(30);
    const [sortBy, setSortBy] = useState<'name' | 'weight' | 'latest'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [openBackDrop, setOpenBackDrop] = useState<boolean>(false);
    const [tariffType, setTariffType] = useState<ItariffType>("CT")

    const { data: allEspModules = [] } = useEspModules();
    const { mutate: setESPModulesPower, } = useSetESPModulePower()
    const { mutate: setESPModulesIsActive, } = useSetESPModulesIsActive()
    const { mutate: setESPModulesMode, } = useSetESPModulesMode()

    useESPModulesLive(true)
    useESPModulesScanLive(true)

    const { mutate: clearScanHistoryMutate, isPending: clearScanHistoryPending } = useClearEspModulesScanHistory()
    const { mutate: startESPModulesScanByMode, isPending: startScanPending } = useStartESPModulesScanByMode()
    const { mutate: stopESPModulesScanByMode, isPending: stopScanPending } = useStopESPModulesScanByMode()

    const { data: spotPrice } = useGoldCurrency();

    const products = uniqueByIdAndTimeStamp(
        allEspModules
            .filter(m => m.tagScanResults && m.tagScanResults.Inventory)
            .map(el => el.tagScanResults!.Inventory)
            .flat()
    ) as unknown as ESPModulesProductScan[]

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
        if (allEspModules.length === 1) {
            const deviceId = allEspModules[0].id!
            const isActive = allEspModules[0].isActive!
            const mode = allEspModules[0].mode!
            const currentHardPower = allEspModules[0].currentHardPower!
            if (isActive === false) {
                setESPModulesIsActive({ deviceId, isActive: true })
            }
            if (mode !== "Inventory") {
                setESPModulesMode({ deviceId, mode: "Inventory" })
            }
            if (currentHardPower !== 26) {
                setESPModulesPower({ deviceId, power: 26 })
            }
        }
        await new Promise(res => setTimeout(res, 500));
        startESPModulesScanByMode({ mode: "Inventory" })
        startWaitRef.current = setTimeout(() => {
            handleStopScenario()
        }, 180000);
    }

    const handleStopScenario = () => {
        stopESPModulesScanByMode({ mode: "Inventory" })
    }

    const handleClearScanHistory = async () => {
        clearScanHistoryMutate({ mode: "Inventory" })
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

    const thisModeModules = allEspModules?.filter(m => m.mode === "Inventory")
    const isScanning = thisModeModules.filter(m => m.isActive && m.isScan).length > 0

    useEffect(() => {
        return () => {
            stopESPModulesScanByMode({ mode: "Inventory" })
            if (startWaitRef.current) clearTimeout(startWaitRef.current);
        };
    }, []);


    return (
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
                        {t["Inventory"]}
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
                            <ToggleButton size='small' value={'started'} onClick={handleStartScenario} title='start'>
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

                    <ToggleButtonGroup
                        size="small"
                        value={tariffType}
                        exclusive
                        onChange={(_, newValue) => setTariffType(newValue)}
                        aria-label="Select tariff type"
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
                        <ToggleButton title={t["CT"]} value={"CT"} size="small"><PaymentsOutlined fontSize="small" /></ToggleButton>
                        <ToggleButton title={t["UT"]} value={"UT"} size="small"><HandshakeOutlined fontSize="small" /></ToggleButton>
                    </ToggleButtonGroup>
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
            <Paper elevation={2} sx={{ mb: 1 }}>
                <Button
                    onClick={() => {
                        setOpenBackDrop(true)
                    }}
                    fullWidth
                >
                    {t["Get Rest Of What Should be scanned."]}
                </Button>
            </Paper>
            {viewMode === 'card' ? (
                <>
                    <Grid container spacing={3}>
                        {paginatedProducts.map((product) => {
                            const productSpotPrice = 10 * (spotPrice?.gold.find(it => it.symbol === product.subType)?.price || 0)
                            const productSpotKarat = (spotPrice?.gold.find(it => it.symbol === product.subType)?.karat || 0)
                            const soldQuantity = product.saleItems?.reduce((p, c) => p + c.quantity, 0) || 0

                            const distansePercentByRSSI = rssiToDistanceStrength(product.scanRSSI)
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
                                        <LinearProgress variant='determinate' value={distansePercentByRSSI} />
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
                                                <InfoRow
                                                    label={t["Unit Price:"]}
                                                    value={getIRRCurrency(
                                                        calculateGoldPrice(
                                                            product.karat,
                                                            product.weight,
                                                            product.makingChargeSell,
                                                            product.profit,
                                                            product.vat,
                                                            { price: productSpotPrice, karat: productSpotKarat },
                                                            product.accessoriesCharge,
                                                            0
                                                        )?.[tariffType] || 0
                                                    )}
                                                />
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
                                            <InfoRow label={t["Unit Weight:"]} value={`${product.weight} ${t["g"]}`} />
                                            <InfoRow label={t["Making Charge Sell:"]} value={`${product.makingChargeSell}%`} />
                                            <InfoRow label={t["Sold Quantity:"]} value={`${soldQuantity}`} />
                                            <InfoRow label={t["Sub Type:"]} value={`${GOLD_PRODUCT_SUB_TYPES.find(it => it.symbol === product.subType)?.name}`} />
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
                                        {t["Making Charge Buy"]}
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
                                    const distansePercentByRSSI = rssiToDistanceStrength(product.scanRSSI)

                                    return (
                                        <TableRow title={product.deviceId} hover key={product.id}>
                                            <TableCell align="center">
                                                <Box
                                                    component={'img'}
                                                    src={`api${product.previews[0]}` || "/default-product-image.jpg"}
                                                    alt={product.name}
                                                    sx={{ width: 70, height: 70, borderRadius: 1, objectFit: "cover", }}
                                                />
                                                <LinearProgress variant='determinate' value={distansePercentByRSSI} />
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
                                                {getIRRCurrency(Math.round(calculateGoldPrice(product.karat, product.weight, product.makingChargeBuy, product.profit, product.vat, { price: productSpotPrice, karat: productSpotKarat }, product.accessoriesCharge, 0)?.[tariffType] || 0)).replace("ریال", "")}
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
                                                {product.makingChargeBuy}%
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
            {
                openBackDrop &&
                <Backdrop
                    open={openBackDrop}
                    onClick={() => setOpenBackDrop(false)}
                    sx={{
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                        backdropFilter: "blur(4px)",
                    }}
                >
                    <BackDropBox epcList={products.map(p => p.tags?.map(t => t.epc)).flat().filter(e => e != null)} />
                </Backdrop>
            }
        </Paper>
    );
};

export default ESPCheckInventory;




interface InfoRowProps {
    label: string;
    value: React.ReactNode;
    labelWidth?: number; // default width (you can override)
}

export function InfoRow({ label, value, labelWidth = 100 }: InfoRowProps) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                my: 0.3,
            }}
        >
            {/* FIXED LABEL */}
            <Typography
                sx={{
                    width: labelWidth,
                    flexShrink: 0,
                    fontWeight: "bold",
                    color: "text.secondary",
                    fontFamily: "IRANSans, Roboto, Arial, sans-serif",
                }}
                variant="body2"
            >
                {label}
            </Typography>

            {/* VALUE (FLEXIBLE) */}
            <Typography
                sx={{
                    flex: 1,
                    fontFamily: "IRANSans, Roboto, Arial, sans-serif",
                }}
                variant="body2"
            >
                {value}
            </Typography>
        </Box>
    );
}


interface BackDropBoxProps {
    epcList: string[]
}

function BackDropBox({ epcList }: BackDropBoxProps) {
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!

    const { mutate: getInventoryItemShouldBeScanned, data: products, status } = useEspModulesInventoryItemShouldBeScanned()

    useEffect(() => {
        console.log("length changed")
        getInventoryItemShouldBeScanned({ epcList })
    }, [epcList.length])

    if (status === "pending") {
        return <CircularProgress />
    }

    if (!products || products.length <= 0) {
        return <Alert severity='success'>{t["You Successfully Scanned All Inventory Items."]}</Alert>
    }

    const product = products[0]
    const photoUrl = Array.isArray(product.photos) ? `api${product.photos[0]}` : `api${product.photos}`
    return (
        <Stack direction={'column'} spacing={1}
            onClick={(e) => e.stopPropagation()}
            sx={{
                width: { xs: "90%", sm: 500 },
                bgcolor: "background.paper",
                color: "text.primary",
                p: 3,
                borderRadius: 0.5,
                boxShadow: 8,
                position: "relative",
            }}
        >
            {/* Product Title */}
            <Typography variant="h6" fontWeight={700} mb={1}>
                {product.name}
            </Typography>

            {/* Images */}
            {photoUrl && (
                <Box
                    sx={{
                        width: "100%",
                        height: 180,
                        borderRadius: 2,
                        overflow: "hidden",
                        mb: 2,
                        img: { width: "100%", height: "100%", objectFit: "cover" },
                    }}
                >
                    <Box component={"img"} src={photoUrl} alt={product.name} />
                </Box>
            )}

            {/* Info */}
            <Stack direction={'row'} justifyContent={'space-between'} width={1}>
                <Chip sx={{ borderRadius: 1 }} label={product.karat} />
                <Chip label={t[product.type]} />
            </Stack>
            <Typography variant="body2" color="textSecondary">
                {t["Unit Weight:"]} {product.weight}{t["g"]}
            </Typography>
            <Typography variant="body2" color="textSecondary">
                {t["Sub Type:"]} {GOLD_PRODUCT_SUB_TYPES.find(it => it.symbol === product.subType)?.[theme.direction === "rtl" ? "name" : "name_en"]}
            </Typography>
            {/* Tags */}
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
        </Stack>
    )
}