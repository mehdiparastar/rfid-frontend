import { Box, Card, CardContent, Chip, CircularProgress, Divider, Grid, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useGoldCurrency } from "../../api/goldCurrency";
import { useSocketStore } from "../../store/socketStore";
import type { GoldProductSUBType } from "../../store/useProductFormStore";
import { translate } from "../../utils/translate";

const calcCoinPrice = (symbol: GoldProductSUBType, pricePerGeram: number) => {
    if (symbol === "IR_COIN_EMAMI") return Math.floor(pricePerGeram * 8.133)
    if (symbol === "IR_COIN_BAHAR") return Math.floor(pricePerGeram * 8.133)
    if (symbol === "IR_COIN_HALF") return Math.floor(pricePerGeram * 4.066)
    if (symbol === "IR_COIN_QUARTER") return Math.floor(pricePerGeram * 2.033)
    if (symbol === "IR_COIN_1G") return Math.floor(pricePerGeram * 1.01)
    if (symbol === "IR_PCOIN_1-5G") return Math.floor(pricePerGeram * 1.50)
    if (symbol === "IR_PCOIN_1-4G") return Math.floor(pricePerGeram * 1.40)
    if (symbol === "IR_PCOIN_1-3G") return Math.floor(pricePerGeram * 1.30)
    if (symbol === "IR_PCOIN_1-2G") return Math.floor(pricePerGeram * 1.20)
    if (symbol === "IR_PCOIN_1-1G") return Math.floor(pricePerGeram * 1.10)
    if (symbol === "IR_PCOIN_1G") return Math.floor(pricePerGeram * 1.00)
    if (symbol === "IR_PCOIN_900MG") return Math.floor(pricePerGeram * 0.90)
    if (symbol === "IR_PCOIN_800MG") return Math.floor(pricePerGeram * 0.80)
    if (symbol === "IR_PCOIN_700MG") return Math.floor(pricePerGeram * 0.70)
    if (symbol === "IR_PCOIN_600MG") return Math.floor(pricePerGeram * 0.60)
    if (symbol === "IR_PCOIN_500MG") return Math.floor(pricePerGeram * 0.50)
    if (symbol === "IR_PCOIN_400MG") return Math.floor(pricePerGeram * 0.40)
    if (symbol === "IR_PCOIN_300MG") return Math.floor(pricePerGeram * 0.30)
    if (symbol === "IR_PCOIN_200MG") return Math.floor(pricePerGeram * 0.20)
    if (symbol === "IR_PCOIN_100MG") return Math.floor(pricePerGeram * 0.10)
    if (symbol === "IR_PCOIN_70MG") return Math.floor(pricePerGeram * 0.070)
    if (symbol === "IR_PCOIN_50MG") return Math.floor(pricePerGeram * 0.050)
    if (symbol === "IR_PCOIN_30MG") return Math.floor(pricePerGeram * 0.030)
    if (symbol === "IR_GOLD_MELTED") return Math.floor(pricePerGeram * 4.3318)
    if (symbol === "XAUUSD") return Math.floor(pricePerGeram * 28.3495)
    return Math.floor(pricePerGeram)
}
export default function GoldPriceDashboard() {
    const theme = useTheme()
    const isLg = useMediaQuery(theme.breakpoints.up("lg"));

    const ln = theme.direction === "ltr" ? "en" : "fa"
    const t = translate(ln)!
    const isConnected = useSocketStore((s) => s.isConnected)
    const { data, isLoading, isError } = useGoldCurrency();

    const mainItem = data?.gold.find(el => el.symbol === "IR_GOLD_18K")
    const restItems = data?.gold.filter(el => el.symbol !== "IR_GOLD_18K")
    const [rest_firstFourItems, rest_remainItems] = [restItems?.slice(0, 4), restItems?.slice(4)];

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
                {
                    isLg && mainItem && rest_firstFourItems &&
                    <Grid container spacing={2}>
                        {
                            [mainItem].map((item) => {
                                const isUp = item.base === "T";
                                return (
                                    <Grid
                                        size={6}
                                        key={item.symbol}
                                    >
                                        <motion.div
                                            style={{ height: '100%' }}
                                            whileHover={{ scale: 1.03 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            <Card
                                                sx={{
                                                    height: 1,
                                                    borderRadius: 3,
                                                    boxShadow: 4,
                                                    background:
                                                        theme.palette.mode === 'light' ? isUp
                                                            ? "linear-gradient(135deg, #fff8e1, #fffde7)"
                                                            : "linear-gradient(135deg, #ffebee, #fce4ec)" : {},
                                                }}
                                            >
                                                <CardContent sx={{ height: 1 }}>
                                                    <Stack height={1} direction={'column'} justifyContent={'space-between'}>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="h2" fontWeight="bold">
                                                                {ln === "en" ? item.name_en : item.name}
                                                            </Typography>
                                                            <Chip
                                                                size="medium"
                                                                label={item.base === "B" ? "بورس" : "تابان گوهر"}
                                                                color={isUp ? "success" : "error"}
                                                            />
                                                        </Stack>
                                                        <Box>
                                                            <Typography variant="h3" fontWeight="bold" mt={4}>
                                                                {calcCoinPrice(item.symbol, item.price).toLocaleString()} {item.unit}
                                                            </Typography>

                                                            <Divider sx={{ my: 1 }} />
                                                            <Stack width={1} direction={'row'} justifyContent={"space-between"}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {item.timeTaban} {item.dateTaban} {"(تابان گوهر)"}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {item.time} {item.date} {"(بورس)"}
                                                                </Typography>
                                                            </Stack>
                                                        </Box>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    </Grid>
                                );
                            })
                        }
                        <Grid container size={6}>
                            {
                                rest_firstFourItems.map((item) => {
                                    const isUp = item.base === "T";
                                    return (
                                        <Grid
                                            spacing={2}
                                            size={6}
                                            key={item.symbol}
                                        >
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
                                                                label={item.base === "B" ? "بورس" : "تابان گوهر"}
                                                                color={isUp ? "success" : "error"}
                                                            />
                                                        </Stack>

                                                        <Typography variant="h6" fontWeight="bold" mt={1}>
                                                            {calcCoinPrice(item.symbol, item.price).toLocaleString()} {item.unit}
                                                        </Typography>

                                                        <Divider sx={{ my: 1 }} />
                                                        <Stack width={1} direction={'row'} justifyContent={"space-between"}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {item.timeTaban} {item.dateTaban} {"(تابان گوهر)"}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {item.time} {item.date} {"(بورس)"}
                                                            </Typography>
                                                        </Stack>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        </Grid>
                                    );
                                })
                            }
                        </Grid>
                        {
                            rest_remainItems?.map((item) => {
                                const isUp = item.base === "T";
                                return (
                                    <Grid
                                        size={3}
                                        key={item.symbol}
                                    >
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
                                                            label={item.base === "B" ? "بورس" : "تابان گوهر"}
                                                            color={isUp ? "success" : "error"}
                                                        />
                                                    </Stack>

                                                    <Typography variant="h6" fontWeight="bold" mt={1}>
                                                        {calcCoinPrice(item.symbol, item.price).toLocaleString()} {item.unit}
                                                    </Typography>

                                                    <Divider sx={{ my: 1 }} />
                                                    <Stack width={1} direction={'row'} justifyContent={"space-between"}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {item.timeTaban} {item.dateTaban} {"(تابان گوهر)"}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {item.time} {item.date} {"(بورس)"}
                                                        </Typography>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    </Grid>
                                );
                            })
                        }
                    </Grid>
                }
                {!isLg && <Grid container spacing={2}>
                    {data?.gold.map((item) => {
                        const isUp = item.base === "T";
                        return (
                            <Grid
                                size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                                key={item.symbol}
                            >
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
                                                    label={item.base === "B" ? "بورس" : "تابان گوهر"}
                                                    color={isUp ? "success" : "error"}
                                                />
                                            </Stack>

                                            <Typography variant="h6" fontWeight="bold" mt={1}>
                                                {calcCoinPrice(item.symbol, item.price).toLocaleString()} {item.unit}
                                            </Typography>

                                            <Divider sx={{ my: 1 }} />
                                            <Stack width={1} direction={'row'} justifyContent={"space-between"}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.timeTaban} {item.dateTaban} {"(تابان گوهر)"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.time} {item.date} {"(بورس)"}
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </Grid>}
            </Box>
        </>
    );
}
