import { Fingerprint, PhoneAndroid } from "@mui/icons-material";
import { Alert, alpha, Box, Button, Container, Divider, Grid, InputAdornment, MenuItem, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useTheme } from "@mui/material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalali';
import { faIR } from 'date-fns-jalali/locale/fa-IR';
import React, { useRef, useState } from "react";
import { useLoaderData, useLocation } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useGoldCurrency } from "../api/goldCurrency";
import { useProductsByIds } from "../api/products";
import { useCreateSale } from "../api/sales";
import type { Customer, Invoice, Product } from "../lib/api";
import { useSocketStore } from "../store/socketStore";
import { GOLD_PRODUCT_SUB_TYPES } from "../store/useProductFormStore";
import { InvoiceLogoImg } from "../svg/InvoiceLogo/InvoiceLogo";
import { getIRRCurrency } from "../utils/getIRRCurrency";
import { isValidIranianNationalId } from "../utils/nationalIdChecker";
import { isValidIranMobile, normalizeIranMobileToE164 } from "../utils/phoneNumberChecker";

export default function IssueInvoice() {

    const theme = useTheme()
    const isConnected = useSocketStore((s) => s.isConnected);

    // data passed via navigate(..., { state: { snapshot } })
    const location = useLocation();
    const snapshot = (location.state)?.snapshot as Product[];

    const { mutateAsync: createSaleAsync, isPending: createSaleIsPending } = useCreateSale();
    const { products: loaderProducts } = useLoaderData() as { products: Product[] };

    // however you derived them from the URL earlier:
    const ids = loaderProducts.map(p => p.id);
    const [serverErr, setServerErr] = useState<string | null>(null)
    const [issuedInvoice, setIssuedInvoice] = useState<Invoice | null>(null)

    const { data } = useProductsByIds(ids, { initialData: loaderProducts });
    const { data: spotPrice, /*isLoading: spotPriceIsLoading,*/ error: spotPriceError, isError: spotPriceIsError } = useGoldCurrency();

    // snapshot if present (fast), otherwise use loader result
    const products = data || loaderProducts || snapshot


    // State for customer info form
    const [customer, setCustomer] = useState<Customer>({
        id: 0,
        name: "",
        phone: "",
        nid: "",
    });

    const [quantityPerProduct, setQuantityPerProduct] = useState<{ [key: string]: number }>(products.reduce((p, c) => ({ ...p, [`quantity_${c.id}`]: 1 }), {}))
    const [payType, setPayType] = useState<'cash' | 'credit'>('cash');
    const [desc, setDesc] = useState<string>("")

    // Handle form input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomer({
            ...customer,
            [e.target.name]: e.target.value,
        });
    };

    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn = useReactToPrint({
        contentRef,
        documentTitle: 'kanani-invoice',
    });

    const onlinePrice = (spotPrice?.gold.find(el => el.name_en === "18K Gold")?.price || 0)

    const canIssue =
        !spotPriceIsError &&
        products.length > 0 &&
        customer.name.length > 0 &&
        isValidIranMobile(customer.phone) &&
        isValidIranianNationalId(customer.nid) &&
        !Object.entries(quantityPerProduct)
            .map(([k, v]) => {
                const productQuantity = Number(products.find((p) => p.id === Number(k.toString().replace("quantity_", "")))?.quantity)
                const productSold = Number(products.find((p) => p.id === Number(k.toString().replace("quantity_", "")))?.saleItems?.reduce((p, c) => p + c.quantity, 0))

                return v >= 1 && v <= productQuantity - productSold
            }).includes(false)

    const handleIssueInvoice = async () => {
        if (canIssue && !spotPriceIsError) {
            try {
                const create = await createSaleAsync({
                    customer: { name: customer.name, nid: customer.nid, phone: customer.phone },
                    sellDate: new Date(),
                    payType: payType,
                    items: products.map(p => {
                        const productSpotPrice = 10 * (spotPrice?.gold.find(it => it.symbol === p.subType)?.price || 0)

                        return ({
                            productId: p.id,
                            quantity: quantityPerProduct[`quantity_${p.id}`],
                            soldPrice: Math.round(
                                10 *
                                productSpotPrice *
                                quantityPerProduct[`quantity_${p.id}`] *
                                Number(p.weight) * (1 + (Number(p.makingCharge) / 100) + (Number(p.profit) / 100) + (Number(p.vat) / 100))
                            ),
                            spotPrice: productSpotPrice
                        })
                    }),
                    description: desc
                })
                setServerErr(null)
                setIssuedInvoice(create)
            }
            catch (ex) {
                console.log(ex)
                const msg = JSON.parse((ex as Error).message || '{}').message
                setServerErr(msg)
            }
            console.log()
        }
    }

    return (
        <>
            <Box sx={{ width: 1, bgcolor: isConnected ? "green" : "red", height: 5 }} />
            {!!spotPriceError && <Alert sx={{ borderRadius: 0 }} severity="error" variant="filled">{JSON.parse(spotPriceError?.message || '{"message":""}').message}</Alert>}
            {!!serverErr && <Alert sx={{ borderRadius: 0 }} severity="error" variant="filled">{serverErr}</Alert>}
            < Container maxWidth="xl" sx={{ px: 3, pt: 2, pb: 5 }}>
                <Grid container ref={contentRef}>
                    <Grid container sx={{ border: '1px dashed gold', height: 745 }} size={{ xs: 12, sm: 3 }}>
                        <Grid size={{ xs: 12 }} sx={{ display: 'flex' }}>
                            <Box
                                sx={{
                                    position: "relative",
                                    overflow: "hidden",
                                    // borderRadius: 1,
                                    p: 3,
                                    width: 1,
                                    // background image
                                    "&::before": {
                                        content: '""',
                                        position: "absolute",
                                        inset: 0,
                                        backgroundImage: `url(/images/bg/invoiceBG.jpg)`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "cover",
                                        zIndex: 0,
                                    },

                                    // frosted overlay
                                    "&::after": {
                                        content: '""',
                                        position: "absolute",
                                        inset: 0,
                                        bgcolor: "rgba(10, 12, 16, 0.64)",
                                        backdropFilter: "blur(0px) saturate(20%)",
                                        WebkitBackdropFilter: "blur(0px) saturate(20%)",
                                        zIndex: 1,
                                        pointerEvents: "none",
                                    },
                                }}
                            >
                                {/* content */}
                                <Box sx={{ position: "relative", zIndex: 2, width: 1, height: 1 }}>
                                    <Grid container spacing={1} height={1} display={"flex"} flexDirection={'column'} justifyContent={"space-between"}>
                                        <Grid size={{ xs: 12 }} sx={{ gap: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <InvoiceLogoImg width={130} height={130} />
                                            <LocalizationProvider dateAdapter={AdapterDateFnsJalali} adapterLocale={faIR}>
                                                <DatePicker
                                                    name="date"
                                                    label=""
                                                    value={new Date()}
                                                    onChange={() => { }}
                                                    format="yyyy/MM/dd"                    // Jalali formatting via adapter                                                
                                                    slotProps={{
                                                        openPickerButton: {
                                                            sx: { color: 'common.white' }
                                                        },
                                                        textField: {
                                                            variant: 'standard',
                                                            fullWidth: true,
                                                            sx: {
                                                                // default state
                                                                '& .MuiPickersFilledInput-root:before': {
                                                                    borderBottomColor: 'white',
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
                                                                        '& .MuiPickersSectionList-root': { color: 'wheat', fontSize: 14 },
                                                                    },
                                                                    startAdornment: (
                                                                        <InputAdornment position="start">
                                                                            <Typography pb={0.25} fontSize={14} variant="body2" color="common.white">
                                                                                Date:
                                                                            </Typography>
                                                                        </InputAdornment>
                                                                    )
                                                                },
                                                            }
                                                        }
                                                    }}
                                                />
                                            </LocalizationProvider>
                                            <TextField
                                                name="no"
                                                placeholder={!!issuedInvoice ? issuedInvoice.id.toString() : "Proforma Invoice"}
                                                size="small"
                                                fullWidth
                                                variant="standard"
                                                sx={{
                                                    // default state
                                                    '& .MuiInput-underline:before': {
                                                        borderBottomColor: 'common.white', // or '#00A65A'
                                                    },
                                                    // hover (not disabled)
                                                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                                        borderBottomColor: 'common.white',
                                                    },
                                                    // focused
                                                    '& .MuiInput-underline:after': {
                                                        borderBottomColor: 'wheat',
                                                    },
                                                }}
                                                slotProps={{
                                                    input: {
                                                        readOnly: true,
                                                        sx: { color: 'wheat' },
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Typography variant="body2" color="common.white" gutterBottom>
                                                                    No:
                                                                </Typography>
                                                            </InputAdornment>
                                                        )
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12 }} sx={{ gap: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <TextField
                                                name="payType"
                                                select
                                                value={!!issuedInvoice ? issuedInvoice.payType : payType}
                                                onChange={e => setPayType(e.target.value as "cash" | "credit")}
                                                size="small"
                                                fullWidth
                                                variant="standard"
                                                sx={{
                                                    // default state
                                                    '& .MuiInput-underline:before': {
                                                        borderBottomColor: 'common.white', // or '#00A65A'
                                                    },
                                                    // hover (not disabled)
                                                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                                        borderBottomColor: 'common.white',
                                                    },
                                                    // focused
                                                    '& .MuiInput-underline:after': {
                                                        borderBottomColor: 'wheat',
                                                    },
                                                }}
                                                slotProps={{
                                                    input: {
                                                        sx: { color: 'wheat' },
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Typography variant="body2" color="common.white" gutterBottom>
                                                                    Pay Type:
                                                                </Typography>
                                                            </InputAdornment>
                                                        )
                                                    }
                                                }}
                                            >
                                                <MenuItem value="cash">Cash</MenuItem>
                                                <MenuItem value="credit">Credit</MenuItem>
                                            </TextField>
                                            <TextField
                                                name="desc"
                                                value={!!issuedInvoice ? issuedInvoice.description : desc}
                                                onChange={e => setDesc(e.target.value)}
                                                size="small"
                                                fullWidth
                                                variant="standard"
                                                multiline
                                                rows={5}
                                                sx={{
                                                    // default state
                                                    '& .MuiInput-underline:before': {
                                                        borderBottomColor: 'common.white', // or '#00A65A'
                                                    },
                                                    // hover (not disabled)
                                                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                                        borderBottomColor: 'common.white',
                                                    },
                                                    // focused
                                                    '& .MuiInput-underline:after': {
                                                        borderBottomColor: 'wheat',
                                                    },
                                                }}
                                                slotProps={{
                                                    input: {
                                                        sx: { color: 'wheat' },
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Typography variant="body2" color="common.white" gutterBottom>
                                                                    Desc:
                                                                </Typography>
                                                            </InputAdornment>
                                                        )
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <Alert color="warning" icon={false}>
                                                <Stack direction={'row'} alignItems={'center'}>
                                                    <Typography variant="h6" sx={{}}>
                                                        Spot Price:
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ ml: 2 }}>
                                                        {getIRRCurrency(10 * onlinePrice)}
                                                    </Typography>
                                                </Stack>
                                            </Alert>
                                        </Grid>
                                        <Grid size={{ xs: 12 }} sx={{ width: 1, justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                                            <Typography width={1} variant="caption" color="common.white">
                                                Address: Tabriz, Milad Noor
                                            </Typography>
                                            <Typography variant="caption" color="common.white">
                                                PHONE: 09141501251
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                    <Grid
                        container
                        size={{ xs: 12, sm: 9 }}
                        sx={{
                            display: 'flex',
                            alignContent: 'flex-start',
                            borderTop: '1px dashed gold',
                            borderRight: '1px dashed gold',
                            borderBottom: '1px dashed gold',
                            backgroundColor: alpha(theme.palette.warning.light, 0.08),
                            boxShadow: `0 8px 20px ${alpha(theme.palette.warning.main, 0.12)}`
                        }}
                    >
                        <Grid
                            // sx={{
                            //     backgroundImage: `radial-gradient(circle, ${theme.palette.warning.main} .8px, transparent 0.25px)`,
                            //     backgroundSize: '25px 25px',
                            // }}

                            sx={{
                                position: "relative",
                                // optional base background
                                bgcolor: "background.paper",
                                // create the dotted overlay on the left half
                                "&::before": {
                                    content: '""',
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",           // left half; use height: "50%" & width: "100%" for top half
                                    // Dots: 3px dot (adjust) on transparent
                                    backgroundImage: "radial-gradient(currentColor 1.5px, transparent 1.6px)",
                                    // Spacing between dot centers = 10px (so 5px gap around the first/last dots when positioned at 5,5)
                                    backgroundSize: "10px 10px",
                                    // Ensures the nearest dots are exactly 5px from each side of the overlay
                                    backgroundPosition: "5px 5px",
                                    color: "divider",       // dot color; pick any (e.g., "#bdbdbd")
                                    pointerEvents: "none",  // keep it purely decorative
                                    zIndex: 0,
                                },
                                // Make children sit above the overlay
                                "> *": { position: "relative", zIndex: 1 },
                                // minHeight: 240, // just to make it visible in a demo
                            }}

                            size={{ xs: 12 }}
                        >
                            <Typography textAlign={'center'} fontFamily={'Pacifico, Segoe Script, Vazirmatn, Poppins, cursive'} variant="h3" p={6} color="gold" fontWeight={800}>
                                Kanani jewelry
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }} sx={{ mb: 1 }}>
                            <Divider variant="fullWidth" sx={{ bgcolor: 'wheat', height: 4 }} />
                        </Grid>
                        <Grid size={{ xs: 6 }} sx={{ p: 2 }}>
                            <TextField
                                name="name"
                                size="small"
                                fullWidth
                                value={!!issuedInvoice ? issuedInvoice.customer.name : customer.name}
                                onChange={handleChange}
                                variant="standard"
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Typography variant="body2" gutterBottom>
                                                    Customer:
                                                </Typography>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 3 }} sx={{ p: 2 }}>
                            <TextField
                                name="phone"
                                value={!!issuedInvoice ? issuedInvoice.customer.phone : customer.phone}
                                onChange={(e) => {
                                    const next = e.target.value.replace(/\D/g, '').slice(0, 11);
                                    setCustomer(p => ({ ...p, phone: next }));
                                }}
                                size="small"
                                fullWidth
                                variant="standard"
                                type="tel"
                                slotProps={{
                                    input: {
                                        inputProps: { inputMode: 'numeric', maxLength: 11 },
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PhoneAndroid fontSize="medium" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                error={customer.phone.length > 0 && !isValidIranMobile(customer.phone) && customer.phone.length >= 10}
                                helperText={
                                    isValidIranMobile(customer.phone)
                                        ? `✓ ${normalizeIranMobileToE164(customer.phone)}`
                                        : customer.phone.length === 0
                                            ? 'Enter 10–11 digits'
                                            : customer.phone.length < 10
                                                ? 'Keep typing…'
                                                : 'Invalid mobile number'
                                }
                            />

                        </Grid>
                        <Grid size={{ xs: 3 }} sx={{ p: 2 }}>
                            <TextField
                                name="nid"
                                value={!!issuedInvoice ? issuedInvoice.customer.nid : customer.nid}
                                onChange={(e) => {
                                    const next = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setCustomer(p => ({ ...p, nid: next }));
                                }}
                                size="small"
                                fullWidth
                                variant="standard"
                                type="tel"
                                slotProps={{
                                    input: {
                                        inputProps: { inputMode: 'numeric', maxLength: 10 },
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Fingerprint fontSize="medium" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                error={customer.nid.length === 10 && !isValidIranianNationalId(customer.nid)}
                                helperText={
                                    customer.nid.length === 10
                                        ? isValidIranianNationalId(customer.nid)
                                            ? '✓ Looks good'
                                            : 'Invalid national ID'
                                        : 'Enter 10 digits'
                                }
                            />

                        </Grid>
                        <Grid size={{ xs: 12 }} sx={{ p: 2, pt: 0 }}>
                            {/* table header like screenshot */}
                            <Paper sx={{ width: 1, overflow: 'hidden' }}>
                                <TableContainer>
                                    <Table stickyHeader aria-label="sticky table" size="small" sx={{ border: 1, borderColor: 'divider' }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 70 }}>No</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700 }}>Name</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 90 }}>Quantity</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 100 }}>Weight(g)</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 135 }}>Making Charge + Profit + VAT</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 90 }}>Spot Price (ریال)</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 150 }}>Total (ریال)</TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {products.map((product, i) => {
                                                const productSpotPrice = spotPrice?.gold.find(it => it.symbol === product.subType)?.price || 0
                                                const productIRRSpotPrice = getIRRCurrency(10 * productSpotPrice).replace('ریال', '')
                                                const availableQuantity = Number(product.quantity) - Number(product.saleItems?.reduce((p, c) => p + c.quantity, 0))

                                                return (
                                                    <TableRow
                                                        key={product.id}
                                                        sx={{
                                                            '&:nth-of-type(odd)': {
                                                                backgroundColor: theme.palette.action.hover,
                                                            }
                                                        }}
                                                    >
                                                        <TableCell sx={{ height: 48 }} align="center">{i + 1}</TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">{product.name} - {GOLD_PRODUCT_SUB_TYPES.find(it => it.symbol === product.subType)?.name}</TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">
                                                            <TextField
                                                                name={`quantity_${product.id}`}
                                                                size="small"
                                                                variant="standard"
                                                                value={!!issuedInvoice ?
                                                                    issuedInvoice.items.find(el => el.product.id === product.id)?.quantity :
                                                                    Number(quantityPerProduct[`quantity_${product.id}`])}
                                                                type="number"
                                                                slotProps={{ htmlInput: { min: 1, max: availableQuantity, sx: { textAlign: 'center' }, readOnly: !!issuedInvoice } }}
                                                                onChange={(e) => setQuantityPerProduct(p => ({ ...p, [e.target.name]: Number(e.target.value) > availableQuantity ? availableQuantity : Number(e.target.value) < 1 ? 1 : Number(e.target.value) }))}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">{Number(product.weight).toString()}</TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">{Number(product.makingCharge).toString()}% + {Number(product.profit).toString()}% + {Number(product.vat).toString()}%</TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">{productIRRSpotPrice}</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, height: 48 }} align="center">{getIRRCurrency(10 * Number(productSpotPrice * 10) * Number(product.weight) * quantityPerProduct[`quantity_${product.id}`] * (1 + (Number(product.makingCharge) / 100) + (Number(product.profit) / 100) + (Number(product.vat) / 100))).replace('ریال', '')}</TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                            {/* empty rows to mimic the blank form grid */}
                                            {Array.from({ length: products.length >= 5 ? 0 : 5 - products.length }).map((_, i) => (
                                                <TableRow
                                                    key={`empty-${i}`}
                                                    sx={{
                                                        '&:nth-of-type(odd)': {
                                                            backgroundColor: theme.palette.action.hover,
                                                        }
                                                    }}
                                                >
                                                    <TableCell colSpan={8} sx={{ height: 48 }} />
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12 }} sx={{ px: 2 }}>
                            <Box
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    p: 1.25,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 2,
                                    flexWrap: 'wrap',
                                    alignItems: 'center'
                                }}
                            >
                                <Typography fontWeight={800} color="warning">Total Price</Typography>
                                <Stack direction="row" gap={2} alignItems={'center'}>
                                    <Typography color="warning.light">
                                        {
                                            getIRRCurrency(10 * products.reduce((p, c) => p + (onlinePrice * Number(c.weight) * quantityPerProduct[`quantity_${c.id}`] * (1 + (Number(c.makingCharge) / 100) + (Number(c.profit) / 100) + (Number(c.vat) / 100))), 0))
                                        }
                                    </Typography>
                                    {!issuedInvoice && <Divider flexItem orientation="vertical" />}
                                    {!issuedInvoice && <Button loading={createSaleIsPending} disabled={!canIssue} variant="text" sx={{ width: 100, mx: -1 }} onClick={handleIssueInvoice}>Issue</Button>}
                                </Stack>
                            </Box>
                        </Grid>
                        <Stack
                            width={1}
                            p={3}
                            m={2}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-around"
                            sx={(theme) => ({
                                borderRadius: 0.4,
                                border: `0.5px solid ${theme.palette.warning.light}`,
                                backgroundColor: alpha(theme.palette.warning.light, 0.08),
                                boxShadow: `0 8px 20px ${alpha(theme.palette.warning.main, 0.12)}`
                            })}
                        >
                            <Typography variant="subtitle1" fontWeight={700}>Customer Sign</Typography>
                            <Typography variant="subtitle1" fontWeight={700}>Store Sign</Typography>
                        </Stack>

                    </Grid>
                </Grid>
                <Box className="no-print" sx={{ textAlign: 'left', mb: 2 }}>
                    <Button variant="outlined" sx={{ mt: 1, width: 1 }} onClick={() => reactToPrintFn()}>Print</Button>
                </Box>
            </Container >

            {/* Error Message */}
            {spotPriceIsError && (
                <Snackbar open={true} autoHideDuration={6000}>
                    <Alert severity="error">{JSON.parse((spotPriceError as Error)?.message).message || "Something went wrong"}</Alert>
                </Snackbar>
            )}
        </>
    );
}
