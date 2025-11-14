import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { Box, Card, CardContent, Chip, CircularProgress, Divider, Grid, Stack, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useGoldCurrency } from "../../api/goldCurrency";
import { useSocketStore } from "../../store/socketStore";
import { translate } from "../../utils/translate";
import type { GoldProductSUBType } from "../../store/useProductFormStore";

const calcCoinPrice = (symbol: GoldProductSUBType, pricePerGeram: number) => {
    if (symbol === "IR_COIN_EMAMI") return pricePerGeram * 8.133
    if (symbol === "IR_COIN_BAHAR") return pricePerGeram * 8.133
    if (symbol === "IR_COIN_HALF") return pricePerGeram * 4.066
    if (symbol === "IR_COIN_QUARTER") return pricePerGeram * 2.033
    if (symbol === "IR_COIN_1G") return pricePerGeram * 1.01
    if (symbol === "IR_PCOIN_1-5G") return pricePerGeram * 1.50
    if (symbol === "IR_PCOIN_1-4G") return pricePerGeram * 1.40
    if (symbol === "IR_PCOIN_1-3G") return pricePerGeram * 1.30
    if (symbol === "IR_PCOIN_1-2G") return pricePerGeram * 1.20
    if (symbol === "IR_PCOIN_1-1G") return pricePerGeram * 1.10
    if (symbol === "IR_PCOIN_1G") return pricePerGeram * 1.00
    if (symbol === "IR_PCOIN_900MG") return pricePerGeram * 0.90
    if (symbol === "IR_PCOIN_800MG") return pricePerGeram * 0.80
    if (symbol === "IR_PCOIN_700MG") return pricePerGeram * 0.70
    if (symbol === "IR_PCOIN_600MG") return pricePerGeram * 0.60
    if (symbol === "IR_PCOIN_500MG") return pricePerGeram * 0.50
    if (symbol === "IR_PCOIN_400MG") return pricePerGeram * 0.40
    if (symbol === "IR_PCOIN_300MG") return pricePerGeram * 0.30
    if (symbol === "IR_PCOIN_200MG") return pricePerGeram * 0.20
    if (symbol === "IR_PCOIN_100MG") return pricePerGeram * 0.10
    if (symbol === "IR_GOLD_MELTED") return pricePerGeram * 4.3318
    if (symbol === "XAUUSD") return pricePerGeram * 28.3495
    return pricePerGeram
}
export default function GoldPriceDashboard() {
    const theme = useTheme()
    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!
    const isConnected = useSocketStore((s) => s.isConnected)
    const { data, isLoading, isError } = useGoldCurrency();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, []);

    if (isLoading)
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
            </Box>
        );

    if (isError)
        return (
            <Box textAlign="center" p={3}>
                <Typography color="error">{t["Failed to fetch gold data."]}</Typography>
            </Box>
        );

    return (
        <>
            <Box sx={{ width: 1, bgcolor: isConnected ? 'green' : 'red', height: 5 }} />
            <Box p={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" fontWeight="bold">
                        {t["Gold Price Dashboard"]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t["Updated at:"]} {data?.gold?.[0]?.date} {data?.gold?.[0]?.time}
                    </Typography>
                </Stack>

                <Grid container spacing={2}>
                    {data?.gold.map((item) => {
                        const isUp = item.change_value >= 0;

                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.symbol}>
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <Card
                                        sx={{
                                            borderRadius: 3,
                                            boxShadow: 4,
                                            background:
                                                theme.palette.mode === 'light' ? isUp
                                                    ? "linear-gradient(135deg, #fff8e1, #fffde7)"
                                                    : "linear-gradient(135deg, #ffebee, #fce4ec)" : {},
                                        }}
                                    >
                                        <CardContent>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {ln === "en" ? item.name_en : item.name}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={`${item.change_percent.toFixed(2)}%`.replace("-", "")}
                                                    color={isUp ? "success" : "error"}
                                                    icon={isUp ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                                                />
                                            </Stack>

                                            <Typography variant="h6" fontWeight="bold" mt={1}>
                                                {calcCoinPrice(item.symbol, item.price).toLocaleString()} {item.unit}
                                            </Typography>

                                            <Divider sx={{ my: 1 }} />
                                            <Stack width={1} direction={'row'} justifyContent={"space-between"}>
                                                <Typography variant="caption" color="text.secondary">
                                                    جواهرات کنعان | میلاد نور
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.time}
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>
        </>
    );
}
