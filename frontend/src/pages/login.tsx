import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Checkbox,
  FormControlLabel,
  Alert,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { C } from "../theme";

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/Dashbord");
  }, [navigate]);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/Dashbord");
    } catch {
      setError("Cannot connect to server");
      setLoading(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      bgcolor: "#FFFFFF",
      fontSize: 14,
      color: C.navy,
      fontFamily: "Inter, sans-serif",
      "& fieldset": { borderColor: C.border, borderWidth: 1.5 },
      "&:hover fieldset": { borderColor: C.accent },
      "&.Mui-focused fieldset": {
        borderColor: C.accent,
        boxShadow: `0 0 0 3px ${C.accentLight}`,
      },
    },
    "& .MuiInputLabel-root": {
      fontSize: 13,
      color: C.textMuted,
      fontFamily: "Inter, sans-serif",
    },
    "& .MuiInputLabel-root.Mui-focused": { color: C.accent },
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      "@media (max-width: 900px)": { gridTemplateColumns: "1fr" },
    }}>

      {/* ══════ LEFT SIDE — Photo ══════ */}
      <Box sx={{
        position: "relative",
        overflow: "hidden",
        "@media (max-width: 900px)": { display: "none" },
      }}>
        {/* Background photo */}
        <Box sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(11,22,44,0.3) 0%, rgba(11,22,44,0.75) 100%)",
          },
        }} />

        {/* Logo en haut gauche */}
        <Box sx={{ position: "absolute", top: 32, left: 32, display: "flex", alignItems: "center", gap: 1.5, zIndex: 2 }}>
          <Box sx={{ width: 44, height: 44, background: "linear-gradient(135deg, #1E3A5F, #152D4A)", borderRadius: "12px", border: "1px solid rgba(42,74,122,0.8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="28" height="28" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="6" width="34" height="10" rx="5" fill="white"/>
              <path d="M 16,16 L 16,30 C 16,37 20,41 28,44 C 24,41 20,36 20,29 L 20,16 Z" fill="white"/>
            </svg>
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "baseline" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "22px", color: "#FFFFFF", lineHeight: 1, letterSpacing: "-0.5px" }}>Tusk</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "22px", color: "#60A5FA", lineHeight: 1, letterSpacing: "-0.5px" }}>Flow</Typography>
            </Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "9px", fontWeight: 500, color: "#5FC2BA", letterSpacing: "0.18em", mt: 0.2 }}>TUSKENS MEA</Typography>
          </Box>
        </Box>

        {/* Text en bas gauche */}
        <Box sx={{
          position: "absolute",
          bottom: 48, left: 40,
          right: 40,
          zIndex: 2,
        }}>
          <Typography
            fontWeight={700}
            color="#FFFFFF"
            fontFamily="Inter, sans-serif"
            sx={{
              fontSize: "2.2rem",
              lineHeight: 1.2,
              mb: 1.5,
              letterSpacing: "-0.5px",
            }}
          >
            Manage your support
            <br />
            tickets efficiently
          </Typography>
          <Typography
            fontSize={14}
            color="rgba(255,255,255,0.75)"
            fontFamily="Inter, sans-serif"
            sx={{ mb: 3, lineHeight: 1.6 }}
          >
            Track, prioritize, and resolve issues faster
            <br />
            than ever before with TicketFlow.
          </Typography>

          {/* Stats */}
          <Box sx={{ display: "flex", gap: 2 }}>
            {[
              { value: "10K+", label: "Users" },
              { value: "50K+", label: "Tickets resolved" },
              { value: "99%", label: "Satisfaction" },
            ].map((stat) => (
              <Box
                key={stat.label}
                sx={{
                  px: 2, py: 1.5,
                  borderRadius: "10px",
                  bgcolor: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  textAlign: "center",
                  minWidth: 90,
                }}
              >
                <Typography
                  fontSize={18}
                  fontWeight={700}
                  color={C.accent}
                  fontFamily="Inter, sans-serif"
                >
                  {stat.value}
                </Typography>
                <Typography
                  fontSize={11}
                  color="rgba(255,255,255,0.65)"
                  fontFamily="Inter, sans-serif"
                >
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ══════ RIGHT SIDE — Form ══════ */}
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#FFFFFF",
        px: { xs: 3, md: 6 },
        py: 6,
      }}>
        <Box sx={{ width: "100%", maxWidth: 400 }}>

          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              fontWeight={700}
              color={C.navy}
              fontFamily="Inter, sans-serif"
              sx={{ letterSpacing: "-0.5px", mb: 0.5 }}
            >
              Welcome Back!
            </Typography>
            <Typography
              fontSize={14}
              color={C.textMuted}
              fontFamily="Inter, sans-serif"
            >
              Sign in to your TicketFlow account
            </Typography>
          </Box>

          {/* Error */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: "10px",
                fontSize: 13,
                fontFamily: "Inter, sans-serif",
                bgcolor: C.dangerBg,
                color: C.danger,
                border: `1px solid ${C.danger}30`,
                "& .MuiAlert-icon": { color: C.danger },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Email */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              fontSize={13}
              fontWeight={500}
              color={C.navy}
              fontFamily="Inter, sans-serif"
              sx={{ mb: 0.8 }}
            >
              Your Email
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="your@company.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              sx={inputSx}
            />
          </Box>

          {/* Password */}
          <Box sx={{ mb: 2 }}>
            <Typography
              fontSize={13}
              fontWeight={500}
              color={C.navy}
              fontFamily="Inter, sans-serif"
              sx={{ mb: 0.8 }}
            >
              Password
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: C.textMuted }}
                    >
                      {showPassword
                        ? <VisibilityOff sx={{ fontSize: 18 }} />
                        : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />
          </Box>

          {/* Remember me + Forgot */}
          <Box sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: C.border,
                    "&.Mui-checked": { color: C.accent },
                    p: 0.5,
                  }}
                />
              }
              label={
                <Typography
                  fontSize={13}
                  color={C.textSecondary}
                  fontFamily="Inter, sans-serif"
                >
                  Remember Me
                </Typography>
              }
            />
            <Typography
              fontSize={13}
              color={C.accent}
              fontFamily="Inter, sans-serif"
              sx={{
                cursor: "pointer",
                fontWeight: 500,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Forgot Password?
            </Typography>
          </Box>

          {/* Login Button */}
          <Button
            fullWidth
            variant="contained"
            disableElevation
            onClick={handleLogin}
            disabled={loading}
            sx={{
              bgcolor: C.navy,
              color: "#FFFFFF",
              borderRadius: "10px",
              py: 1.5,
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              textTransform: "none",
              letterSpacing: 0.3,
              mb: 2,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: C.accent,
                transform: "translateY(-1px)",
                boxShadow: `0 8px 20px rgba(95,194,186,0.35)`,
              },
              "&:disabled": { opacity: 0.6 },
            }}
          >
            {loading ? "Signing in..." : "Login"}
          </Button>

          {/* Footer */}
          <Box sx={{
            mt: 4,
            pt: 3,
            borderTop: `1px solid ${C.border}`,
            textAlign: "center",
          }}>
            <Typography
              fontSize={12}
              color={C.textMuted}
              fontFamily="Inter, sans-serif"
            >
              © 2026 TicketFlow • Internal Platform
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};