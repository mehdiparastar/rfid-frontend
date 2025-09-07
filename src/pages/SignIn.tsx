import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    FormControlLabel,
    Checkbox,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress,
    Link as MuiLink,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

import { useLogin } from "../api/auth";
import { useAuth } from "../stores/auth";

// only store email (never password)
const REMEMBER_KEY = "rfid-remember-email";
const emailOk = (v: string) => /.+@.+\..+/.test(v);

export default function SignIn() {
    const navigate = useNavigate();
    const location = useLocation() as { state?: { from?: Location } };
    const setUser = useAuth((s) => s.setUser);

    const login = useLogin();

    const emailRef = React.useRef<HTMLInputElement>(null);
    const passRef = React.useRef<HTMLInputElement>(null);
    const rememberRef = React.useRef<HTMLInputElement>(null);

    const [showPassword, setShowPassword] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

    const defaultEmail = React.useMemo(() => {
        try {
            return localStorage.getItem(REMEMBER_KEY) || "";
        } catch {
            return "";
        }
    }, []);

    React.useEffect(() => {
        // focus password if email is prefilled, else email
        if (defaultEmail) passRef.current?.focus();
        else emailRef.current?.focus();
    }, [defaultEmail]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const email = (emailRef.current?.value || "").trim();
        const password = passRef.current?.value || "";
        const remember = !!rememberRef.current?.checked;

        if (!email) return setErrorMsg("Email is required");
        if (!emailOk(email)) return setErrorMsg("Enter a valid email");
        if (!password || password.length < 8)
            return setErrorMsg("Password must be at least 8 characters");

        setErrorMsg(null);

        // persist or clear remembered email (never store password)
        try {
            if (remember) localStorage.setItem(REMEMBER_KEY, email);
            else localStorage.removeItem(REMEMBER_KEY);
        } catch {
            /* ignore */
        }

        login.mutate(
            { email, password },
            {
                onSuccess: ({ user }) => {
                    // keep Zustand in sync (useLogin also primes ['me'] cache in our earlier code)
                    setUser(user);
                    const to =
                        (location.state?.from as any)?.pathname
                            ? (location.state!.from as any).pathname
                            : "/home";
                    navigate(to, { replace: true });
                },
                onError: (err: any) => {
                    setErrorMsg(err?.message || "Login failed");
                },
            }
        );
    };

    const submitting = login.isPending;

    return (
        <Box
            sx={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                px: 2,
                background:
                    "radial-gradient(1200px 600px at 10% -10%, rgba(25,118,210,.15), transparent), " +
                    "radial-gradient(1200px 600px at 110% 110%, rgba(156,39,176,.12), transparent)",
            }}
        >
            <Paper
                elevation={8}
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    p: { xs: 3, sm: 4 },
                    borderRadius: 3,
                    backdropFilter: "saturate(1.2) blur(4px)",
                }}
            >
                <Stack spacing={3}>
                    {/* Brand */}
                    <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="center">
                        <QrCodeScannerIcon fontSize="large" />
                        <Typography variant="h5" fontWeight={700}>
                            RFID Scanner
                        </Typography>
                    </Stack>

                    <Typography variant="h6" textAlign="center">
                        Sign in
                    </Typography>

                    {(errorMsg || login.error) && (
                        <Alert severity="error" variant="outlined">
                            {errorMsg || (login.error as Error).message}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <Stack spacing={2.2}>
                            <TextField
                                inputRef={emailRef}
                                label="Email"
                                type="email"
                                autoComplete="email"
                                fullWidth
                                defaultValue={defaultEmail}
                                disabled={submitting}
                            />

                            <TextField
                                inputRef={passRef}
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                fullWidth
                                disabled={submitting}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                    onClick={() => setShowPassword((v) => !v)}
                                                    edge="end"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />

                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                                <FormControlLabel
                                    control={<Checkbox size="small" inputRef={rememberRef} defaultChecked={!!defaultEmail} />}
                                    label="Remember me"
                                />
                                <MuiLink component={RouterLink} to="/forgot-password" underline="hover">
                                    Forgot password?
                                </MuiLink>
                            </Stack>

                            <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ py: 1.2 }}>
                                {submitting ? (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <CircularProgress size={20} />
                                        <span>Signing in…</span>
                                    </Stack>
                                ) : (
                                    "Sign in"
                                )}
                            </Button>
                        </Stack>
                    </form>

                    <Typography variant="body2" textAlign="center" color="text.secondary">
                        Don’t have an account?{" "}
                        <MuiLink component={RouterLink} to="/signup" underline="hover">
                            Sign up
                        </MuiLink>
                    </Typography>

                    <Typography variant="caption" color="text.secondary" textAlign="center">
                        Secure session via httpOnly cookies. Dark/RTL ready.
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
}
