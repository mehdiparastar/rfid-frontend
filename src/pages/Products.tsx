import { ArrowDownward, ArrowUpward, Delete, Edit, Search } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardActions, CardContent, CardMedia, Checkbox, Chip, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Snackbar, Stack, TextField, Tooltip, Typography, useTheme, type SelectChangeEvent } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoldCurrency } from "../api/goldCurrency";
import { useDeleteProduct, useProducts } from "../api/products";
import PhotoLightbox from "../components/PhotoLightbox";
import { useSocketStore } from "../store/socketStore";
import { GOLD_PRODUCT_SUB_TYPES } from "../store/useProductFormStore";
import { getIRRCurrency } from "../utils/getIRRCurrency";
import { translate } from "../utils/translate";
import type { Product } from "../lib/api";
import { ErrorSnack } from "../components/ErrorSnack";
import ProductRegistration from "./ScanMode/components/ProductRegistration";

export default function Products() {
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!
    const isConnected = useSocketStore((s) => s.isConnected);

    const navigate = useNavigate();

    const [limit,/* setLimit*/] = useState(20); // number of products per page
    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");
    const [filters, setFilters] = useState({ q: "" }); // for search filter
    const [/*cursor*/, setCursor] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([])
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, isError: fetchingIsError, error: fetchingError } = useProducts({
        limit,
        sorting: [{ id: sortField, desc: sortDirection === "desc" }],
        filters,
    })
    const { mutateAsync: deleteProductMutateAsync, error: deleteProductError, isError: deleteProductIsError } = useDeleteProduct()

    const products = data?.pages.flatMap(p => p.items) ?? []

    const { data: spotPrice, /*isLoading: spotPriceIsLoading,*/ error: spotPriceError, isError: spotPriceIsError } = useGoldCurrency();

    const confirmDelete = async () => {
        if (productToDelete)
            await deleteProductMutateAsync(productToDelete.id)
        setProductToDelete(null);
    };

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
        navigate(`/issue-invoice?${new URLSearchParams({ ids: selectedProducts.join(",") }).toString()}`, {
            state: {
                snapshot: products.filter(it => selectedProducts.includes(it.id))
            }
        })
    }

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



    if (status === 'pending' && products.length === 0)
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
            <Container maxWidth="lg" sx={{ px: 1, mb: 2 }}>
                {/* Filters Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 1 }}>
                    <TextField
                        label="Search Products"
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
                                label="Sort By"
                                size="small"
                                sx={{ width: 125 }}
                            >
                                <MenuItem value="createdAt">{t["Created At"]}</MenuItem>
                                <MenuItem value="name">{t["Name"]}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2, pt: 1 }}>
                    <Typography variant="button" sx={{ borderBottom: '2px solid black' }}>
                        {t["All"]}: {data?.pages[0].total}
                    </Typography>
                    {selectedProducts.length > 0 && <Typography variant="caption">{selectedProducts.length}{t["product(s) selected."]}</Typography>}
                    <Button variant="contained" sx={{ width: 125 }} disabled={selectedProducts.length === 0} onClick={handleInvoiceInquiry}>{t["INVOICE"]}</Button>
                </Box>

                {/* Product Grid */}
                <Grid container spacing={2}>
                    {
                        products.map((product) => {
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
                                                <Chip label={t[product.type]} />
                                                <Checkbox disabled={product.quantity - soldQuantity === 0} checked={selectedProducts.includes(product.id)} onClick={() => setSelectedProducts(p => p.includes(product.id) ? p.filter(el => el !== product.id) : [...p, product.id])} />
                                            </Box>
                                            <Divider sx={{ mx: -2, mb: 1 }} variant="fullWidth" />
                                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="textSecondary" fontWeight={'bold'} fontFamily={"IRANSans, sans-serifRoboto, Arial, sans-serif"}>
                                                    {t["Unit Price:"]} {getIRRCurrency(Math.round(product.weight * productSpotPrice * (1 + product.profit / 100 + product.makingCharge / 100 + product.vat / 100)))}
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
                                                {t["Unit Weight:"]} {product.weight}{t["g"]}
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

            <PhotoLightbox
                photos={lightboxPhotos}
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />

            {/* Edit confirm dialog */}
            <Dialog maxWidth="md" fullWidth open={!!productToEdit} onClose={() => setProductToEdit(null)}>
                <DialogTitle>{t["edit"]} {productToEdit?.name}</DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                    {productToEdit && <ProductRegistration setProductToEdit={setProductToEdit} mode={"Edit"} toEditData={productToEdit as any} />}
                </DialogContent>
            </Dialog>


            {/* Delete confirm dialog */}
            <Dialog maxWidth="md" fullWidth open={!!productToDelete} onClose={() => setProductToDelete(null)}>
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
        </>
    )
}
