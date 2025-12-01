import {
    AttachMoney,
    EmojiEvents,
    Groups,
    Inventory2,
    LocalAtm,
    MonitorWeight,
    TrendingUp
} from "@mui/icons-material";
import {
    Avatar,
    Box,
    Card,
    CardContent,
    Grid,
    LinearProgress,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useTheme
} from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip
} from "recharts";
import { useSalesStats, type PeriodType } from "../../api/sales";
import { useSocketStore } from "../../store/socketStore";
import { getIRRCurrency } from "../../utils/getIRRCurrency";
import { translate } from "../../utils/translate";

export default function Dashboard() {
    const theme = useTheme();
    const ln = theme.direction === "ltr" ? "en" : "fa";
    const t = translate(ln) as any;
    const isConnected = useSocketStore((s) => s.isConnected);
    const [period, setPeriod] = useState<PeriodType>("year");
    const [repType, setRepType] = useState<"weight" | "weightPlusMakingChargeBuy">("weight");

    const { data, isLoading, isError } = useSalesStats(period);

    const COLORS = ["#FFD700", "#F57C00", "#8D6E63", "#FFB300", "#A1887F", "#D4AF37"];

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, []);

    if (isError)
        return (
            <Box textAlign="center" p={3}>
                <Typography color="error">{t["Failed to fetch dashboard data."]}</Typography>
            </Box>
        );

    const totals = data?.totals;
    const groupByTypes = data?.groupByTypes || [];
    const groupBySubTypes = data?.groupBySubTypes || [];

    return (
        <>
            {isLoading ? <LinearProgress /> : <Box sx={{ width: 1, bgcolor: isConnected ? "green" : "red", height: 5 }} />}
            <Box sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight={700}>
                        {t["Gold Shop Management Dashboard"]}
                    </Typography>

                    <ToggleButtonGroup
                        exclusive
                        value={period}
                        onChange={(_, val) => val && setPeriod(val)}
                        sx={{ direction: "ltr" }}
                    >
                        <ToggleButton value="day">{t["Daily"]}</ToggleButton>
                        <ToggleButton value="month">{t["Monthly"]}</ToggleButton>
                        <ToggleButton value="6months">{t["6 Months"]}</ToggleButton>
                        <ToggleButton value="year">{t["Yearly"]}</ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                {/* === KPI Summary Cards === */}
                <Grid container spacing={2} mt={2}>
                    {totals && [
                        {
                            title: t["Number of Sold Items"],
                            value: totals.totalSoldQuantity,
                            icon: <TrendingUp />,
                            color: "linear-gradient(135deg, #81C784, #388E3C)",
                        },
                        {
                            title: t["Sales Amount"],
                            value: getIRRCurrency(totals.totalSoldPrice),
                            icon: <TrendingUp />,
                            color: "linear-gradient(135deg, #81C784, #388E3C)",
                        },
                        {
                            title: t["Profit"],
                            value: getIRRCurrency(totals.totalSoldProfitPrice),
                            icon: <AttachMoney />,
                            color: "linear-gradient(135deg, #A5D6A7, #2E7D32)",
                        },
                        {
                            title: t["Vat"],
                            value: getIRRCurrency(totals.totalSoldVatPrice),
                            icon: <LocalAtm />,
                            color: "linear-gradient(135deg, #EF9A9A, #C62828)",
                        },
                        {
                            title: t["Making Charge Buy"],
                            value: getIRRCurrency(totals.totalSoldMakingChargeBuyPrice),
                            icon: <Inventory2 />,
                            color: "linear-gradient(135deg, #FFF176, #FBC02D)",
                        },
                        {
                            title: t["Sold Gold Weight (g)"],
                            value: `${t["Physical"]}: ${Number(totals.totalSoldWeight || 0).toFixed(2)} ${t["(g)"]}`,
                            value2: `${t["With Making Charge Buy"]}: ${Number(totals.totalSoldWeightPlusMakingChargeBuy || 0).toFixed(2)} ${t["(g)"]}`,
                            icon: <MonitorWeight />,
                            color: "linear-gradient(135deg, #90CAF9, #1565C0)",
                        },
                        {
                            title: t["Available Gold Weight (g)"],
                            value: `${t["Physical"]}: ${Number(totals.totalAvailableWeight || 0).toFixed(2)} ${t["(g)"]}`,
                            value2: `${t["With Making Charge Buy"]}: ${Number(totals.totalAvailableWeightPlusMakingChargeBuy || 0).toFixed(2)} ${t["(g)"]}`,
                            icon: <MonitorWeight />,
                            color: "linear-gradient(135deg, #90CAF9, #1565C0)",
                        },
                        {
                            title: t["New Customers"],
                            value: `${data.newCustomersCount || 0} ${t["customer"]}`,
                            icon: <Groups />,
                            color: "linear-gradient(135deg, #64B5F6, #1E88E5)",
                        },
                    ].map((item, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
                            <motion.div whileHover={{ scale: 1.03 }}>
                                <Card
                                    sx={{
                                        borderRadius: 4,
                                        background: item.color,
                                        color: "#fff",
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                                        minHeight: 120
                                    }}
                                >
                                    <CardContent>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Avatar
                                                sx={{
                                                    bgcolor: "rgba(255,255,255,0.2)",
                                                    width: 48,
                                                    height: 48,
                                                }}
                                            >
                                                {item.icon}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body1" fontWeight={600} mb={1}>
                                                    {item.title}
                                                </Typography>
                                                <Typography variant="body1" fontWeight={400}>
                                                    {item.value}
                                                </Typography>
                                                <Typography variant="body1" fontWeight={400}>
                                                    {item.value2}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>

                {/* === Gold Sold by Type (Pie) === */}
                <Grid container spacing={2} mt={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ p: 2, borderRadius: 4 }}>
                            <Typography variant="h6" mb={2}>
                                {t["Sold Gold Weight by Gold Type"]}
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={groupByTypes.map((el) => ({
                                            name: t[el.type],
                                            value: el.totalSoldWeight,
                                        }))}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={110}
                                        label={({ name, percent, x, y }) => (
                                            <text
                                                x={x}
                                                y={y}
                                                fill="#968f8fff"
                                                textAnchor="start"
                                                dominantBaseline="central"
                                                fontSize={12}
                                            >
                                                {`${name} ${((percent as number) * 100).toFixed(0)}%`}
                                            </text>
                                        )}
                                    >
                                        {groupByTypes.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => `${typeof (val) === "string" ? val : Number(val).toFixed(2)} ${t["(g)"]}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ p: 2, borderRadius: 4 }}>
                            <Typography variant="h6" mb={2}>
                                {t["Sold Gold Weight by Gold Sub Type"]}
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={groupBySubTypes.map((el) => ({
                                            name: t[el.subType],
                                            value: el.totalSoldWeight,
                                        }))}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={110}
                                        label={({ name, percent, x, y }) => (
                                            <text
                                                x={x}
                                                y={y}
                                                fill="#968f8fff"
                                                textAnchor="start"
                                                dominantBaseline="central"
                                                fontSize={12}
                                            >
                                                {`${name} ${((percent as number) * 100).toFixed(0)}%`}
                                            </text>
                                        )}
                                    >
                                        {groupByTypes.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => `${typeof (val) === "string" ? val : Number(val).toFixed(2)} ${t["(g)"]}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Grid>

                    {/* === Available Gold Stock by Type === */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ p: 2, borderRadius: 4 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">
                                    {t["Available Gold Weight by Gold Type"]}
                                </Typography>
                                <ToggleButtonGroup
                                    size="small"
                                    exclusive
                                    value={repType}
                                    onChange={(_, val) => val && setRepType(val)}
                                    sx={{ direction: "ltr" }}
                                >
                                    <ToggleButton value="weight">{t["Physical"]}</ToggleButton>
                                    <ToggleButton value="weightPlusMakingChargeBuy">{t["With Making Charge Buy"]}</ToggleButton>
                                </ToggleButtonGroup>
                            </Stack>
                            {groupByTypes.map((g, i) => {
                                const total = repType === "weight" ? g.totalWeight || 0 : g.totalWeightPlusMakingChargeBuy || 0;
                                const available = repType === "weight" ? g.totalAvailableWeight || 0 : g.totalAvailableWeightPlusMakingChargeBuy;
                                const percent = total ? (available / total) * 100 : 0;

                                return (
                                    <Box
                                        key={i}
                                        mb={2}
                                        p={1.5}
                                        borderRadius={2}
                                        sx={{
                                            bgcolor: theme.palette.action.hover,
                                            boxShadow: 1,
                                            transition: "0.2s",
                                            "&:hover": { boxShadow: 3, transform: "scale(1.01)" },
                                        }}
                                    >
                                        {/* --- Header: Type + Percent --- */}
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {t[g.type]}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {percent.toFixed(1)}%
                                            </Typography>
                                        </Stack>

                                        {/* --- Progress bar --- */}
                                        <LinearProgress
                                            variant="determinate"
                                            value={percent}
                                            sx={{
                                                height: 10,
                                                borderRadius: 3,
                                                backgroundColor: theme.palette.grey[300],
                                                "& .MuiLinearProgress-bar": {
                                                    backgroundColor: COLORS[i % COLORS.length],
                                                },
                                            }}
                                        />

                                        {/* --- Footer: Available / Total --- */}
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            mt={0.5}
                                        >
                                            <Typography variant="caption" color="text.secondary">
                                                {t["Available"]}: {available.toFixed(2)} {t["(g)"]}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {t["total"]}: {total.toFixed(2)} {t["(g)"]}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Card>
                    </Grid>

                    {/* === Available Gold Stock by SubType === */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ p: 2, borderRadius: 4 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">
                                    {t["Available Gold Weight by Gold Sub Type"]}
                                </Typography>
                                <ToggleButtonGroup
                                    size="small"
                                    exclusive
                                    value={repType}
                                    onChange={(_, val) => val && setRepType(val)}
                                    sx={{ direction: "ltr" }}
                                >
                                    <ToggleButton value="weight">{t["Physical"]}</ToggleButton>
                                    <ToggleButton value="weightPlusMakingChargeBuy">{t["With Making Charge Buy"]}</ToggleButton>
                                </ToggleButtonGroup>
                            </Stack>
                            {groupBySubTypes.map((g, i) => {
                                const total = repType === "weight" ? g.totalWeight || 0 : g.totalWeightPlusMakingChargeBuy || 0;
                                const available = repType === "weight" ? g.totalAvailableWeight || 0 : g.totalAvailableWeightPlusMakingChargeBuy;
                                const percent = total ? (available / total) * 100 : 0;

                                return (
                                    <Box
                                        key={i}
                                        mb={2}
                                        p={1.5}
                                        borderRadius={2}
                                        sx={{
                                            bgcolor: theme.palette.action.hover,
                                            boxShadow: 1,
                                            transition: "0.2s",
                                            "&:hover": { boxShadow: 3, transform: "scale(1.01)" },
                                        }}
                                    >
                                        {/* --- Header: Type + Percent --- */}
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {t[g.subType]}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {percent.toFixed(1)}%
                                            </Typography>
                                        </Stack>

                                        {/* --- Progress bar --- */}
                                        <LinearProgress
                                            variant="determinate"
                                            value={percent}
                                            sx={{
                                                height: 10,
                                                borderRadius: 3,
                                                backgroundColor: theme.palette.grey[300],
                                                "& .MuiLinearProgress-bar": {
                                                    backgroundColor: COLORS[i % COLORS.length],
                                                },
                                            }}
                                        />

                                        {/* --- Footer: Available / Total --- */}
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            mt={0.5}
                                        >
                                            <Typography variant="caption" color="text.secondary">
                                                {t["Available"]}: {available.toFixed(2)} {t["(g)"]}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {t["total"]}: {total.toFixed(2)} {t["(g)"]}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Card>
                    </Grid>
                </Grid>

                {/* === Top Customers === */}
                <Card sx={{ mt: 3, p: 2, borderRadius: 4 }}>
                    <Typography variant="h6" mb={2}>
                        {t["Top Customers"]} ({period === "day" ? t["Daily"] : period === "month" ? t["Monthly"] : period === "6months" ? t["6 Months"] : t["Yearly"]})
                    </Typography>

                    <Stack spacing={1}>
                        {data?.topCustomers.map((c, i) => (
                            <motion.div key={i} whileHover={{ scale: 1.02 }}>
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    p={1.5}
                                    borderRadius={2}
                                    sx={{
                                        bgcolor:
                                            i === 0
                                                ? "rgba(255,215,0,0.15)"
                                                : i === 1
                                                    ? "rgba(192,192,192,0.15)"
                                                    : i === 2
                                                        ? "rgba(205,127,50,0.15)"
                                                        : "background.paper",
                                    }}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Avatar sx={{ bgcolor: "background.default" }}>
                                            <EmojiEvents
                                                sx={{
                                                    color:
                                                        i === 0
                                                            ? "#FFD700"
                                                            : i === 1
                                                                ? "#C0C0C0"
                                                                : i === 2
                                                                    ? "#CD7F32"
                                                                    : "#9e9e9e",
                                                }}
                                            />
                                        </Avatar>
                                        <Typography>{c.name}</Typography>
                                    </Stack>
                                    <Typography fontWeight={600}>
                                        {getIRRCurrency(c.totalSpent)}
                                    </Typography>
                                </Box>
                            </motion.div>
                        ))}
                    </Stack>
                </Card>
            </Box>
        </>
    );
}








































// import {
//     Box,
//     Card,
//     CardContent,
//     Typography,
//     Grid,
//     ToggleButton,
//     ToggleButtonGroup,
//     useTheme,
//     Avatar,
//     Stack,
//     LinearProgress,
//     CircularProgress,
// } from "@mui/material";
// import { motion } from "framer-motion";
// import {
//     BarChart,
//     Bar,
//     PieChart,
//     Pie,
//     Tooltip,
//     XAxis,
//     YAxis,
//     ResponsiveContainer,
//     Cell,
// } from "recharts";
// import { useEffect, useState } from "react";
// import { useSocketStore } from "../../store/socketStore";
// import { translate } from "../../utils/translate";
// import {
//     TrendingUp,
//     LocalAtm,
//     AttachMoney,
//     Groups,
//     Star,
//     MonitorWeight,
// } from "@mui/icons-material";
// import { useSales, useSalesStats, type PeriodType } from "../../api/sales";
// import { getIRRCurrency } from "../../utils/getIRRCurrency";

// export default function Dashboard() {
//     const theme = useTheme();
//     const ln = theme.direction === "ltr" ? "en" : "fa";
//     const t = translate(ln)!;
//     const isConnected = useSocketStore((s) => s.isConnected);

//     const [period, setPeriod] = useState<PeriodType>("year");
//     const [salesData, setSalesData] = useState<any[]>([]);
//     const [goldData, setGoldData] = useState<any[]>([]);
//     const [topCustomers, setTopCustomers] = useState<any[]>([]);

//     const { data, isLoading, isError } = useSalesStats(period);


//     useEffect(() => {
//         window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
//         // Mock data fetching (replace with API calls)
//         setSalesData([
//             { name: "شنبه", sales: 24000000, cost: 12000000, profit: 8400000 },
//             { name: "یک‌شنبه", sales: 18000000, cost: 9000000, profit: 6300000 },
//             { name: "دوشنبه", sales: 32000000, cost: 15000000, profit: 11900000 },
//             { name: "سه‌شنبه", sales: 28000000, cost: 14000000, profit: 9800000 },
//         ]);

//         setGoldData([
//             { name: "طلای ۱۸ عیار", value: 240 },
//             { name: "طلای ۲۴ عیار", value: 160 },
//             { name: "طلای سفید", value: 80 },
//             { name: "طلای رزگلد", value: 50 },
//         ]);

//         setTopCustomers([
//             { name: "علی محمدی", total: 85000000 },
//             { name: "سارا کریمی", total: 74000000 },
//             { name: "مهدی رستگار", total: 60000000 },
//             { name: "نگار شریفی", total: 58000000 },
//         ]);
//     }, [period]);

//     const COLORS = ["#fbc02d", "#f57c00", "#8d6e63", "#ffd54f"];

//     if (isLoading)
//         return (
//             <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
//                 <CircularProgress />
//             </Box>
//         );

//     if (isError)
//         return (
//             <Box textAlign="center" p={3}>
//                 <Typography color="error">{t["Failed to fetch dashboard data."]}</Typography>
//             </Box>
//         );

//     return (
//         <>
//             <Box sx={{ width: 1, bgcolor: isConnected ? 'green' : 'red', height: 5 }} />
//             <Box sx={{ p: 3 }}>
//                 <Stack direction="row" justifyContent="space-between" alignItems="center">
//                     <Typography variant="h5" fontWeight={700}>
//                         داشبورد مدیریت طلا فروشی
//                     </Typography>

//                     <ToggleButtonGroup
//                         exclusive
//                         value={period}
//                         onChange={(_, val) => val && setPeriod(val)}
//                         sx={{ direction: "ltr" }}
//                     >
//                         <ToggleButton value="day">روزانه</ToggleButton>
//                         <ToggleButton value="month">ماهانه</ToggleButton>
//                         <ToggleButton value="6months">شش ماهه</ToggleButton>
//                         <ToggleButton value="year">سالانه</ToggleButton>
//                     </ToggleButtonGroup>
//                 </Stack>

//                 {/* --- Summary Cards --- */}
//                 {data &&
//                     <Grid container spacing={2} mt={2}>
//                         {[
//                             {
//                                 icon: <TrendingUp fontSize="large" color="success" />,
//                                 title: "میزان فروش",
//                                 value: getIRRCurrency(data?.totalSoldPrice),
//                             },
//                             {
//                                 icon: <LocalAtm fontSize="large" color="error" />,
//                                 title: "هزینه‌های جاری",
//                                 value: "۳۴,۰۰۰,۰۰۰ ریال",
//                             },
//                             {
//                                 icon: <AttachMoney fontSize="large" color="primary" />,
//                                 title: "مجموع اجرت ساخت",
//                                 value: getIRRCurrency(data.totalMakingChargeBuy),
//                             },
//                             {
//                                 icon: <AttachMoney fontSize="large" color="primary" />,
//                                 title: "مجموع سود",
//                                 value: getIRRCurrency(data.totalProfit),
//                             },
//                             {
//                                 icon: <AttachMoney fontSize="large" color="primary" />,
//                                 title: "مجموع مالیات",
//                                 value: getIRRCurrency(data.totalVat),
//                             },
//                             {
//                                 icon: <MonitorWeight fontSize="large" color="primary" />,
//                                 title: "مجموع وزن",
//                                 value: `${Number(data.totalWeight).toFixed(2)} گرم`,
//                             },
//                             {
//                                 icon: <Groups fontSize="large" color="info" />,
//                                 title: "مشتریان جدید",
//                                 value: "۲۴ نفر",
//                             },
//                         ].map((item, i) => (
//                             <Grid size={{ xs: 12, sm: 6, md: 3, }} key={i}>
//                                 <motion.div whileHover={{ scale: 1.03 }}>
//                                     <Card sx={{ borderRadius: 4, textAlign: "center" }}>
//                                         <CardContent>
//                                             <Avatar
//                                                 sx={{
//                                                     bgcolor: theme.palette.background.default,
//                                                     width: 48,
//                                                     height: 48,
//                                                     mx: "auto",
//                                                     mb: 1,
//                                                 }}
//                                             >
//                                                 {item.icon}
//                                             </Avatar>
//                                             <Typography variant="subtitle1">{item.title}</Typography>
//                                             <Typography variant="h6" fontWeight={700}>
//                                                 {item.value}
//                                             </Typography>
//                                         </CardContent>
//                                     </Card>
//                                 </motion.div>
//                             </Grid>
//                         ))}
//                     </Grid>
//                 }
//                 {/* --- Sales / Cost / Profit Chart --- */}
//                 <Card sx={{ mt: 3, p: 2, borderRadius: 4 }}>
//                     <Typography variant="h6" mb={2}>
//                         میزان فروش، هزینه و سود ({period === "day" ? "روزانه" : period === "month" ? "ماهانه" : period === "6months" ? "شش ماهه" : "سالانه"})
//                     </Typography>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <BarChart data={salesData}>
//                             <XAxis dataKey="name" />
//                             <YAxis />
//                             <Tooltip />
//                             <Bar dataKey="sales" fill="#4caf50" name="فروش" />
//                             <Bar dataKey="cost" fill="#e53935" name="هزینه" />
//                             <Bar dataKey="profit" fill="#2196f3" name="سود" />
//                         </BarChart>
//                     </ResponsiveContainer>
//                 </Card>

//                 {/* --- Gold Distribution --- */}
//                 <Grid container spacing={2} mt={2}>
//                     <Grid size={{ xs: 12, md: 6, }}>
//                         <Card sx={{ p: 2, borderRadius: 4 }}>
//                             <Typography variant="h6" mb={2}>
//                                 طلای فروخته‌شده به تفکیک نوع طلا
//                             </Typography>
//                             <ResponsiveContainer width="100%" height={300}>
//                                 <PieChart>
//                                     <Pie
//                                         data={goldData}
//                                         dataKey="value"
//                                         nameKey="name"
//                                         cx="50%"
//                                         cy="50%"
//                                         outerRadius={100}
//                                         label
//                                     >
//                                         {goldData.map((entry, index) => (
//                                             <Cell key={index} fill={COLORS[index % COLORS.length]} />
//                                         ))}
//                                     </Pie>
//                                     <Tooltip />
//                                 </PieChart>
//                             </ResponsiveContainer>
//                         </Card>
//                     </Grid>

//                     <Grid size={{ xs: 12, sm: 6, }}>
//                         <Card sx={{ p: 2, borderRadius: 4 }}>
//                             <Typography variant="h6" mb={2}>
//                                 طلای موجود به تفکیک نوع طلا
//                             </Typography>
//                             {goldData.map((g, i) => (
//                                 <Box key={i} mb={1}>
//                                     <Typography variant="body2" mb={0.3}>
//                                         {g.name}
//                                     </Typography>
//                                     <LinearProgress
//                                         variant="determinate"
//                                         value={(g.value / 300) * 100}
//                                         sx={{ height: 8, borderRadius: 2 }}
//                                     />
//                                 </Box>
//                             ))}
//                         </Card>
//                     </Grid>
//                 </Grid>

//                 {/* --- Top Customers --- */}
//                 <Card sx={{ mt: 3, p: 2, borderRadius: 4 }}>
//                     <Typography variant="h6" mb={2}>
//                         مشتریان برتر ({period === "day" ? "روزانه" : period === "month" ? "ماهانه" : period === "6months" ? "شش ماهه" : "سالانه"})
//                     </Typography>
//                     <Stack spacing={1}>
//                         {data?.topCustomers.map((c, i) => (
//                             <Box
//                                 key={i}
//                                 display="flex"
//                                 justifyContent="space-between"
//                                 alignItems="center"
//                                 p={1.5}
//                                 borderRadius={2}
//                                 sx={{
//                                     bgcolor: i === 0 ? "rgba(255,215,0,0.15)" : "background.paper",
//                                 }}
//                             >
//                                 <Stack direction="row" spacing={1} alignItems="center">
//                                     <Avatar>
//                                         <Star color={i === 0 ? "warning" : "disabled"} />
//                                     </Avatar>
//                                     <Typography>{c.name}</Typography>
//                                 </Stack>
//                                 <Typography fontWeight={600}>
//                                     {getIRRCurrency(c.totalSpent)}
//                                 </Typography>
//                             </Box>
//                         ))}
//                     </Stack>
//                 </Card>
//             </Box>
//         </>
//     );
// }
