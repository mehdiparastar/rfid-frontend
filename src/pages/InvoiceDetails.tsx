import { Fingerprint, PhoneAndroid } from "@mui/icons-material";
import { alpha, Box, Button, Container, Divider, Grid, InputAdornment, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useTheme } from "@mui/material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalali';
import { faIR } from 'date-fns-jalali/locale/fa-IR';
import { useRef } from "react";
import { useLoaderData, useLocation } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useInvoicesByIds } from "../api/invoices";
import type { Invoice } from "../lib/api";
import { useSocketStore } from "../store/socketStore";
import { GOLD_PRODUCT_SUB_TYPES } from "../store/useProductFormStore";
import { InvoiceLogoImg } from "../svg/InvoiceLogo/InvoiceLogo";
import { getIRRCurrency } from "../utils/getIRRCurrency";
import { translate } from "../utils/translate";

export default function InvoiceDetails() {

    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!
    const isConnected = useSocketStore((s) => s.isConnected);

    // data passed via navigate(..., { state: { snapshot } })
    const location = useLocation();
    const snapshot = (location.state)?.snapshot as Invoice[];

    const { invoices: loaderInvoices } = useLoaderData() as { invoices: Invoice[] };

    // however you derived them from the URL earlier:
    const ids = loaderInvoices.map(p => p.id);

    const { data } = useInvoicesByIds(ids, { initialData: loaderInvoices });

    // snapshot if present (fast), otherwise use loader result
    const invoices = data || loaderInvoices || snapshot

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


    const invoice = invoices[0]

    if (!invoice)
        return <Box>{t["Nothing exist to show."]}</Box>

    return (
        <>
            <Box sx={{ width: 1, bgcolor: isConnected ? "green" : "red", height: 5 }} />
            <Container maxWidth="xl" sx={{ px: 3, pt: 2, pb: 5 }}>

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
                                                    value={new Date(invoice.createdAt!)}
                                                    onChange={() => { }}
                                                    format="yyyy/MM/dd HH:mm"                    // Jalali formatting via adapter                                                
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
                                                placeholder={invoice.id.toString()}
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
                                                value={invoice.payType}
                                                onChange={() => { }}
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
                                                value={invoice.description}
                                                onChange={() => { }}
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
                            <Typography textAlign={'center'} fontFamily={theme.direction === "ltr" ? 'Pacifico, Segoe Script, Vazirmatn, Poppins, cursive' : 'IRANSans'} variant="h4" p={2} color="gold" fontWeight={700}>
                                {t["Kanani jewelry"]}
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
                                value={invoice.customer.name}
                                onChange={() => { }}
                                variant="standard"
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Typography variant="body2" gutterBottom>
                                                    {t["Customer:"]}
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
                                value={invoice.customer.phone}
                                onChange={() => { }}
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
                            />

                        </Grid>
                        <Grid size={{ xs: 3 }} sx={{ p: 2 }}>
                            <TextField
                                name="nid"
                                value={invoice.customer.nid}
                                onChange={() => { }}
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
                                            {invoice.items.map((item, i) => {
                                                const itemSpotPrice = item.spotPrice
                                                const itemIRRSpotPrice = getIRRCurrency(itemSpotPrice).replace('ریال', '')

                                                return (
                                                    <TableRow
                                                        key={item.id}
                                                        sx={{
                                                            '&:nth-of-type(odd)': {
                                                                backgroundColor: theme.palette.action.hover,
                                                            }
                                                        }}
                                                    >
                                                        <TableCell sx={{ height: 48 }} align="center">{i + 1}</TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">{item.product.name} - {GOLD_PRODUCT_SUB_TYPES.find(it => it.symbol === item.product.subType)?.name}</TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">
                                                            <TextField
                                                                name={`quantity_${item.id}`}
                                                                size="small"
                                                                variant="standard"
                                                                value={item.quantity}
                                                                type="number"
                                                                slotProps={{ htmlInput: { sx: { textAlign: 'center' }, readOnly: true } }}
                                                                onChange={() => { }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">{Number(item.product.weight).toString()}</TableCell>
                                                        <TableCell className="no-print" sx={{ height: 48 }} align="center">{Number(item.product.makingChargeSell).toString()}% + {Number(item.product.profit).toString()}% + {Number(item.product.vat).toString()}%</TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">{itemIRRSpotPrice}</TableCell>
                                                        <TableCell sx={{ height: 48 }} align="center">{getIRRCurrency(item.product.accessoriesCharge).replace('ریال', '')}</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, height: 48 }} align="center">{getIRRCurrency(item.discount).replace('ریال', '')}</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, height: 48 }} align="center">{getIRRCurrency(item.soldPrice).replace('ریال', '')}</TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                            {/* empty rows to mimic the blank form grid */}
                                            {Array.from({ length: invoices.length >= 5 ? 0 : 5 - invoices.length }).map((_, i) => (
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
                                            getIRRCurrency(invoice.items.reduce((p, c) => Number(p) + Number(c.soldPrice), 0))
                                        }
                                    </Typography>
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

            </Container>
        </>
    );
}
