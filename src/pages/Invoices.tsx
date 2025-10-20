import { ArrowDownward, ArrowUpward, Search } from "@mui/icons-material";
import { Alert, Avatar, Box, Button, Card, CardContent, CardHeader, Chip, CircularProgress, Container, FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Radio, Select, Snackbar, Stack, TextField, Tooltip, Typography, useTheme, type SelectChangeEvent } from "@mui/material";
import { red } from "@mui/material/colors";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalali';
import { faIR } from 'date-fns-jalali/locale/fa-IR';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "../api/invoices";
import { useSocketStore } from "../store/socketStore";
import { getIRRCurrency } from "../utils/getIRRCurrency";
import { translate } from "../utils/translate";

export default function Invoices() {
    const isConnected = useSocketStore((s) => s.isConnected);
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)! as any
    const navigate = useNavigate();

    const [limit, /*setLimit*/] = useState(10); // number of invoices per page
    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");
    const [filters, setFilters] = useState({ q: "" }); // for search filter
    const [/*cursor*/, setCursor] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null)

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, isError: fetchingIsError, error: fetchingError } = useInvoices({
        limit,
        sorting: [{ id: sortField, desc: sortDirection === "desc" }],
        filters,
    })

    const invoices = data?.pages.flatMap(p => p.items) ?? []


    const handleLoadMore = () => {
        if (hasNextPage) {
            fetchNextPage();
        }
    };

    const handleSortChange = (event: SelectChangeEvent<string>) => {
        setSortField(event.target.value as string);
    };

    const handleSortDirectionChange = () => {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({ ...filters, q: event.target.value });
    };


    const handleInvoiceInquiry = () => {
        if (selectedInvoice)
            navigate(`/invoice-detail?${new URLSearchParams({ ids: [selectedInvoice].join(',') }).toString()}`, {
                state: {
                    snapshot: invoices.filter(it => selectedInvoice == it.id)
                }
            })
    }

    useEffect(() => {
        // Reset the cursor when filters or sorting change
        setCursor(null);
    }, [filters, sortField, sortDirection]);



    if (status === 'pending' && invoices.length === 0)
        return (
            <>
                <Box sx={{ width: 1, bgcolor: isConnected ? 'green' : 'red', height: 5 }} />
                <Box sx={{ p: 3, display: "grid", placeItems: "center" }}>
                    <CircularProgress />
                </Box>
            </>
        )
    if (status === 'error')
        return (
            <>
                <Box sx={{ width: 1, bgcolor: isConnected ? 'green' : 'red', height: 5 }} />
                <Box sx={{ p: 3 }}>
                    <Alert sx={{ borderRadius: 0 }} severity="error">{t["Something went wrong."]}{fetchingError.message}</Alert>
                </Box>
            </>
        )


    return (
        <>
            <Box sx={{ width: 1, bgcolor: isConnected ? 'green' : 'red', height: 5 }} />
            {/* controls you wire to setSorting / setFilters */}
            <Container maxWidth="lg" sx={{ px: 1, mb: 2 }}>
                {/* Filters Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 1 }}>
                    <TextField
                        label={t["Search Invoices"]}
                        variant="outlined"
                        value={filters.q}
                        onChange={handleSearchChange}
                        sx={{ width: { xs: 1, md: 1 }, mr: 2 }}
                        slotProps={{ input: { endAdornment: <Search /> } }}
                        size="small"
                    />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Sort direction */}
                        <Tooltip title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}>
                            <IconButton onClick={handleSortDirectionChange} size="small">
                                {sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
                            </IconButton>
                        </Tooltip>
                        {/* Sort by dropdown */}
                        <FormControl>
                            <InputLabel>{t["Sort By"]}</InputLabel>
                            <Select
                                value={sortField}
                                onChange={handleSortChange}
                                label={t["Sort By"]}
                                size="small"
                                sx={{ width: 125 }}
                            >
                                <MenuItem value="createdAt">{t["Created At"]}</MenuItem>
                                <MenuItem value="customer.name">{t["Customer Name"]}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2, pt: 1 }}>
                    <Typography variant="button" sx={{ borderBottom: '2px solid black' }}>
                        {t["All:"]} {data?.pages[0].total}
                    </Typography>
                    <Button variant="contained" sx={{ width: 125 }} disabled={!selectedInvoice} onClick={handleInvoiceInquiry}>{t["Detail"]}</Button>
                </Box>

                {/* Invoice Grid */}
                <Grid container spacing={2}>
                    {
                        invoices.map((invoice, i) => {

                            return (
                                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
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
                                        <CardHeader
                                            avatar={
                                                <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
                                                    {invoice.id}
                                                </Avatar>
                                            }
                                            action={
                                                <Radio checked={selectedInvoice === invoice.id} onClick={() => setSelectedInvoice(invoice.id)} />
                                            }
                                            title={invoice.customer.name.toUpperCase()}
                                            subheader={invoice.customer.phone}
                                        />
                                        <CardContent sx={{ py: 0.5 }}>
                                            <Stack direction={'column'} gap={2}>
                                                <LocalizationProvider dateAdapter={AdapterDateFnsJalali} adapterLocale={faIR}>
                                                    <DatePicker
                                                        name="date"
                                                        label=""
                                                        value={new Date(invoice.createdAt!)}
                                                        onChange={() => { }}
                                                        format="yyyy/MM/dd HH:mm"                    // Jalali formatting via adapter                                                
                                                        slotProps={{
                                                            textField: {
                                                                variant: 'standard',
                                                                fullWidth: true,
                                                                sx: {
                                                                    // default state
                                                                    '& .MuiPickersFilledInput-root:before': {
                                                                        borderBottomColor: theme.palette.mode === 'dark' ? 'white' : 'gray',
                                                                    },
                                                                    // hover (not disabled)
                                                                    '& .MuiPickersFilledInput-root:hover:not(.Mui-disabled):before': {
                                                                        borderBottomColor: 'whitesmoke',
                                                                    },
                                                                    // focused
                                                                    '& .MuiPickersFilledInput-root:after': {
                                                                        borderBottomColor: 'wheat',
                                                                    },
                                                                },
                                                                slotProps: {
                                                                    input: {
                                                                        sx: {
                                                                            '& .MuiPickersSectionList-root': { color: theme.palette.mode === 'dark' ? 'wheat' : 'orange', fontSize: 14 },
                                                                        },
                                                                        startAdornment: (
                                                                            <InputAdornment position="start">
                                                                                <Typography pb={0.25} fontSize={14} variant="body2">
                                                                                    {t["Date:"]}
                                                                                </Typography>
                                                                            </InputAdornment>
                                                                        )
                                                                    },
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </LocalizationProvider>
                                                {/* <Divider sx={{ mx: -2, my: 1 }} variant="fullWidth" /> */}
                                                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    {t["Items:"]}
                                                    <Chip
                                                        label={invoice.items.length}
                                                        sx={{ borderRadius: 1 }}
                                                    />
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    {t["Total:"]}
                                                    <Chip
                                                        label={getIRRCurrency(invoice.items.reduce((p, c) => Number(p) + Number(c.soldPrice), 0))}
                                                        sx={{ borderRadius: 1 }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" color="textSecondary">
                                                    {t["Pay Type:"]} <b>{t[invoice.payType]}</b>
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )
                        })
                    }

                    {/* Loading Spinner */}
                    {isFetchingNextPage && (
                        <Grid size={{ xs: 12 }} display="flex" justifyContent="center">
                            <CircularProgress />
                        </Grid>
                    )}
                </Grid>

                {/* Pagination: Load More Button */}
                {hasNextPage && !isFetchingNextPage && (
                    <Button
                        fullWidth
                        onClick={handleLoadMore}
                        variant="outlined"
                        sx={{ marginTop: 2 }}
                    >
                        {t["Load More"]}
                    </Button>
                )}

                {/* Error Message */}
                {fetchingIsError && (
                    <Snackbar open={true} autoHideDuration={6000}>
                        <Alert severity="error">{JSON.parse((fetchingError as Error)?.message).message || t["Something went wrong."]}</Alert>
                    </Snackbar>
                )}
            </Container >
        </>
    )
}
