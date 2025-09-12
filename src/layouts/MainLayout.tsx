import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DashboardIcon from "@mui/icons-material/Dashboard";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LabelIcon from "@mui/icons-material/Label";
import LightModeIcon from "@mui/icons-material/LightMode";
import SignInIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import UsersIcon from "@mui/icons-material/People";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import SignUpIcon from "@mui/icons-material/SignLanguage";
import {
    AppBar,
    Avatar,
    Box,
    Button,
    CssBaseline,
    Divider,
    Drawer,
    IconButton,
    List, ListItemButton,
    ListItemText,
    Menu,
    MenuItem,
    ListItemIcon as MUIListItemIcon,
    Stack,
    Toolbar,
    Tooltip,
    Typography,
    useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import * as React from "react";
import { Outlet, Link as RouterLink, useLocation, useMatch, useNavigate } from "react-router-dom";
import { useLogout, useMe } from "../api/auth";
import { useUi } from "../providers/UiProvider";
import { useSocketStore } from "../store/socketStore";

const drawerWidth = 260;

type NavItem = { to: string; label: string; icon: React.ReactElement };

const NAV_ITEMS: NavItem[] = [
    { to: "/home", label: "Home", icon: <DashboardIcon /> },
    { to: "/products", label: "Products", icon: <Inventory2Icon /> },
    { to: "/scan-mode", label: "Scan Mode", icon: <QrCodeScannerIcon /> },
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
            <MUIListItemIcon sx={{ minWidth: 40 }}>{icon}</MUIListItemIcon>
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
const Header = React.memo(function Header({ onMenuClick }: { onMenuClick: () => void }) {
    const { mode, dir, toggleMode, toggleDir } = useUi();
    const theme = useTheme();
    const mdUp = useMediaQuery(theme.breakpoints.up("md"));

    const navigate = useNavigate();
    const logout = useLogout();
    const { data: me } = useMe();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleAvatarClick = (e: React.MouseEvent<HTMLElement>) => {
        if (!me) {
            navigate("/signin");
            return;
        }
        setAnchorEl(e.currentTarget);
    };
    const handleClose = () => setAnchorEl(null);

    const onLogout = async () => {
        try {
            await logout.mutateAsync(); // Wait for the logout mutation to finish
            // After logout completes, proceed with navigation
            handleClose();
            useSocketStore.getState().disconnect(true);
            navigate("/signin", { replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
            // Handle any errors from logout if needed
        }
    };

    const initials = React.useMemo(() => {
        if (!me?.email) return "U";
        const local = me.email.split("@")[0] || "";
        return (local.match(/[A-Za-z0-9]/g) || []).slice(0, 2).join("").toUpperCase() || "U";
    }, [me]);

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
                        <IconButton sx={{ width: 44, height: 44 }} color="inherit" onClick={toggleMode} aria-label="toggle color mode">
                            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={dir === "rtl" ? "Switch to LTR" : "Switch to RTL"}>
                        <IconButton sx={{ width: 44, height: 44 }} color="inherit" onClick={toggleDir} aria-label="toggle direction">
                            {dir === "rtl" ?
                                <Typography variant="body1" sx={{ fontWeight: "bold" }}>EN</Typography> :
                                <Typography variant="body1" sx={{ fontWeight: "bold" }}>FA</Typography>}
                        </IconButton>
                    </Tooltip>
                    <Divider orientation="vertical" flexItem />
                    {/* If NOT authenticated, show a Sign in button */}
                    {!me ? (
                        <Button color="inherit" onClick={() => navigate("/signin")}>Sign in</Button>
                    ) : (
                        <>
                            {/* Authenticated: avatar + menu */}
                            <Tooltip title={me?.email ?? "Account"}>
                                <IconButton
                                    onClick={handleAvatarClick}
                                    size="small"
                                    aria-controls={open ? "user-menu" : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={open ? "true" : undefined}
                                    sx={{ ml: 0.5, width: 44, height: 44 }}
                                >
                                    {me?.email ? (
                                        <Avatar sx={{ width: 44, height: 44 }}>{initials}</Avatar>
                                    ) : (
                                        <AccountCircleIcon />
                                    )}
                                </IconButton>
                            </Tooltip>

                            <Menu
                                anchorEl={anchorEl}
                                id="user-menu"
                                open={open && !!me}           // <-- only open when authed
                                onClose={handleClose}
                                onClick={handleClose}
                                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                                transformOrigin={{ horizontal: "right", vertical: "top" }}
                            >
                                <MenuItem disabled sx={{ opacity: 0.9 }}>
                                    <Avatar sx={{ width: 24, height: 24, fontSize: 12, mr: 1 }}>{initials}</Avatar>
                                    {me?.email}
                                </MenuItem>
                                <Divider />
                                <MenuItem onClick={onLogout} disabled={logout.isPending}>
                                    <LogoutIcon fontSize="small" style={{ marginRight: 8 }} />
                                    {logout.isPending ? "Signing out…" : "Sign out"}
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </Stack>
            </Toolbar>
        </AppBar>
    );
});


export default function MainLayout() {
    const theme = useTheme();
    const mdUp = useMediaQuery(theme.breakpoints.up("md"));
    const [mobileOpen, setMobileOpen] = React.useState(false);

    // Close drawer when route changes (mobile)
    const location = useLocation();
    React.useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

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