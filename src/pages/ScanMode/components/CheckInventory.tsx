import {
    ArrowDownward as ArrowDownwardIcon,
    ArrowUpward as ArrowUpwardIcon,
    PlayArrow,
    Settings,
    Stop
} from '@mui/icons-material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
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
import React, { useMemo, useState } from 'react';
import { useScanResults, useScenarioState, useStartScenario, useStopScenario } from '../../../api/modules';
import { useScanResultsLive } from '../../../features/useScanResultsLive';
import ModuleSettings from './ModuleSettings';


// Define the Product interface
interface Product {
    id: number;
    name: string;
    image: string;
    weight: string;
}

// Sample product data for a gold jewelry store
const products_: Product[] = [
    {
        id: 1,
        name: 'Gold Necklace',
        image: 'https://www.shutterstock.com/shutterstock/photos/2256160991/display_1500/stock-photo-gold-pendant-with-blue-crystals-on-a-thin-chain-on-a-white-background-2256160991.jpg',
        weight: '20g',
    },
    {
        id: 2,
        name: 'Gold Ring',
        image: 'https://www.shutterstock.com/shutterstock/photos/2198896509/display_1500/stock-photo-diamond-ring-yellow-gold-isolated-on-white-engagement-solitaire-style-ring-2198896509.jpg',
        weight: '5g',
    },
    {
        id: 3,
        name: 'Gold Bracelet',
        image: 'https://www.shutterstock.com/shutterstock/photos/1926931343/display_1500/stock-photo-gold-bangle-on-white-background-1926931343.jpg',
        weight: '15g',
    },
    {
        id: 4,
        name: 'Gold Earrings',
        image: 'https://www.shutterstock.com/shutterstock/photos/2256160991/display_1500/stock-photo-gold-pendant-with-blue-crystals-on-a-thin-chain-on-a-white-background-2256160991.jpg',
        weight: '8g',
    },
    {
        id: 5,
        name: 'Gold Pendant',
        image: 'https://www.shutterstock.com/shutterstock/photos/2198896509/display_1500/stock-photo-diamond-ring-yellow-gold-isolated-on-white-engagement-solitaire-style-ring-2198896509.jpg',
        weight: '12g',
    },
    {
        id: 6,
        name: 'Gold Anklet',
        image: 'https://www.shutterstock.com/shutterstock/photos/1926931343/display_1500/stock-photo-gold-bangle-on-white-background-1926931343.jpg',
        weight: '18g',
    },
];


const CheckInventory: React.FC = () => {
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(3);
    const [sortBy, setSortBy] = useState<'name' | 'weight'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [openSettings, setOpenSettings] = React.useState(false);
    const theme = useTheme();
    const fullScreenSettingsDialog = useMediaQuery(theme.breakpoints.down('md'));

    const { data: scenarioState } = useScenarioState()
    const { mutateAsync: stopScenarioMutateAsync } = useStopScenario()
    const { mutateAsync: startScenarioMutateAsync } = useStartScenario()
    const { data: scanResults = [] } = useScanResults("Inventory");

    useScanResultsLive("Inventory", 5000, true);

    const products = scanResults.map((p, i) => ({
        image: '/images/buttons/gold_jewelry_resized.png',
        id: i,
        name: p.epc || '',
        weight: `${p.rssi}` || ''
    }))
    // console.log(products)

    const handleCalculatePrice = (product: Product): void => {
        alert(`Calculating price for ${product.name} (${product.weight})...`);
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
        const start = await startScenarioMutateAsync({ mode: "Inventory" })
        console.log(start)
    }

    const handleStopScenario = async () => {
        const stop = await stopScenarioMutateAsync()
        console.log(stop)
    }

    const sortedProducts = useMemo(() => {
        const sorted = [...products];
        sorted.sort((a, b) => {
            if (sortBy === 'name') {
                return sortOrder === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            } else {
                const weightA = parseFloat(a.weight);
                const weightB = parseFloat(b.weight);
                return sortOrder === 'asc' ? weightA - weightB : weightB - weightA;
            }
        });
        return sorted;
    }, [sortBy, sortOrder, products]);

    const paginatedProducts = sortedProducts.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Paper elevation={3} sx={{ pt: 1, pb: 4, px: 1, width: 1, mx: 'auto' }}>
            <Stack width={1} spacing={0} direction={{ xs: 'column', sm: 'row' }}>
                <Alert
                    icon={false}
                    sx={{
                        textAlign: 'center',
                        width: { xs: "100%", sm: 200 },
                        mb: 1, display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        '& .MuiAlert-message': {
                            width: '100%',
                            padding: 0
                        },
                        borderTopRightRadius: { sm: 0 },
                        borderBottomRightRadius: { sm: 0 },
                        borderRight: { xs: 0, sm: 1 }
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
                        <ToggleButtonGroup disabled={!(scenarioState?.scanMode === "Inventory")} value={scenarioState?.isActiveScenario ? 'started' : 'stopped'}>
                            <ToggleButton value={'started'} onClick={handleStartScenario} title='start'><PlayArrow /></ToggleButton>
                            <ToggleButton value={'stopped'} onClick={handleStopScenario} title='stop'><Stop /></ToggleButton>
                        </ToggleButtonGroup>
                        {scenarioState?.scanMode}
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
                        <ToggleButton value="name" aria-label="sort by name">
                            <Tooltip title="Sort by Name">
                                <Typography>Name</Typography>
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="weight" aria-label="sort by weight">
                            <Tooltip title="Sort by Weight">
                                <Typography>Weight</Typography>
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
                        {paginatedProducts.map((product) => (
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
                                        height="140"
                                        image={product.image}
                                        alt={product.name}
                                    />
                                    <CardContent>
                                        <Typography variant="h6" align="center">{product.name}</Typography>
                                        <Typography variant="body2" color="text.secondary" align="center">
                                            Weight: {product.weight}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'center' }}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleCalculatePrice(product as any)}
                                            sx={{ bgcolor: '#8b6508', '&:hover': { bgcolor: '#a67c00' } }}
                                        >
                                            Calculate Price
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    <TablePagination
                        rowsPerPageOptions={[3, 6, 9]}
                        component="div"
                        count={products.length}
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
                        labelRowsPerPage="page rows"
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
                                        Preview
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        Name
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        Weight
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                            fontWeight: 'bold',
                                            borderBottom: '2px solid #8b6508',
                                        }}
                                    >
                                        Action
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedProducts.map((product) => (
                                    <TableRow hover key={product.id}>
                                        <TableCell align="center">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                style={{ width: 50, height: 50, borderRadius: 4 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">{product.name}</TableCell>
                                        <TableCell align="center">{product.weight}</TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleCalculatePrice(product as any)}
                                                sx={{ bgcolor: '#8b6508', '&:hover': { bgcolor: '#a67c00' } }}
                                            >
                                                Online Price
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[3, 6, 9]}
                        component="div"
                        count={products.length}
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
                        labelRowsPerPage="page rows"
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

            <ModuleSettings openSettings={openSettings} setOpenSettings={setOpenSettings} fullScreenSettingsDialog={fullScreenSettingsDialog} />
        </Paper>
    );
};

export default CheckInventory;
































// import ViewListIcon from '@mui/icons-material/ViewList';
// import ViewModuleIcon from '@mui/icons-material/ViewModule';
// import {
//     Button,
//     Card,
//     CardActions,
//     CardContent,
//     CardMedia,
//     Grid,
//     IconButton,
//     Paper,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     Tooltip,
//     Typography,
// } from '@mui/material';
// import { useState } from 'react';

// interface Product {
//     id: number;
//     name: string;
//     image: string;
//     weight: string;
// }
// // Sample product data for a gold jewelry store
// const products: Product[] = [
//     {
//         id: 1,
//         name: 'Gold Necklace',
//         image: 'https://www.shutterstock.com/shutterstock/photos/2256160991/display_1500/stock-photo-gold-pendant-with-blue-crystals-on-a-thin-chain-on-a-white-background-2256160991.jpg', // Placeholder for gold jewelry image
//         weight: '20g',
//     },
//     {
//         id: 2,
//         name: 'Gold Ring',
//         image: 'https://www.shutterstock.com/shutterstock/photos/2198896509/display_1500/stock-photo-diamond-ring-yellow-gold-isolated-on-white-engagement-solitaire-style-ring-2198896509.jpg', // Placeholder for gold jewelry image
//         weight: '5g',
//     },
//     {
//         id: 3,
//         name: 'Gold Bracelet',
//         image: 'https://www.shutterstock.com/shutterstock/photos/1926931343/display_1500/stock-photo-gold-bangle-on-white-background-1926931343.jpg', // Placeholder for gold jewelry image
//         weight: '15g',
//     },
//     // Add more products as needed
// ];

// // Current date
// const today = 'September 10, 2025';

// const CheckInventory = () => {
//     const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

//     const handleCalculatePrice = (product: Product) => {
//         // Placeholder for price calculation logic
//         // In a real app, this could fetch current gold price and compute weight * price per gram
//         alert(`Calculating price for ${product.name} (${product.weight})...`);
//     };

//     return (
//         <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
//             <Typography variant="h5" gutterBottom>
//                 Today's Date: {today}
//             </Typography>
//             <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
//                 <Tooltip title="Card View">
//                     <IconButton onClick={() => setViewMode('card')} color={viewMode === 'card' ? 'primary' : 'default'}>
//                         <ViewModuleIcon />
//                     </IconButton>
//                 </Tooltip>
//                 <Tooltip title="Table View">
//                     <IconButton onClick={() => setViewMode('table')} color={viewMode === 'table' ? 'primary' : 'default'}>
//                         <ViewListIcon />
//                     </IconButton>
//                 </Tooltip>
//             </Grid>

//             {viewMode === 'card' ? (
//                 <Grid container spacing={3}>
//                     {products.map((product) => (
//                         <Grid size={{ xs: 12, sm: 6, md: 4, }} key={product.id}>
//                             <Card>
//                                 <CardMedia
//                                     component="img"
//                                     height="140"
//                                     image={product.image}
//                                     alt={product.name}
//                                 />
//                                 <CardContent>
//                                     <Typography variant="h6">{product.name}</Typography>
//                                     <Typography variant="body2" color="text.secondary">
//                                         Weight: {product.weight}
//                                     </Typography>
//                                 </CardContent>
//                                 <CardActions>
//                                     <Button size="small" variant="contained" onClick={() => handleCalculatePrice(product)}>
//                                         Calculate Price
//                                     </Button>
//                                 </CardActions>
//                             </Card>
//                         </Grid>
//                     ))}
//                 </Grid>
//             ) : (
//                 <TableContainer>
//                     <Table>
//                         <TableHead>
//                             <TableRow sx={{ textAlign: "center" }}>
//                                 <TableCell>Preview</TableCell>
//                                 <TableCell>Name</TableCell>
//                                 <TableCell>Weight</TableCell>
//                                 <TableCell>Action</TableCell>
//                             </TableRow>
//                         </TableHead>
//                         <TableBody>
//                             {products.map((product) => (
//                                 <TableRow key={product.id} sx={{ textAlign: "center" }}>
//                                     <TableCell>
//                                         <img src={product.image} alt={product.name} style={{ width: 50, height: 50 }} />
//                                     </TableCell>
//                                     <TableCell>{product.name}</TableCell>
//                                     <TableCell>{product.weight}</TableCell>
//                                     <TableCell>
//                                         <Button size="small" variant="contained" onClick={() => handleCalculatePrice(product)}>
//                                             Online Price
//                                         </Button>
//                                     </TableCell>
//                                 </TableRow>
//                             ))}
//                         </TableBody>
//                     </Table>
//                 </TableContainer>
//             )}
//         </Paper>
//     );
// };

// export default CheckInventory;