import { Box, Container, Grid, InputAdornment, TextField, Typography, useTheme } from "@mui/material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFnsJalali } from '@mui/x-date-pickers/AdapterDateFnsJalali';
import { faIR } from 'date-fns-jalali/locale/fa-IR';
import { useState } from "react";
import type { Customer, Product, Sale } from "../lib/api";
import { useSocketStore } from "../store/socketStore";
import { InvoiceLogo } from "../svg/InvoiceLogo/InvoiceLogo";

export default function IssueInvoice() {
    const theme = useTheme()
    const isConnected = useSocketStore((s) => s.isConnected);

    // State for customer info form
    const [customer, setCustomer] = useState<Customer>({
        id: 0,
        name: "",
        phone: "",
        nid: "",
    });

    // Handle form input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomer({
            ...customer,
            [e.target.name]: e.target.value,
        });
    };

    // Handle form submission and PDF generation
    const handleGenerateInvoice = () => {
        // Example product details for the invoice
        const product: Product = {
            id: 1,
            name: "Gold Ring",
            photos: [],
            previews: [],
            weight: 50,
            type: "Ring",
            quantity: 10,
            makingCharge: 5,
            vat: 10,
            profit: 15,
        };

        const sale: Sale = {
            id: 1,
            sellDate: new Date(),
            customer: customer,
            product: product,
            quantity: 1,
            payType: "Credit",
            description: "Sample sale",
            spotPrice: 90000000,
            soldPrice: 95000000,
        };
    };

    return (
        <>
            <Box sx={{ width: 1, bgcolor: isConnected ? "green" : "red", height: 5 }} />

            <Container maxWidth="xl" sx={{ px: 3, pt: 2, pb: 5 }}>
                <Grid container>
                    <Grid container sx={{ border: '1px dashed gold', height: 700 }} size={{ xs: 3, sm: 4 }}>
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
                                        backgroundPosition: "start",
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
                                <Box sx={{ position: "relative", zIndex: 2, width: 1 }}>
                                    <Grid container>
                                        <Grid size={{ xs: 12 }} sx={{ width: 1, justifyContent: 'center', display: 'flex' }}>
                                            <InvoiceLogo sx={{ width: 130, height: 130 }} />
                                        </Grid>

                                        <TextField
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
                                                                Date:
                                                            </Typography>
                                                        </InputAdornment>
                                                    )
                                                }
                                            }}
                                        />
                                        <LocalizationProvider dateAdapter={AdapterDateFnsJalali} adapterLocale={faIR}>
                                            <DatePicker
                                                label=""
                                                defaultValue={new Date()}              // today
                                                format="yyyy/MM/dd"                    // Jalali formatting via adapter
                                                slotProps={{
                                                    inputAdornment: (
                                                        <InputAdornment position="start">
                                                            <Typography variant="body2" color="common.white" gutterBottom>
                                                                Date:
                                                            </Typography>
                                                        </InputAdornment>
                                                    ),
                                                    textField: {
                                                        variant: 'standard',
                                                        fullWidth: true,
                                                        // slotProps: {
                                                        //     input: {
                                                        //         startAdornment: (
                                                        //             <InputAdornment position="start">
                                                        //                 <Typography variant="body2" color="common.white" gutterBottom>
                                                        //                     Date:
                                                        //                 </Typography>
                                                        //             </InputAdornment>
                                                        //         )
                                                        //     },
                                                        // }
                                                    }
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                    <Grid size={{ xs: 9, sm: 8 }} sx={{ borderTop: '1px dashed gold', borderRight: '1px dashed gold', borderBottom: '1px dashed gold' }}></Grid>
                </Grid>
                {/* Header */}
                {/* <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Issue Invoice
                </Typography> */}

                {/* Customer Info Form */}
                {/* <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Customer Name"
                            variant="outlined"
                            fullWidth
                            value={customer.name}
                            onChange={handleChange}
                            name="name"
                            size="small"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Phone"
                            variant="outlined"
                            fullWidth
                            value={customer.phone}
                            onChange={handleChange}
                            name="phone"
                            size="small"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="National ID"
                            variant="outlined"
                            fullWidth
                            value={customer.nid}
                            onChange={handleChange}
                            name="nid"
                            size="small"
                        />
                    </Grid>
                </Grid> */}
            </Container>
        </>
    );
}
