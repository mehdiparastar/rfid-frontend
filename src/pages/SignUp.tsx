import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useRegister } from "../api/auth";  // make sure you have this hook (snippet below)

const emailOk = (v: string) => /.+@.+\..+/.test(v);
// same rule as backend DTO: at least 1 letter + 1 digit
const passOk = (v: string) => /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(v);

export default function SignUp() {
  const navigate = useNavigate();
  const registerMut = useRegister();

  const emailRef = React.useRef<HTMLInputElement>(null);
  const passRef = React.useRef<HTMLInputElement>(null);
  const confirmRef = React.useRef<HTMLInputElement>(null);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = (emailRef.current?.value || "").trim();
    const password = passRef.current?.value || "";
    const confirm = confirmRef.current?.value || "";

    if (!email) return setErrorMsg("Email is required");
    if (!emailOk(email)) return setErrorMsg("Enter a valid email");
    if (!passOk(password))
      return setErrorMsg(
        "Password must be 8–72 chars and include at least one letter and one number"
      );
    if (password !== confirm) return setErrorMsg("Passwords do not match");

    setErrorMsg(null);

    registerMut.mutate(
      { email, password },
      {
        onSuccess: () => {
          // server already issued cookies; keep client in sync and go home
          navigate("/home", { replace: true });
        },
        onError: (err: any) => {
          setErrorMsg(err?.message || "Registration failed");
        },
      }
    );
  };

  const submitting = registerMut.isPending;

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
            Create your account
          </Typography>

          {(errorMsg || registerMut.error) && (
            <Alert severity="error" variant="outlined">
              {errorMsg || (registerMut.error as Error).message}
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
                disabled={submitting}
              />

              <TextField
                inputRef={passRef}
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

              <TextField
                inputRef={confirmRef}
                label="Confirm password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                fullWidth
                disabled={submitting}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                          onClick={() => setShowConfirm((v) => !v)}
                          edge="end"
                          tabIndex={-1}
                        >
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ py: 1.2 }}>
                {submitting ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={20} />
                    <span>Creating account…</span>
                  </Stack>
                ) : (
                  "Sign up"
                )}
              </Button>
            </Stack>
          </form>

          <Typography variant="body2" textAlign="center" color="text.secondary">
            Already have an account?{" "}
            <MuiLink component={RouterLink} to="/signin" underline="hover">
              Sign in
            </MuiLink>
          </Typography>

          <Typography variant="caption" color="text.secondary" textAlign="center">
            We’ll sign you in automatically after creating your account.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
