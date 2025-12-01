import { DiscountOutlined, Fingerprint, PhoneAndroid } from "@mui/icons-material";
import { Alert, alpha, Autocomplete, Box, Button, Container, Divider, Grid, IconButton, InputAdornment, MenuItem, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useTheme } from "@mui/material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalali';
import { faIR } from 'date-fns-jalali/locale/fa-IR';
import { useRef, useState } from "react";
import { useLoaderData, useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useCustomerSearch } from "../api/customers";
import { useIssueInvoiceGoldCurrency } from "../api/goldCurrency";
import { useProductsByIds } from "../api/products";
import { useCreateSale } from "../api/sales";
import type { Customer, Invoice, Product } from "../lib/api";
import { useSocketStore } from "../store/socketStore";
import { GOLD_PRODUCT_SUB_TYPES } from "../store/useProductFormStore";
import { InvoiceLogoImg } from "../svg/InvoiceLogo/InvoiceLogo";
import { calculateGoldPrice } from "../utils/calculateGoldPrice";
import { getIRRCurrency } from "../utils/getIRRCurrency";
import { isValidIranianNationalId } from "../utils/nationalIdChecker";
import { isValidIranMobile, normalizeIranMobileToE164 } from "../utils/phoneNumberChecker";
import { translate } from "../utils/translate";
import { NumericFormatCustom } from "./ESPModulesScanMode/components/ESPProductRegistration";

export default function IssueInvoice() {

    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!
    const isConnected = useSocketStore((s) => s.isConnected);

    // data passed via navigate(..., { state: { snapshot } })
    const location = useLocation();
    const snapshot = (location.state)?.snapshot as Product[];
    const navigate = useNavigate();

    const { mutateAsync: createSaleAsync, isPending: createSaleIsPending } = useCreateSale();
    const { products: loaderProducts } = useLoaderData() as { products: Product[] };

    // however you derived them from the URL earlier:
    const ids = loaderProducts.map(p => p.id);
    const [serverErr, setServerErr] = useState<string | null>(null)
    const [issuedInvoice, setIssuedInvoice] = useState<Invoice | null>(null)

    const { data } = useProductsByIds(ids, { initialData: loaderProducts });
    const { data: spotPrice, /*isLoading: spotPriceIsLoading,*/ error: spotPriceError, isError: spotPriceIsError } = useIssueInvoiceGoldCurrency();

    // snapshot if present (fast), otherwise use loader result
    const products = data || loaderProducts || snapshot


    // State for customer info form
    const [customer, setCustomer] = useState<Customer>({
        id: 0,
        name: "",
        phone: "",
        nid: "",
    });

    const [searchTerm, setSearchTerm] = useState('');
    const { data: customerOptions = [], isFetching } = useCustomerSearch(searchTerm);

    const [quantityPerProduct, setQuantityPerProduct] = useState<{ [key: string]: number }>(products.reduce((p, c) => ({ ...p, [`quantity_${c.id}`]: 1 }), {}))
    const [discountPerProduct, setDiscountPerProduct] = useState<{ [key: string]: number }>(products.reduce((p, c) => ({ ...p, [`discount_${c.id}`]: 0 }), {}))
    const [payType, setPayType] = useState<'cash' | 'credit'>('cash');
    const [desc, setDesc] = useState<string>("")

    // when user selects existing customer:
    const handleCustomerSelect = (selected: Customer | null) => {
        if (selected && typeof selected !== 'string') {
            setCustomer(selected);
        }
    };


    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn = useReactToPrint({
        contentRef,
        documentTitle: 'kanani-invoice',
        pageStyle: theme.direction === "rtl" ?
            `
            @page { size: A4 landscape; margin: 0.5cm; }
            @media print {
                /* Scope all print rules to .printable-content */
                .printable-content {
                    direction: rtl !important;
                    text-align: right !important;
                    unicode-bidi: embed !important;
                }
                .printable-content * {
                    direction: rtl !important;
                }
                .printable-content table, .printable-content .MuiTable-root {
                    direction: rtl !important;
                }
                .printable-content .MuiTableCell-root {
                    text-align: right !important;
                }
                .printable-content .MuiInputBase-root, .printable-content .MuiTextField-root {
                    text-align: right !important;
                }
                /* Flip MUI margins/paddings for RTL */
                .printable-content .MuiBox-root, .printable-content .MuiGrid-root {
                    margin-right: var(--muirtl-margin-left, 0) !important;
                    margin-left: var(--muirtl-margin-right, 0) !important;
                }
                /* Persian font fallback */
                body { font-family: 'Vazirmatn', 'IRANSans', sans-serif !important; }
                
                /* ENHANCED: Hide no-print column (header + body cells) with MUI specificity */
                .printable-content .no-print,
                .printable-content .no-print.MuiTableCell-root,
                .printable-content table td.no-print,
                .printable-content .MuiTableBody-root td.no-print {
                    display: none !important;
                    visibility: hidden !important;
                    width: 0 !important;
                    min-width: 0 !important;
                    max-width: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                }
                /* Ensure table reflows after hiding column */
                .printable-content .MuiTable-root {
                    table-layout: fixed !important;  /* Prevents gaps */
                }
            }
        ` :
            `
            @page { size: A4 landscape; margin: 0.5cm; }
            @media print {
                /* Scope all print rules to .printable-content */
                .printable-content {
                    /* LTR defaults if needed */
                }
                
                /* ENHANCED: Hide no-print column (header + body cells) with MUI specificity */
                .printable-content .no-print,
                .printable-content .no-print.MuiTableCell-root,
                .printable-content table td.no-print,
                .printable-content .MuiTableBody-root td.no-print {
                    display: none !important;
                    visibility: hidden !important;
                    width: 0 !important;
                    min-width: 0 !important;
                    max-width: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                }
                /* Ensure table reflows after hiding column */
                .printable-content .MuiTable-root {
                    table-layout: fixed !important;  /* Prevents gaps */
                }
            }
        `,
    });

    const onlinePrice = (spotPrice?.gold.find(el => el.name_en === "18K Gold")?.price || 0)

    const canIssue =
        !spotPriceIsError &&
        products.length > 0 &&
        customer.name.length > 0 &&
        isValidIranMobile(customer.phone) &&
        // isValidIranianNationalId(customer.nid) &&
        !Object.entries(quantityPerProduct)
            .map(([k, v]) => {
                const productQuantity = Number(products.find((p) => p.id === Number(k.toString().replace("quantity_", "")))?.quantity)
                const productSold = Number(products.find((p) => p.id === Number(k.toString().replace("quantity_", "")))?.saleItems?.reduce((p, c) => p + c.quantity, 0))

                return v >= 1 && v <= productQuantity - productSold
            }).includes(false)

    const handleIssueInvoice = async () => {
        if (canIssue && !spotPriceIsError && spotPrice && spotPrice.gold) {
            try {
                const create = await createSaleAsync({
                    customer: { name: customer.name, nid: customer.nid, phone: customer.phone },
                    sellDate: new Date(),
                    payType: payType,
                    items: products.map(p => {
                        const productSpotPrice = 10 * (spotPrice.gold.find(it => it.symbol === p.subType)?.price || 0)
                        const productSpotKarat = (spotPrice.gold.find(it => it.symbol === p.subType)?.karat || 0)

                        return ({
                            productId: p.id,
                            quantity: quantityPerProduct[`quantity_${p.id}`],
                            soldPrice:
                                quantityPerProduct[`quantity_${p.id}`] *
                                (
                                    calculateGoldPrice(
                                        Number(p.karat),
                                        Number(p.weight),
                                        Number(p.makingChargeSell),
                                        Number(p.profit),
                                        Number(p.vat),
                                        { price: productSpotPrice, karat: productSpotKarat },
                                        Number(p.accessoriesCharge),
                                        Number(discountPerProduct[`discount_${p.id}`])
                                    ) || 0
                                ),
                            discount: discountPerProduct[`discount_${p.id}`],
                            spotPrice: productSpotPrice
                        })
                    }),
                    description: desc
                })
                setServerErr(null)
                setIssuedInvoice(create)
                navigate(`/invoice-detail?${new URLSearchParams({ ids: [create.id].join(',') }).toString()}`, { replace: true })
            }
            catch (ex) {
                console.log(ex)
                const msg = JSON.parse((ex as Error).message || '{}').message
                setServerErr(msg)
            }
        }
    }

    return (
        <>
            <Box sx={{ width: 1, bgcolor: isConnected ? "green" : "red", height: 5 }} />
            {!!spotPriceError && <Alert sx={{ borderRadius: 0 }} severity="error" variant="filled">{JSON.parse(spotPriceError?.message || '{"message":""}').message}</Alert>}
            {!!serverErr && <Alert sx={{ borderRadius: 0 }} severity="error" variant="filled">{serverErr}</Alert>}
            < Container maxWidth="xl" sx={{ px: 3, pt: 2, pb: 5 }}>
                <Grid
                    container
                    ref={contentRef}
                    className="printable-content"
                >
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
                                            <TextField
                                                name="no"
                                                placeholder={!!issuedInvoice ? issuedInvoice.id.toString() : t["Proforma Invoice"]}
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
                                                                    {t["No:"]}
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
                                                                    {t["Pay Type:"]}
                                                                </Typography>
                                                            </InputAdornment>
                                                        )
                                                    }
                                                }}
                                            >
                                                <MenuItem value="cash">{t["Cash"]}</MenuItem>
                                                <MenuItem value="credit">{t["Credit"]}</MenuItem>
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
                                                                    {t["Desc:"]}
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
                                                        {t["Spot Price:"]}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ ml: 2 }}>
                                                        {getIRRCurrency(10 * onlinePrice)}
                                                    </Typography>
                                                </Stack>
                                            </Alert>
                                        </Grid>
                                        <Grid size={{ xs: 12 }} sx={{ width: 1, justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                                            <Typography width={1} variant="caption" color="common.white">
                                                {t["Address: Tabriz, Milad Noor"]}
                                            </Typography>
                                            <Typography variant="caption" color="common.white">
                                                {t["PHONE: 09141501251"]}
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
                            <Typography textAlign={'center'} fontFamily={theme.direction === "ltr" ? 'Pacifico, Segoe Script, Vazirmatn, Poppins, cursive' : 'IRANSans'} variant="h4" p={2} color="gold" fontWeight={700}>
                                {t["Kanani jewelry"]}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }} sx={{ mb: 1 }}>
                            <Divider variant="fullWidth" sx={{ bgcolor: 'wheat', height: 4 }} />
                        </Grid>

                        {/* --- Name --- */}
                        <Grid size={{ xs: 6 }} sx={{ p: 2 }}>
                            <Autocomplete
                                freeSolo
                                loading={isFetching}
                                options={customerOptions}
                                onChange={(_, selected) => handleCustomerSelect(selected as Customer)}
                                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                                getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.name}
                                inputValue={customer.name}
                                onInputChange={(_, val) => {
                                    setCustomer((p) => ({ ...p, name: val }));
                                    setSearchTerm(val);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        name="name"
                                        variant="standard"
                                        size="small"
                                        slotProps={{
                                            input: {
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Typography variant="body2">{t["Customer:"]}</Typography>
                                                    </InputAdornment>
                                                ),
                                            }
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* --- Phone --- */}
                        <Grid size={{ xs: 3 }} sx={{ p: 2 }}>
                            <Autocomplete
                                freeSolo
                                loading={isFetching}
                                options={customerOptions}
                                onChange={(_, selected) => handleCustomerSelect(selected as Customer)}
                                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                                getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.phone}
                                inputValue={customer.phone}
                                onInputChange={(_, val) => {
                                    const next = val.replace(/\D/g, '').slice(0, 11);
                                    setCustomer((p) => ({ ...p, phone: next }));
                                    setSearchTerm(next);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        name="phone"
                                        variant="standard"
                                        size="small"
                                        type="tel"
                                        slotProps={{
                                            input: {
                                                ...params.InputProps,
                                                slotProps: { input: { inputMode: 'numeric', maxLength: 11 } },
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
                                                    ? t['Enter 10–11 digits']
                                                    : customer.phone.length < 10
                                                        ? t['Keep typing…']
                                                        : t['Invalid mobile number']
                                        }
                                    />
                                )}
                            />
                        </Grid>

                        {/* --- NID --- */}
                        <Grid size={{ xs: 3 }} sx={{ p: 2 }}>
                            <Autocomplete
                                freeSolo
                                loading={isFetching}
                                options={customerOptions}
                                onChange={(_, selected) => handleCustomerSelect(selected as Customer)}
                                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                                getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.nid}
                                inputValue={customer.nid}
                                onInputChange={(_, val) => {
                                    const next = val.replace(/\D/g, '').slice(0, 10);
                                    setCustomer((p) => ({ ...p, nid: next }));
                                    setSearchTerm(next);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        name="nid"
                                        variant="standard"
                                        size="small"
                                        type="tel"
                                        slotProps={{
                                            input: {
                                                ...params.InputProps,
                                                slotProps: { input: { inputMode: 'numeric', maxLength: 10 } },
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Fingerprint fontSize="medium" />
                                                    </InputAdornment>
                                                ),
                                            }
                                        }}
                                        error={customer.nid.length === 10 && !isValidIranianNationalId(customer.nid)}
                                        helperText={
                                            customer.nid.length === 10
                                                ? isValidIranianNationalId(customer.nid)
                                                    ? t['✓ Looks good']
                                                    : t['Invalid national ID']
                                                : t['Enter 10 digits']
                                        }
                                    />
                                )}
                            />
                        </Grid>


                        <Grid size={{ xs: 12 }} sx={{ p: 2, pt: 0 }}>
                            {/* table header like screenshot */}
                            <Paper sx={{ width: 1, overflow: 'hidden' }}>
                                <TableContainer>
                                    <Table stickyHeader aria-label="sticky table" size="small" sx={{ border: 1, borderColor: 'divider' }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 70 }}>{t["No"]}</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700 }}>{t["Name"]}</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 90 }}>{t["Quantity"]}</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 100 }}>{t["Weight(g)"]}</TableCell>
                                                <TableCell className="no-print" align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 135 }}>{t["Making Charge Buy + Profit + VAT"]}</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 90 }}>{t["Spot Price (ریال)"]}</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 150 }}>{t["accessoriesCharge (ریال)"]}</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 150 }}>{t["discount (ریال)"]}</TableCell>
                                                <TableCell align="center" sx={{ bgcolor: 'wheat', height: 48, fontWeight: 700, width: 150 }}>{t["Total (ریال)"]}</TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {products.map((product, i) => {
                                                const productSpotPrice = 10 * (spotPrice?.gold.find(it => it.symbol === product.subType)?.price || 0)
                                                const productSpotKarat = (spotPrice?.gold.find(it => it.symbol === product.subType)?.karat || 0)
                                                const productIRRSpotPrice = getIRRCurrency(productSpotPrice).replace('ریال', '')
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
                                                        <TableCell className="no-print" sx={{ height: 48 }} align="center">{Number(product.makingChargeSell).toString()}% + {Number(product.profit).toString()}% + {Number(product.vat).toString()}%</TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">{productIRRSpotPrice}</TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">{getIRRCurrency(product.accessoriesCharge).replace('ریال', '')}</TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">
                                                            <NumericFormatCustom
                                                                variant="standard"
                                                                name={`discount_${product.id}`}
                                                                value={!!issuedInvoice ?
                                                                    issuedInvoice.items.find(el => el.product.id === product.id)?.discount :
                                                                    Number(discountPerProduct[`discount_${product.id}`])}
                                                                onChange={(e: any) =>
                                                                    setDiscountPerProduct(p => {
                                                                        return (
                                                                            {
                                                                                ...p,
                                                                                [e.target.name]:
                                                                                    e.target.value === "" ? 0 :
                                                                                        (Number(e.target.value) > (Number(product.weight) * Number(productSpotPrice))) ?
                                                                                            (Number(product.weight) * Number(productSpotPrice)) :
                                                                                            ((Number(e.target.value) < 0) ?
                                                                                                0 :
                                                                                                Number(e.target.value))
                                                                            }
                                                                        )
                                                                    })
                                                                }
                                                                disabled={!!issuedInvoice}
                                                                fullWidth
                                                                margin="normal"
                                                                InputProps={{
                                                                    endAdornment: (
                                                                        <InputAdornment position="end">
                                                                            <IconButton onClick={() => {
                                                                                setDiscountPerProduct(p => {
                                                                                    const basePrice = calculateGoldPrice(
                                                                                        Number(product.karat),
                                                                                        Number(product.weight),
                                                                                        Number(product.makingChargeSell),
                                                                                        Number(product.profit),
                                                                                        Number(product.vat),
                                                                                        { price: Number(productSpotPrice), karat: Number(productSpotKarat) },
                                                                                        Number(product.accessoriesCharge),
                                                                                        Number(discountPerProduct[`discount_${product.id}`])
                                                                                    )
                                                                                    return (
                                                                                        {
                                                                                            ...p,
                                                                                            [`discount_${product.id}`]: discountPerProduct[`discount_${product.id}`] + Math.floor(Number(basePrice) - Math.floor(Number(basePrice) / 1000) * 1000)
                                                                                        }
                                                                                    )
                                                                                })
                                                                            }}>
                                                                                <DiscountOutlined />
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    )
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 700, height: 48 }} align="center">{
                                                            getIRRCurrency(
                                                                quantityPerProduct[`quantity_${product.id}`] *
                                                                (
                                                                    calculateGoldPrice(
                                                                        Number(product.karat),
                                                                        Number(product.weight),
                                                                        Number(product.makingChargeSell),
                                                                        Number(product.profit),
                                                                        Number(product.vat),
                                                                        { price: Number(productSpotPrice), karat: Number(productSpotKarat) },
                                                                        Number(product.accessoriesCharge),
                                                                        Number(discountPerProduct[`discount_${product.id}`])
                                                                    ) || 0
                                                                )
                                                            ).replace('ریال', '')}
                                                        </TableCell>
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
                                                    className="no-print"
                                                >
                                                    <TableCell colSpan={9} sx={{ height: 48 }} />
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
                                <Typography fontWeight={800} color="warning">{t["Total Price"]}</Typography>
                                <Stack direction="row" gap={2} alignItems={'center'}>
                                    <Typography color="warning.light">
                                        {
                                            getIRRCurrency(products.reduce((p, c) => {
                                                const productSpotPrice = 10 * (spotPrice?.gold.find(it => it.symbol === c.subType)?.price || 0)
                                                const productSpotKarat = (spotPrice?.gold.find(it => it.symbol === c.subType)?.karat || 0)
                                                return p +
                                                    (
                                                        quantityPerProduct[`quantity_${c.id}`] *
                                                        (
                                                            calculateGoldPrice(
                                                                Number(c.karat),
                                                                Number(c.weight),
                                                                Number(c.makingChargeSell),
                                                                Number(c.profit),
                                                                Number(c.vat),
                                                                { price: productSpotPrice, karat: productSpotKarat },
                                                                Number(c.accessoriesCharge),
                                                                Number(Number(discountPerProduct[`discount_${c.id}`]))
                                                            ) || 0
                                                        )
                                                    )
                                            }, 0))
                                        }
                                    </Typography>
                                    {!issuedInvoice && <Divider flexItem orientation="vertical" />}
                                    {!issuedInvoice && <Button loading={createSaleIsPending} disabled={!canIssue} variant="text" sx={{ width: 100, mx: -1 }} onClick={handleIssueInvoice}>{t["Issue"]}</Button>}
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
                            <Typography variant="subtitle1" fontWeight={700}>{t["Customer Sign"]}</Typography>
                            <Typography variant="subtitle1" fontWeight={700}>{t["Store Sign"]}</Typography>
                        </Stack>

                    </Grid>
                </Grid>
                <Box className="no-print" sx={{ textAlign: 'left', mb: 2 }}>
                    <Button variant="outlined" sx={{ mt: 1, width: 1 }} onClick={() => reactToPrintFn()}>{t["Print"]}</Button>
                </Box>
            </Container >

            {/* Error Message */}
            {spotPriceIsError && (
                <Snackbar open={true} autoHideDuration={6000}>
                    <Alert severity="error">{JSON.parse((spotPriceError as Error)?.message).message || t["Something went wrong."]}</Alert>
                </Snackbar>
            )}
        </>
    );
}
