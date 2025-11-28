import { ArrowDownward, ArrowUpward, Cancel, Check, ViewWeek as ColumnIcon, Delete, Edit, ExpandMore, ViewStream as ModuleIcon, Search, Tune } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardActions, CardContent, CardMedia, Checkbox, Chip, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Slider, Snackbar, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, useTheme, type SelectChangeEvent } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoldCurrency } from "../api/goldCurrency";
import { useDeleteProduct, useProducts } from "../api/products";
import { ErrorSnack } from "../components/ErrorSnack";
import PhotoLightbox from "../components/PhotoLightbox";
import type { Product } from "../lib/api";
import { useSocketStore } from "../store/socketStore";
import { GOLD_PRODUCT_SUB_TYPES } from "../store/useProductFormStore";
import { calculateGoldPrice } from "../utils/calculateGoldPrice";
import { getIRRCurrency } from "../utils/getIRRCurrency";
import { translate } from "../utils/translate";
import ProductRegistration from "./ScanMode/components/ProductRegistration";
import ESPProductRegistration from "./ESPModulesScanMode/components/ESPProductRegistration";

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
    const [columnCount, setColumnCount] = useState(3); // Default to 2 columns

    const [priceRange, setPriceRange] = useState<{ min: number, max: number }>({ min: 0, max: 100 });
    const [weightRange, setWeightRange] = useState<{ min: number, max: number }>({ min: 0, max: 100 });
    const [makingChargeRange, setMakingChargeRange] = useState<{ min: number, max: number }>({ min: 0, max: 100 });
    const [profitRange, setProfitRange] = useState<{ min: number, max: number }>({ min: 0, max: 100 });

    const { data: spotPrice, /*isLoading: spotPriceIsLoading,*/ error: spotPriceError, isError: spotPriceIsError } = useGoldCurrency();

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, isError: fetchingIsError, error: fetchingError } = useProducts({
        limit,
        sorting: [{ id: sortField, desc: sortDirection === "desc" }],
        filters,
    })
    const { mutate: deleteProductMutate, error: deleteProductError, isError: deleteProductIsError } = useDeleteProduct()

    const products = data?.pages.flatMap(p => p.items) ?? []

    const ranges = data?.pages[0].ranges

    const minPrice =
        spotPrice && spotPrice.gold && ranges &&
        calculateGoldPrice(
            ranges.price.min[0].karat,
            ranges.price.min[0].weight,
            ranges.price.min[0].makingCharge,
            ranges.price.min[0].profit,
            ranges.price.min[0].vat,
            {
                price: (spotPrice.gold.find(it => it.symbol === ranges.price.min[0].subType)?.price || 0) * 10,
                karat: (spotPrice.gold.find(it => it.symbol === ranges.price.min[0].subType)?.karat || 0),
            },
            ranges.price.min[0].accessoriesCharge,
        )
    const maxPrice =
        spotPrice && spotPrice.gold && ranges &&
        calculateGoldPrice(
            ranges.price.max[0].karat,
            ranges.price.max[0].weight,
            ranges.price.max[0].makingCharge,
            ranges.price.max[0].profit,
            ranges.price.max[0].vat,
            {
                price: (spotPrice.gold.find(it => it.symbol === ranges.price.max[0].subType)?.price || 0) * 10,
                karat: (spotPrice.gold.find(it => it.symbol === ranges.price.max[0].subType)?.karat || 0)
            },
            ranges.price.max[0].accessoriesCharge,

        )

    const confirmDelete = async () => {
        if (productToDelete)
            deleteProductMutate(productToDelete.id)
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

    const handleAdvanceFilterInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.name.includes("price")) {
            if (event.target.name.includes("min")) {
                const minValue = Number(event.target.value) <= priceRange.max ? Number(event.target.value) : priceRange.max
                setWeightRange(priceRange => ({ ...priceRange, min: minValue }));
            }
            if (event.target.name.includes("max")) {
                const maxValue = Number(event.target.value) >= priceRange.min ? Number(event.target.value) : priceRange.min
                setWeightRange(priceRange => ({ ...priceRange, max: maxValue }));
            }
        }
        if (event.target.name.includes("weight")) {
            if (event.target.name.includes("min")) {
                const minValue = Number(event.target.value) <= weightRange.max ? Number(event.target.value) : weightRange.max
                setWeightRange(weightRange => ({ ...weightRange, min: minValue }));
            }
            if (event.target.name.includes("max")) {
                const maxValue = Number(event.target.value) >= weightRange.min ? Number(event.target.value) : weightRange.min
                setWeightRange(weightRange => ({ ...weightRange, max: maxValue }));
            }
        }
        if (event.target.name.includes("makingCharge")) {
            if (event.target.name.includes("min")) {
                const minValue = Number(event.target.value) <= makingChargeRange.max ? Number(event.target.value) : makingChargeRange.max
                setWeightRange(makingChargeRange => ({ ...makingChargeRange, min: minValue }));
            }
            if (event.target.name.includes("max")) {
                const maxValue = Number(event.target.value) >= makingChargeRange.min ? Number(event.target.value) : makingChargeRange.min
                setWeightRange(makingChargeRange => ({ ...makingChargeRange, max: maxValue }));
            }
        }
        if (event.target.name.includes("profit")) {
            if (event.target.name.includes("min")) {
                const minValue = Number(event.target.value) <= profitRange.max ? Number(event.target.value) : profitRange.max
                setWeightRange(profitRange => ({ ...profitRange, min: minValue }));
            }
            if (event.target.name.includes("max")) {
                const maxValue = Number(event.target.value) >= profitRange.min ? Number(event.target.value) : profitRange.min
                setWeightRange(profitRange => ({ ...profitRange, max: maxValue }));
            }
        }
    };


    useEffect(() => {
        // Reset the cursor when filters or sorting change
        setCursor(null);
    }, [filters, sortField, sortDirection]);

    useEffect(() => {
        if (!!ranges) {
            setPriceRange({ min: minPrice || 0, max: maxPrice || 0 })
            setWeightRange({ min: ranges.weight.min, max: ranges.weight.max })
            setMakingChargeRange({ min: ranges.makingCharge.min, max: ranges.makingCharge.max })
            setProfitRange({ min: ranges.profit.min, max: ranges.profit.max })

        }
    }, [ranges])
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, []);


    const sliderStyle = {
        color: "primary.main",
        "& .MuiSlider-valueLabel": {
            backgroundColor: "primary.main",
        },
    };

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
                        label={t["Search Products"]}
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
                    <Stack direction={"row"} gap={2} alignItems={'center'}>
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
                <Accordion defaultExpanded={false} sx={{ my: 2, borderRadius: 1 }}>
                    <AccordionSummary
                        sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', display: 'flex' } }}
                        expandIcon={<ExpandMore />}
                        aria-controls="advanced-filters-content"
                    >
                        <IconButton><Tune color={Object.keys(filters).length !== 1 ? "success" : "inherit"} /></IconButton>
                        <Typography variant="subtitle1" fontWeight={600}>
                            {t["Advanced Filters"]}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={4}>
                            {/* Price */}
                            <Box>
                                <Stack direction={"row"} alignItems={"center"} gap={2}>
                                    <Chip sx={{ minWidth: 140, borderRadius: 1 }} label={t["Price ($)"]} />

                                    <Slider
                                        value={[priceRange.min, priceRange.max]}
                                        onChange={(_, val) =>
                                            setPriceRange(priceRange => ({ ...priceRange, min: val[0] <= val[1] ? val[0] : val[1], max: val[1] >= val[0] ? val[1] : val[0] }))
                                        }

                                        valueLabelFormat={(value) => getIRRCurrency(value)}
                                        valueLabelDisplay="auto"
                                        min={(minPrice && minPrice * .9) || 0}
                                        max={(maxPrice && maxPrice * 1.1) || 100}
                                        step={10000}
                                        sx={{ ...sliderStyle, mb: "1px" }}
                                        marks={[{ value: minPrice || 0, label: getIRRCurrency(minPrice || 0) }, { value: maxPrice || 0, label: getIRRCurrency(maxPrice || 0) },]}
                                        aria-labelledby="price-input-slider"
                                        slotProps={{
                                            markLabel: { style: { top: -26 } },
                                            root: { style: { paddingBottom: 0, borderRadius: 0 } },
                                            rail: { style: { height: 26, borderRadius: 0 } },
                                            track: { style: { height: 24, borderRadius: 0, backgroundColor: (minPrice && maxPrice) ? `hsl(${(priceRange.max - priceRange.min) / (maxPrice - minPrice) * 100}, 100%, 30%)` : `hsl(100, 100%, 30%)` } },
                                            thumb: { style: { zIndex: 100, color: theme.palette.warning.light, borderRadius: 2, height: 14, width: 14 } }
                                        }}
                                    />

                                </Stack>
                            </Box>

                            {/* Weight */}
                            <Box>
                                <Stack direction={"row"} alignItems={"center"} gap={2}>
                                    <Chip sx={{ minWidth: 140, borderRadius: 1 }} label={t["Weight (g)"]} />
                                    <TextField
                                        value={weightRange.min}
                                        name="weight-min"
                                        size="small"
                                        fullWidth
                                        type='number'
                                        inputMode="numeric"
                                        slotProps={{
                                            htmlInput: {
                                                step: 0.01,
                                                min: ranges?.weight.min || 0,
                                                max: ranges?.weight.max || 100,
                                                "aria-labelledby": 'min-weight-input-slider',
                                                sx: { textAlign: 'center', px: "1px", pt: "5px", pb: "1px", fontSize: 14 },
                                            },
                                            input: { sx: { borderRadius: 0 } }
                                        }}
                                        sx={{ width: 120 }}
                                        onChange={handleAdvanceFilterInputChange}
                                        aria-labelledby="min-weight-input-slider"
                                    />
                                    <Slider
                                        value={[weightRange.min, weightRange.max]}
                                        onChange={(_, val) =>
                                            setWeightRange(weightRange => ({ ...weightRange, min: val[0] <= val[1] ? val[0] : val[1], max: val[1] >= val[0] ? val[1] : val[0] }))
                                        }
                                        valueLabelDisplay="auto"
                                        min={ranges?.weight.min || 0}
                                        max={ranges?.weight.max || 100}
                                        step={0.01}
                                        sx={sliderStyle}
                                        marks
                                        aria-labelledby="weight-input-slider"
                                        slotProps={{
                                            root: { style: { paddingBottom: 0, marginLeft: -16, marginRight: -16, borderRadius: 0 } },
                                            rail: { style: { height: 26, borderRadius: 0 } },
                                            track: { style: { height: 24, borderRadius: 0, backgroundColor: ranges ? `hsl(${(weightRange.max - weightRange.min) / (ranges?.weight.max - ranges?.weight.min) * 100}, 100%, 30%)` : `hsl(100, 100%, 30%)` } },
                                            thumb: { style: { zIndex: 100, color: theme.palette.warning.light, borderRadius: 2, height: 14, width: 14 } }
                                        }}
                                    />
                                    <TextField
                                        variant="outlined"
                                        value={weightRange.max}
                                        name="weight-max"
                                        size="small"
                                        fullWidth
                                        type='number'
                                        inputMode="numeric"
                                        slotProps={{
                                            htmlInput: {
                                                step: 0.01,
                                                min: ranges?.weight.min || 0,
                                                max: ranges?.weight.max || 100,
                                                "aria-labelledby": 'max-weight-input-slider',
                                                sx: { textAlign: 'center', px: "1px", pt: "5px", pb: "1px", fontSize: 14 },
                                            },
                                            input: { sx: { borderRadius: 0 } }
                                        }}
                                        sx={{ width: 120 }}
                                        onChange={handleAdvanceFilterInputChange}
                                        aria-labelledby="max-weight-input-slider"
                                    />
                                </Stack>
                            </Box>

                            {/* Making Charge */}
                            <Box>
                                <Stack direction={"row"} alignItems={"center"} gap={2}>
                                    <Chip sx={{ minWidth: 140, borderRadius: 1 }} label={t["Making Charge (%)"]} />
                                    <TextField
                                        value={makingChargeRange.min}
                                        name="makingCharge-min"
                                        size="small"
                                        fullWidth
                                        type='number'
                                        inputMode="numeric"
                                        slotProps={{
                                            htmlInput: {
                                                step: 0.1,
                                                min: ranges?.makingCharge.min || 0,
                                                max: ranges?.makingCharge.max || 100,
                                                "aria-labelledby": 'min-makingCharge-input-slider',
                                                sx: { textAlign: 'center', px: "1px", pt: "5px", pb: "1px", fontSize: 14 },
                                            },
                                            input: { sx: { borderRadius: 0 } }
                                        }}
                                        sx={{ width: 120 }}
                                        onChange={handleAdvanceFilterInputChange}
                                        aria-labelledby="min-makingCharge-input-slider"
                                    />
                                    <Slider
                                        value={[makingChargeRange.min, makingChargeRange.max]}
                                        onChange={(_, val) =>
                                            setMakingChargeRange(makingChargeRange => ({ ...makingChargeRange, min: val[0] <= val[1] ? val[0] : val[1], max: val[1] >= val[0] ? val[1] : val[0] }))
                                        }
                                        valueLabelDisplay="auto"
                                        min={ranges?.makingCharge.min || 0}
                                        max={ranges?.makingCharge.max || 100}
                                        step={0.1}
                                        sx={sliderStyle}
                                        marks
                                        aria-labelledby="makingCharge-input-slider"
                                        slotProps={{
                                            root: { style: { paddingBottom: 0, marginLeft: -16, marginRight: -16, borderRadius: 0 } },
                                            rail: { style: { height: 26, borderRadius: 0 } },
                                            track: { style: { height: 24, borderRadius: 0, backgroundColor: ranges ? `hsl(${(makingChargeRange.max - makingChargeRange.min) / (ranges?.makingCharge.max - ranges?.makingCharge.min) * 100}, 100%, 30%)` : `hsl(100, 100%, 30%)` } },
                                            thumb: { style: { zIndex: 100, color: theme.palette.warning.light, borderRadius: 2, height: 14, width: 14 } }
                                        }}
                                    />
                                    <TextField
                                        variant="outlined"
                                        value={makingChargeRange.max}
                                        name="makingCharge-max"
                                        size="small"
                                        fullWidth
                                        type='number'
                                        inputMode="numeric"
                                        slotProps={{
                                            htmlInput: {
                                                step: 0.1,
                                                min: ranges?.makingCharge.min || 0,
                                                max: ranges?.makingCharge.max || 100,
                                                "aria-labelledby": 'max-makingCharge-input-slider',
                                                sx: { textAlign: 'center', px: "1px", pt: "5px", pb: "1px", fontSize: 14 },
                                            },
                                            input: { sx: { borderRadius: 0 } }
                                        }}
                                        sx={{ width: 120 }}
                                        onChange={handleAdvanceFilterInputChange}
                                        aria-labelledby="max-makingCharge-input-slider"
                                    />
                                </Stack>
                            </Box>

                            {/* Profit */}
                            <Box>
                                <Stack direction={"row"} alignItems={"center"} gap={2}>
                                    <Chip sx={{ minWidth: 140, borderRadius: 1 }} label={t["Profit (%)"]} />
                                    <TextField
                                        value={profitRange.min}
                                        name="profit-min"
                                        size="small"
                                        fullWidth
                                        type='number'
                                        inputMode="numeric"
                                        slotProps={{
                                            htmlInput: {
                                                step: 0.1,
                                                min: ranges?.profit.min || 0,
                                                max: ranges?.profit.max || 100,
                                                "aria-labelledby": 'min-profit-input-slider',
                                                sx: { textAlign: 'center', px: "1px", pt: "5px", pb: "1px", fontSize: 14 },
                                            },
                                            input: { sx: { borderRadius: 0 } }
                                        }}
                                        sx={{ width: 120 }}
                                        onChange={handleAdvanceFilterInputChange}
                                        aria-labelledby="min-profit-input-slider"
                                    />
                                    <Slider
                                        value={[profitRange.min, profitRange.max]}
                                        onChange={(_, val) =>
                                            setProfitRange(profitRange => ({ ...profitRange, min: val[0] <= val[1] ? val[0] : val[1], max: val[1] >= val[0] ? val[1] : val[0] }))
                                        }
                                        valueLabelDisplay="auto"
                                        min={ranges?.profit.min || 0}
                                        max={ranges?.profit.max || 100}
                                        step={0.1}
                                        sx={sliderStyle}
                                        marks
                                        aria-labelledby="profit-input-slider"
                                        slotProps={{
                                            root: { style: { paddingBottom: 0, marginLeft: -16, marginRight: -16, borderRadius: 0 } },
                                            rail: { style: { height: 26, borderRadius: 0 } },
                                            track: { style: { height: 24, borderRadius: 0, backgroundColor: ranges ? `hsl(${(profitRange.max - profitRange.min) / (ranges?.profit.max - ranges?.profit.min) * 100}, 100%, 30%)` : `hsl(100, 100%, 30%)` } },
                                            thumb: { style: { zIndex: 100, color: theme.palette.warning.light, borderRadius: 2, height: 14, width: 14 } }
                                        }}
                                    />
                                    <TextField
                                        variant="outlined"
                                        value={profitRange.max}
                                        name="profit-max"
                                        size="small"
                                        fullWidth
                                        type='number'
                                        inputMode="numeric"
                                        slotProps={{
                                            htmlInput: {
                                                step: 0.1,
                                                min: ranges?.profit.min || 0,
                                                max: ranges?.profit.max || 100,
                                                "aria-labelledby": 'max-profit-input-slider',
                                                sx: { textAlign: 'center', px: "1px", pt: "5px", pb: "1px", fontSize: 14 },
                                            },
                                            input: { sx: { borderRadius: 0 } }
                                        }}
                                        sx={{ width: 120 }}
                                        onChange={handleAdvanceFilterInputChange}
                                        aria-labelledby="max-profit-input-slider"
                                    />
                                </Stack>
                            </Box>

                            <Stack direction="row" justifyContent="flex-end" spacing={2}>
                                <Button
                                    variant="outlined"
                                    disabled={Object.keys(filters).length === 1}
                                    onClick={() => setFilters(filters => ({
                                        q: filters['q']
                                    }))}
                                >
                                    {t["Reset"]}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    disabled={Object.keys(filters).length !== 1}
                                    onClick={() => setFilters(filters => ({
                                        ...filters,
                                        priceRange,
                                        weightRange,
                                        makingChargeRange,
                                        profitRange
                                    }))}
                                >
                                    {t["Apply"]}
                                </Button>
                            </Stack>
                        </Stack>
                    </AccordionDetails>
                </Accordion>
                {/* Product Grid */}
                <Grid container spacing={2}>
                    {
                        products.map((product) => {
                            const productSpotPrice = 10 * (spotPrice?.gold.find(it => it.symbol === product.subType)?.price || 0)
                            const productSpotKarat = (spotPrice?.gold.find(it => it.symbol === product.subType)?.karat || 0)
                            const soldQuantity = product.saleItems?.reduce((p, c) => p + c.quantity, 0) || 0

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
                                                {t["Unit Weight:"]} {product.weight}{t["g"]}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="textSecondary">
                                                    {t["Making Charge:"]} {product.makingCharge}%
                                                </Typography>
                                                <Chip sx={{ borderRadius: 1 }} label={product.karat} />
                                            </Box>
                                            <Typography variant="body2" color="textSecondary">
                                                {t["Sold Quantity:"]} {soldQuantity}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="textSecondary">
                                                    {t["Sub Type:"]} {GOLD_PRODUCT_SUB_TYPES.find(it => it.symbol === product.subType)?.[theme.direction === "rtl" ? "name" : "name_en"]}
                                                </Typography>
                                                <Chip
                                                    icon={!!product.inventoryItem ? <Check /> : <Cancel />}
                                                    label={t["Inventory Item"]}
                                                    sx={{ borderRadius: 1 }}
                                                    color={!!product.inventoryItem ? "info" : 'default'}
                                                />
                                            </Box>
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
        </>
    )
}
