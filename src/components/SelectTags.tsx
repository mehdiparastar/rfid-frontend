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
    Button,
    Card,
    CardContent,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
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
import { clearScenarioHistory, useCurrentScenario, useScanResults, useStartScenario, useStopScenario } from '../api/jrdDevices';
import type { Tag } from '../api/products';
import { useScanResultsLive } from '../features/useScanResultsLive';
import ModuleSettings, { DialogTransition } from '../pages/ScanMode/components/ModuleSettings';
import { translate } from '../utils/translate';


interface SelectTagsProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (selected: Tag[]) => void;
    selectedTags: Tag[];
}

const SelectTags: React.FC<SelectTagsProps> = ({ selectedTags, open, onClose, onConfirm }) => {
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)! as any

    const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(30);
    const [sortBy, setSortBy] = useState<'epc' | 'latest'>('latest');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [openSettings, setOpenSettings] = React.useState(false);
    const [selectedRows, setSelectedRows] = useState<Tag[]>(selectedTags); // Track the selected row

    const fullScreenSettingsDialog = useMediaQuery(theme.breakpoints.down('sm'));

    const { data: scenarioState } = useCurrentScenario()
    const { mutateAsync: clearScenarioHistoryMutateAsync } = clearScenarioHistory()
    const { mutateAsync: stopScenarioMutateAsync } = useStopScenario()
    const { mutateAsync: startScenarioMutateAsync } = useStartScenario()
    const { data: scanResults = { NewProduct: [] } } = useScanResults("NewProduct");

    useScanResultsLive("NewProduct", 5000, true);

    const newProductCurrentScenario = scenarioState?.filter(el => el.state.isActive && el.state.mode === "NewProduct")

    const tags = (scanResults.NewProduct || [])
        .reduce((acc: Tag[], current) => {
            // Check if the epc value is already in the accumulator
            if (!acc.some(item => item.epc === current.epc)) {
                acc.push(current); // Add the item if unique
            }
            return acc;
        }, []);

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
        await startScenarioMutateAsync({ mode: "NewProduct", ids: (newProductCurrentScenario || [])?.map(el => el.id) })
    }

    const handleStopScenario = async () => {
        await stopScenarioMutateAsync({ mode: "NewProduct" })
    }

    const handleClearScenarioHistory = async () => {
        await clearScenarioHistoryMutateAsync({ mode: "NewProduct" })
    }

    const handleRowClick = (tag: Tag) => {
        const currentIndex = selectedRows.findIndex(el => el.epc === tag.epc);
        const newSelectedRows = [...selectedRows];

        if (currentIndex === -1) {
            newSelectedRows.push(tag); // Select the row if not already selected
        } else {
            newSelectedRows.splice(currentIndex, 1); // Deselect the row if already selected
        }

        setSelectedRows([...new Map(newSelectedRows.map(item => [item.epc, item])).values()]);
    };


    const sortedTags = useMemo(() => {
        const sorted = [...(tags || [])];
        sorted.sort((a, b) => {
            if (sortBy === 'epc' && !!a.epc && !!b.epc) {
                return sortOrder === 'asc'
                    ? a.epc.localeCompare(b.epc)
                    : b.epc.localeCompare(a.epc);
            }
            else if (sortBy === 'latest') {
                const scantimestampA = a.scantimestamp;
                const scantimestampB = b.scantimestamp;
                return sortOrder === 'asc' ? scantimestampA - scantimestampB : scantimestampB - scantimestampA;
            } else {
                return 0
            }
        });
        return sorted;
    }, [sortBy, sortOrder, tags]);

    // Handle checkbox toggle
    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>, tag: Tag) => {
        if (event.target.checked) {
            setSelectedRows((prev) => [...prev, tag]);
        } else {
            setSelectedRows((prev) => prev.filter((rowId) => rowId.epc !== tag.epc));
        }
    };

    const paginatedTags = sortedTags.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Handle select all checkbox
    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(paginatedTags);
        } else {
            setSelectedRows([]);
        }
    };


    // Check if all rows are selected
    const isAllSelected = selectedRows.length === paginatedTags.length;

    const handleConfirm = () => {
        onConfirm(selectedRows);
        handleStopScenario()
        onClose();
    };

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

    return (
        <Dialog
            open={open}
            onClose={() => {
                onClose()
                handleStopScenario()
            }}
            maxWidth="xl"
            fullWidth
            fullScreen={fullScreenSettingsDialog}
            slots={{
                transition: DialogTransition,
            }}
        >
            <DialogTitle>{t["Select RFID Tags"]}</DialogTitle>
            <DialogContent sx={{ px: 1 }}>
                <Box sx={{ pt: 1, pb: 4, px: 1, width: 1, mx: 'auto' }}>
                    <Stack width={1} spacing={0} direction={{ xs: 'column', sm: 'row' }}>
                        <Alert
                            icon={false}
                            id='alert'
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
                                    display: 'inline-block',
                                    color: 'warning.main',
                                }}
                            >
                                {t["Scanning IDs"]}
                            </Typography>
                            <Typography variant='caption'>{newProductCurrentScenario?.map(el => el.id).join("-")}</Typography>
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
                                <Stack gap={0.5} direction={'row'} alignItems={'center'} display={'flex'} >
                                    <ToggleButtonGroup disabled={(newProductCurrentScenario || []).length === 0} value={(newProductCurrentScenario || []).filter(el => el.state.isScan).length > 0 ? 'started' : 'stopped'}>
                                        <ToggleButton value={'started'} onClick={handleStartScenario} title='start'><PlayArrow /></ToggleButton>
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
                                <ToggleButton value="epc" aria-label="sort by epc">
                                    <Tooltip title="Sort by EPC">
                                        <Typography>{t["EPC"]}</Typography>
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
                                {paginatedTags.map((tag) => (
                                    <Grid
                                        size={{
                                            xs: 12,
                                            sm: 6,
                                            md: 4,
                                        }}
                                        key={tag.epc}
                                        component="div"
                                    >
                                        <Card sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }}>
                                            <CardContent sx={{ px: 1 }}>
                                                <Box sx={{ overflow: 'auto', alignItems: 'center', justifyContent: 'flex-start', flexDirection: 'row', display: 'flex' }}>
                                                    <Checkbox
                                                        checked={selectedRows.map(el => el.epc).includes(tag.epc)}
                                                        onChange={(e) => handleCheckboxChange(e, tag)}
                                                        slotProps={{
                                                            input: {
                                                                'aria-labelledby': `checkbox-${tag.epc}`,
                                                            }
                                                        }}
                                                    />
                                                    <Typography fontWeight={'bold'} variant="body1" align="center">{tag.epc}</Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                            <TablePagination
                                rowsPerPageOptions={[30, 60, 90]}
                                component="div"
                                count={(tags || []).length}
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
                            <TableContainer sx={{ borderRadius: 0, border: 1, maxHeight: 400, overflow: 'auto' }}>
                                <Table>
                                    <TableHead >
                                        <TableRow sx={theme => ({ bgcolor: theme.palette.mode === "light" ? theme.alpha("#c57213ff", .5) : theme.alpha("#AA6F2A", .6) })}>
                                            <TableCell
                                                padding="checkbox"
                                                sx={{
                                                    bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                                    fontWeight: 'bold',
                                                    borderBottom: '2px solid #8b6508',
                                                }}
                                            >
                                                <Checkbox
                                                    checked={isAllSelected}
                                                    onChange={handleSelectAllClick}
                                                    slotProps={{
                                                        input: {
                                                            'aria-label': 'select all products',
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    bgcolor: 'linear-gradient(45deg, #8b6508, #a67c00)',
                                                    fontWeight: 'bold',
                                                    borderBottom: '2px solid #8b6508',
                                                }}
                                            >
                                                {t["EPC"]}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedTags.map((tag) => (
                                            <TableRow
                                                hover
                                                key={tag.epc}
                                                onClick={() => handleRowClick(tag)} // Handle row click
                                                sx={{
                                                    backgroundColor:
                                                        selectedRows.map(el => el.epc).includes(tag.epc) ? 'rgba(0, 123, 255, 0.1)' : 'transparent', // Highlight selected row
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedRows.map(el => el.epc).includes(tag.epc)}
                                                        onChange={(e) => handleCheckboxChange(e, tag)}
                                                        slotProps={{
                                                            input: {
                                                                'aria-labelledby': `checkbox-${tag.epc}`,
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">{tag.epc}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[30, 60, 90]}
                                component="div"
                                count={(tags || []).length}
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

                    <ModuleSettings openSettings={openSettings} setOpenSettings={setOpenSettings} fullScreenSettingsDialog={fullScreenSettingsDialog} scanMode='NewProduct' />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose()
                        handleStopScenario()
                    }}
                >
                    {t["Cancel"]}
                </Button>
                <Button onClick={handleConfirm}>{t["Confirm"]}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SelectTags;