import { ArrowDownward, ArrowUpward, Search } from "@mui/icons-material";
import { Alert, Box, Button, Chip, CircularProgress, Container, Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Snackbar, Stack, TextField, Tooltip, Typography, useTheme, type SelectChangeEvent } from "@mui/material";
import { useEffect, useState } from "react";
import { useCustomers } from "../api/customers";
import { useSocketStore } from "../store/socketStore";
import { translate } from "../utils/translate";

export default function Customers() {
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!
    const isConnected = useSocketStore((s) => s.isConnected);

    const [limit,/* setLimit*/] = useState(20); // number of customers per page
    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");
    const [filters, setFilters] = useState({ q: "" }); // for search filter
    const [/*cursor*/, setCursor] = useState(null);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, isError: fetchingIsError, error: fetchingError } = useCustomers({
        limit,
        sorting: [{ id: sortField, desc: sortDirection === "desc" }],
        filters,
    })

    const customers = data?.pages.flatMap(p => p.items) ?? []

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

    useEffect(() => {
        // Reset the cursor when filters or sorting change
        setCursor(null);
    }, [filters, sortField, sortDirection]);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, []);


    if (status === 'pending' && customers.length === 0)
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
                    <Alert sx={{ borderRadius: 0 }} severity="error">{"Something went wrong. "}{fetchingError.message}</Alert>
                </Box>
            </>
        )


    return (
        <>
            <Box sx={{ width: 1, bgcolor: isConnected ? 'green' : 'red', height: 5 }} />
            {/* controls you wire to setSorting / setFilters */}
            <Container maxWidth="xl" sx={{ width: 1, px: 1, mb: 2 }}>
                {/* Filters Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 1 }}>
                    <TextField
                        label={t["Search Customers"]}
                        variant="outlined"
                        value={filters.q}
                        onChange={handleSearchChange}
                        sx={{ width: { xs: 1, md: 1 }, mr: 2 }}
                        slotProps={{ input: { endAdornment: <Search /> } }}
                        size="small"
                    />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Sort direction */}
                        <Tooltip title={sortDirection === 'asc' ? t['Ascending'] : t['Descending']}>
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
                                label="Sort By"
                                size="small"
                                sx={{ width: 125 }}
                            >
                                <MenuItem value="createdAt">{t["Created At"]}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2, pt: 1 }}>
                    <Typography variant="button" sx={{ borderBottom: '2px solid black' }}>
                        {t["All"]}: {data?.pages[0].total}
                    </Typography>
                </Box>

                {/* Customer Grid */}
                <Grid container spacing={2}>
                    {
                        customers.map((customer) => {
                            return (
                                <Grid key={customer.id}>
                                    <Chip
                                        size="medium"
                                        sx={{
                                            width: 1,
                                            height: 1,
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
                                        label={
                                            <Stack direction={'column'} p={1}>
                                                <Typography variant="h5" fontWeight={"bold"}>{customer.name.toUpperCase()}</Typography>
                                                <Divider variant="fullWidth" sx={{ my: 1, mx: -3 }} />
                                                <Typography variant="h6">📞 {customer.phone.toUpperCase()}</Typography>
                                                <Divider variant="fullWidth" sx={{ my: 1, mx: -3 }} />
                                                <Typography variant="h6">🆔 {customer.nid.toUpperCase()}</Typography>
                                            </Stack>
                                        }
                                    />
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
            </Container>
        </>
    )
}








// import {
//     ArrowDownward, ArrowUpward, Search
// } from "@mui/icons-material";
// import {
//     Alert, Box, Button, Card, CardActionArea, CardContent,
//     CircularProgress, Container, FormControl, Grid, IconButton,
//     InputAdornment, InputLabel, MenuItem, Select, Snackbar, Stack,
//     TextField, Tooltip, Typography, useTheme
// } from "@mui/material";
// import { useEffect, useState } from "react";
// import { useCustomers } from "../api/customers";
// import { useSocketStore } from "../store/socketStore";
// import { translate } from "../utils/translate";

// export default function Customers() {
//     const theme = useTheme()
//     const ln = theme.direction === "ltr" ? "en" : "fa"
//     const t = translate(ln)!
//     const isConnected = useSocketStore((s) => s.isConnected);

//     const [limit] = useState(20);
//     const [sortField, setSortField] = useState("createdAt");
//     const [sortDirection, setSortDirection] = useState("desc");
//     const [filters, setFilters] = useState({ q: "" });
//     const [, setCursor] = useState(null);

//     const { data, fetchNextPage, hasNextPage,
//         isFetchingNextPage, status, isError,
//         error } = useCustomers({
//             limit,
//             sorting: [{ id: sortField, desc: sortDirection === "desc" }],
//             filters,
//         });

//     const customers = data?.pages.flatMap(p => p.items) ?? [];

//     const handleLoadMore = () => hasNextPage && fetchNextPage();

//     const handleSortDirectionChange = () =>
//         setSortDirection(prev => prev === "asc" ? "desc" : "asc");

//     const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setFilters({ ...filters, q: e.target.value });

//     useEffect(() => setCursor(null), [filters, sortField, sortDirection]);

//     // Scroll to top on mount
//     useEffect(() => {
//         window.scrollTo({ top: 0, behavior: "smooth" });
//     }, []);

//     if (status === "pending" && customers.length === 0)
//         return (
//             <>
//                 <Box sx={{ width: 1, bgcolor: isConnected ? "green" : "red", height: 5 }} />
//                 <Box sx={{ p: 3, display: "grid", placeItems: "center" }}>
//                     <CircularProgress />
//                 </Box>
//             </>
//         );

//     if (status === "error")
//         return (
//             <>
//                 <Box sx={{ width: 1, bgcolor: isConnected ? "green" : "red", height: 5 }} />
//                 <Box sx={{ p: 3 }}>
//                     <Alert severity="error" sx={{ borderRadius: 0 }}>
//                         Something went wrong: {error.message}
//                     </Alert>
//                 </Box>
//             </>
//         );

//     return (
//         <>
//             <Box sx={{ width: 1, bgcolor: isConnected ? "green" : "red", height: 5 }} />

//             <Container maxWidth="xl" sx={{ width: 1, px: 1, mb: 4 }}>

//                 {/* --------------------- FILTER BAR --------------------- */}
//                 <Box
//                     sx={{
//                         mt: 2,
//                         mb: 2,
//                         p: 2,
//                         borderRadius: 3,
//                         bgcolor: "background.paper",
//                         boxShadow: 2,
//                         display: "flex",
//                         flexWrap: "wrap",
//                         gap: 2,
//                         alignItems: "center",
//                         justifyContent: "space-between"
//                     }}
//                 >
//                     <TextField
//                         label={t["Search Customers"]}
//                         value={filters.q}
//                         onChange={handleSearchChange}
//                         size="small"
//                         sx={{ width: { xs: "100%", md: "280px" } }}
//                         slotProps={{
//                             input: {
//                                 endAdornment: <InputAdornment position="end">
//                                     <Search />
//                                 </InputAdornment>
//                             }
//                         }}
//                     />

//                     <Stack direction="row" spacing={2} alignItems="center">
//                         <Tooltip title={sortDirection === 'asc' ? t["Ascending"] : t["Descending"]}>
//                             <IconButton
//                                 onClick={handleSortDirectionChange}
//                                 sx={{
//                                     border: "1px solid",
//                                     borderColor: "divider",
//                                     borderRadius: 2
//                                 }}
//                             >
//                                 {sortDirection === "asc" ? <ArrowUpward /> : <ArrowDownward />}
//                             </IconButton>
//                         </Tooltip>

//                         <FormControl size="small" sx={{ minWidth: 150 }}>
//                             <InputLabel>{t["Sort By"]}</InputLabel>
//                             <Select
//                                 value={sortField}
//                                 onChange={e => setSortField(e.target.value)}
//                                 label={t["Sort By"]}
//                             >
//                                 <MenuItem value="createdAt">{t["Created At"]}</MenuItem>
//                             </Select>
//                         </FormControl>
//                     </Stack>
//                 </Box>

//                 {/* --------------------- COUNTER --------------------- */}
//                 <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
//                     {t["All"]}: {data?.pages[0].total}
//                 </Typography>

//                 {/* --------------------- CUSTOMER CARDS --------------------- */}
//                 <Grid container spacing={2}>
//                     {customers.map(customer => (
//                         <Grid key={customer.id} size={{ xs: 12, sm: 6, md: 4, lg: 3, }}>
//                             <Card
//                                 elevation={3}
//                                 sx={{
//                                     borderRadius: 3,
//                                     transition: "0.25s",
//                                     "&:hover": {
//                                         transform: "translateY(-5px)",
//                                         boxShadow: 8,
//                                     }
//                                 }}
//                             >
//                                 <CardActionArea>
//                                     <CardContent sx={{ p: 2 }}>
//                                         <Typography variant="h6" fontWeight={700}>
//                                             {customer.name}
//                                         </Typography>

//                                         <Typography variant="body2" sx={{ opacity: 0.8 }}>
//                                             📞 {customer.phone}
//                                         </Typography>

//                                         <Typography variant="body2" sx={{ opacity: 0.7 }}>
//                                             🆔 {customer.nid}
//                                         </Typography>
//                                     </CardContent>
//                                 </CardActionArea>
//                             </Card>
//                         </Grid>
//                     ))}

//                     {isFetchingNextPage && (
//                         <Grid size={{ xs: 12 }} display="flex" justifyContent="center">
//                             <CircularProgress />
//                         </Grid>
//                     )}
//                 </Grid>

//                 {/* --------------------- LOAD MORE --------------------- */}
//                 {hasNextPage && !isFetchingNextPage && (
//                     <Button
//                         fullWidth
//                         onClick={handleLoadMore}
//                         variant="contained"
//                         sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
//                     >
//                         {t["Load More"]}
//                     </Button>
//                 )}

//                 {/* --------------------- ERROR SNACKBAR --------------------- */}
//                 {isError && (
//                     <Snackbar open={true} autoHideDuration={6000}>
//                         <Alert severity="error">
//                             {t["Something went wrong."]}
//                         </Alert>
//                     </Snackbar>
//                 )}
//             </Container>
//         </>
//     );
// }

