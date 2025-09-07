import DarkModeIcon from "@mui/icons-material/DarkMode";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FormatTextdirectionLToRIcon from "@mui/icons-material/FormatTextdirectionLToR";
import FormatTextdirectionRToLIcon from "@mui/icons-material/FormatTextdirectionRToL";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LabelIcon from "@mui/icons-material/Label";
import LightModeIcon from "@mui/icons-material/LightMode";
import SignInIcon from "@mui/icons-material/Login";
import MenuIcon from "@mui/icons-material/Menu";
import UsersIcon from "@mui/icons-material/People";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import SignUpIcon from "@mui/icons-material/SignLanguage";
import {
    AppBar,
    Box,
    CssBaseline,
    Divider,
    Drawer,
    IconButton,
    List, ListItemButton,
    ListItemIcon, ListItemText,
    Stack,
    Toolbar,
    Tooltip,
    Typography,
    useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import * as React from "react";
import { Outlet, Link as RouterLink, useLocation, useMatch } from "react-router-dom";
import { useUi } from "../ui/UiProvider";

const drawerWidth = 260;

type NavItem = { to: string; label: string; icon: React.ReactElement };

const NAV_ITEMS: NavItem[] = [
    { to: "/home", label: "Home", icon: <DashboardIcon /> },
    { to: "/products", label: "Products", icon: <Inventory2Icon /> },
    { to: "/scans", label: "Scans", icon: <QrCodeScannerIcon /> },
    { to: "/signin", label: "SignIn", icon: <SignInIcon /> },
    { to: "/signup", label: "SignUp", icon: <SignUpIcon /> },
    { to: "/tags", label: "Tags", icon: <LabelIcon /> },
    { to: "/users", label: "Users", icon: <UsersIcon /> },
] as const;


function ListItemLink({
    to,
    label,
    icon,
    onNavigate,
    exact = true,
}: NavItem & { onNavigate?: () => void; exact?: boolean }) {
    // Highlight when URL matches. Set exact=false to keep parent highlighted on child routes.
    const match = useMatch({ path: to, end: exact });

    return (
        <ListItemButton
            component={RouterLink}
            to={to}
            onClick={onNavigate}
            selected={!!match}
            sx={{
                "&.Mui-selected": (t) => ({
                    backgroundColor: t.palette.action.selected,
                }),
                "&.Mui-selected:hover": (t) => ({
                    backgroundColor: t.palette.action.selected,
                }),
            }}
        >
            <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
            <ListItemText primary={label} />
        </ListItemButton>
    );
}

// ---- Sidebar (memoized)
const Sidebar = React.memo(function Sidebar({
    items,
    onNavigate,
}: {
    items: NavItem[];
    onNavigate?: () => void;
}) {
    return (
        <Box role="navigation" sx={{ width: drawerWidth }}>
            <Toolbar />
            <Divider />
            <List>
                {items.map((item) => (
                    <ListItemLink key={item.to} {...item} onNavigate={onNavigate} />
                ))}
            </List>
        </Box>
    );
});

// ---- Header (memoized)
const Header = React.memo(function Header({
    onMenuClick,
}: {
    onMenuClick: () => void;
}) {
    const { mode, dir, toggleMode, toggleDir } = useUi();
    const theme = useTheme();
    const mdUp = useMediaQuery(theme.breakpoints.up("md"));

    return (
        <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
            <Toolbar>
                {!mdUp && (
                    <IconButton color="inherit" edge="start" onClick={onMenuClick} aria-label="menu">
                        <MenuIcon />
                    </IconButton>
                )}
                <Typography variant="h6" sx={{ flexGrow: 1, ml: mdUp ? 0 : 1 }}>
                    RFID Scanner
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
                        <IconButton color="inherit" onClick={toggleMode} aria-label="toggle color mode">
                            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={dir === "rtl" ? "Switch to LTR" : "Switch to RTL"}>
                        <IconButton color="inherit" onClick={toggleDir} aria-label="toggle direction">
                            {dir === "rtl" ? <FormatTextdirectionLToRIcon /> : <FormatTextdirectionRToLIcon />}
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Toolbar>
        </AppBar>
    );
});

export default function MainLayout() {
    const { dir } = useUi();
    const theme = useTheme();
    const mdUp = useMediaQuery(theme.breakpoints.up("md"));
    const [mobileOpen, setMobileOpen] = React.useState(false);

    // Close drawer when route changes (mobile)
    const location = useLocation();
    React.useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const drawerAnchor = dir === "rtl" ? "right" : "left";
    const drawer = <Sidebar items={NAV_ITEMS} onNavigate={() => setMobileOpen(false)} />;

    return (
        <Box sx={{ display: "flex", minHeight: "100dvh" }}>
            <CssBaseline />
            <Header onMenuClick={() => setMobileOpen((v) => !v)} />

            {/* Sidebar */}
            {!mdUp && (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    anchor={drawerAnchor}
                    ModalProps={{ keepMounted: true }}   // keep mounted for faster reopen on mobile
                    disableScrollLock
                    sx={{ "& .MuiDrawer-paper": { width: drawerWidth } }}
                >
                    {drawer}
                </Drawer>
            )}
            {mdUp && (
                <Drawer
                    variant="permanent"
                    anchor={drawerAnchor}
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        "& .MuiDrawer-paper": { boxSizing: "border-box" },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            )}

            {/* Content + Footer */}
            <Box component="main" sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                {/* Push content below AppBar */}
                <Toolbar />

                {/* Routed page content */}
                <Box sx={{ flex: 1, p: 0 }}>
                    <Outlet />
                </Box>

                {/* Footer */}
                <Box
                    component="footer"
                    sx={{
                        p: 2,
                        textAlign: "center",
                        color: "text.secondary",
                        borderTop: 1,
                        borderColor: "divider",
                    }}
                >
                    © {new Date().getFullYear()} RFID Scanner
                </Box>
            </Box>
        </Box>
    );
}