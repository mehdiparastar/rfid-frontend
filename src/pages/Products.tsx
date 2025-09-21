import { ArrowDownward, ArrowUpward, Search } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardActions, CardContent, CardMedia, CircularProgress, Container, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Snackbar, TextField, Tooltip, Typography, type SelectChangeEvent } from "@mui/material";
import { useEffect, useState } from "react";
import { useProducts } from "../api/products";
import PhotoLightbox from "../components/PhotoLightbox";
import { useSocketStore } from "../store/socketStore";
import { getIRRCurrency } from "../utils/getIRRCurrency";
import { useNavigate } from "react-router-dom";
import type { Product } from "../lib/api";

const basePrice = 92700000;

export default function Products() {
    const isConnected = useSocketStore((s) => s.isConnected);

    const navigate = useNavigate();

    const [limit, setLimit] = useState(20); // number of products per page
    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");
    const [filters, setFilters] = useState({ q: "" }); // for search filter
    const [cursor, setCursor] = useState(null);

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, isError, error } = useProducts({
        limit,
        sorting: [{ id: sortField, desc: sortDirection === "desc" }],
        filters,
    })


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

    const handleSellClick = (product: Product) => {
        navigate(`/issue-invoice/${product.id}`, {
            state: {
                snapshot: product
            }
        })
    }



    useEffect(() => {
        // Reset the cursor when filters or sorting change
        setCursor(null);
    }, [filters, sortField, sortDirection]);



    const items = data?.pages.flatMap(p => p.items) ?? []

    if (status === 'pending' && items.length === 0)
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
                    <Alert severity="error">{"Something went wrong. "}{error.message}</Alert>
                </Box>
            </>
        )

    return (
        <>
            <Box sx={{ width: 1, bgcolor: isConnected ? 'green' : 'red', height: 5 }} />
            {/* controls you wire to setSorting / setFilters */}
            <Container maxWidth="lg" sx={{ px: 1 }}>
                {/* Filters Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 1 }}>
                    <TextField
                        label="Search Products"
                        variant="outlined"
                        value={filters.q}
                        onChange={handleSearchChange}
                        sx={{ width: { xs: 1, md: 1 } }}
                        slotProps={{ input: { endAdornment: <Search /> } }}
                        size="small"
                    />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Sort by dropdown */}
                        <FormControl>
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={sortField}
                                onChange={handleSortChange}
                                label="Sort By"
                                size="small"
                                sx={{ width: 125 }}
                            >
                                <MenuItem value="createdAt">Created At</MenuItem>
                                <MenuItem value="name">Name</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Sort direction */}
                        <Tooltip title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}>
                            <IconButton onClick={handleSortDirectionChange} size="small">
                                {sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1, mb: 2, pt: 0.5 }}>
                    <Typography variant="caption" sx={{ borderBottom: '2px solid black' }}>
                        All: {data?.pages[0].total}
                    </Typography>
                </Box>

                {/* Product Grid */}
                <Grid container spacing={2}>
                    {data?.pages.flatMap((page) =>
                        page.items.map((product) => (
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
                                    <CardContent>
                                        <Typography variant="h6">{product.name}</Typography>
                                        <Typography variant="body2" color="textSecondary" fontWeight={'bold'} fontFamily={"IRANSans, sans-serifRoboto, Arial, sans-serif"}>
                                            Price: {getIRRCurrency(Math.round(product.weight * basePrice * (1 + product.profit / 100 + product.makingCharge / 100 + product.vat / 100)))}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Quantity: {product.quantity}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Weight: {product.weight}g
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Making Charge: {product.makingCharge}%
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Sold Quantity: {product.sales?.reduce((p, c) => p + c.quantity, 0)}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Created By: {product.createdBy?.email}
                                        </Typography>

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
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            onClick={() => handleSellClick(product)}
                                            disabled={product.quantity === 0}
                                        >
                                            {product.quantity !== 0 ? "Sale" : "Out of stock"}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))
                    )}

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
                        Load More
                    </Button>
                )}

                {/* Error Message */}
                {isError && (
                    <Snackbar open={true} autoHideDuration={6000}>
                        <Alert severity="error">{(error as Error)?.message || "Something went wrong"}</Alert>
                    </Snackbar>
                )}
            </Container >

            <PhotoLightbox
                photos={lightboxPhotos}
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </>
    )
}
