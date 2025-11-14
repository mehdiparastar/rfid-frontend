import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { Box, Card, CardContent, Chip, CircularProgress, Divider, Grid, Stack, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { useGoldCurrency } from "../../api/goldCurrency";
import { useSocketStore } from "../../store/socketStore";
import { translate } from "../../utils/translate";

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
                        const chartData = Array.from({ length: 10 }, (_, idx) => ({
                            name: idx,
                            value: item.price + (Math.random() - 0.5) * item.change_value * 10, // mock trend
                        }));

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
                                                {item.price.toLocaleString()} {item.unit}
                                            </Typography>

                                            <Divider sx={{ my: 1 }} />

                                            <Box height={60}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={chartData}>
                                                        <Line
                                                            type="monotone"
                                                            dataKey="value"
                                                            stroke={isUp ? "#2e7d32" : "#c62828"}
                                                            strokeWidth={2}
                                                            dot={false}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </Box>
                                            <Stack width={1} direction={'row'} justifyContent={"space-between"}>
                                                <Typography variant="caption" color="text.secondary">
                                                    جواهرات کنعان | میلاد نور
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.symbol}
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
