import { useState, useEffect } from "react";
import {
  Box, Button, TextField, Typography, IconButton, Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "Login failed"); setLoading(false); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/Dashbord");
    } catch {
      setError("Cannot connect to server");
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/Dashbord");
  }, [navigate]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", position: "relative", overflow: "hidden", bgcolor: "#1C1410" }}>
      {/* Background */}
      <Box
        sx={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1920&q=80")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          "&::after": {
            content: '""',
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "linear-gradient(135deg, rgba(28,20,16,0.95) 0%, rgba(28,20,16,0.7) 50%, rgba(36,26,18,0.6) 100%)",
          },
        }}
      />

      {/* Left Side */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", px: 8, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 2, bgcolor: "#F59E0B",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "rotate(10deg)" },
            }}
          >
            <Typography fontSize={18} fontWeight={800} color="#1C1410">TF</Typography>
          </Box>
          <Typography fontSize={20} fontWeight={700} color="#FEF3C7" letterSpacing={2} sx={{ textTransform: "uppercase" }}>
            TicketFlow
          </Typography>
        </Box>

        {/* Title */}
        <Typography
          fontWeight={800} color="#FEF3C7"
          sx={{ fontSize: { xs: 36, md: 52 }, lineHeight: 1.1, mb: 2, textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
        >
          Smart Ticket
          <br />
          <Box component="span" sx={{ color: "#F59E0B" }}>Management</Box>
        </Typography>

        <Typography fontSize={18} fontWeight={500} color="rgba(254,243,199,0.8)" sx={{ mb: 1, maxWidth: 400 }}>
          Where Every Issue Gets Resolved.
        </Typography>
        <Typography fontSize={14} color="rgba(254,243,199,0.5)" sx={{ maxWidth: 380 }}>
          Streamline your workflow with AI-powered ticket tracking, smart assignment, and real-time collaboration.
        </Typography>
      </Box>

      {/* Right Side - Form */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", px: 4, position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            width: 400,
            backdropFilter: "blur(20px)",
            bgcolor: "rgba(36,26,18,0.85)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 4,
            px: 5, py: 6,
            display: "flex", flexDirection: "column", gap: 2.5,
          }}
        >
          <Box sx={{ mb: 1 }}>
            <Typography variant="h5" fontWeight={700} color="#FEF3C7" mb={0.5}>Welcome back</Typography>
            <Typography fontSize={14} color="rgba(254,243,199,0.5)">Sign in to your account</Typography>
          </Box>

          {error && (
            <Alert severity="error"
              sx={{ borderRadius: 2, bgcolor: "rgba(198,40,40,0.15)", color: "#ff8a80", border: "1px solid rgba(198,40,40,0.3)", "& .MuiAlert-icon": { color: "#ff8a80" } }}
            >
              {error}
            </Alert>
          )}

          {/* Email */}
          <Box>
            <Typography fontSize={13} fontWeight={600} color="#FEF3C7" mb={0.8}>Email</Typography>
            <TextField
              placeholder="Enter your email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} fullWidth size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2, bgcolor: "rgba(28,20,16,0.8)", color: "#FEF3C7",
                  "& fieldset": { borderColor: "rgba(245,158,11,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(245,158,11,0.4)" },
                  "&.Mui-focused fieldset": { borderColor: "#F59E0B" },
                },
                "& .MuiOutlinedInput-input::placeholder": { color: "rgba(254,243,199,0.3)", opacity: 1 },
              }}
            />
          </Box>

          {/* Password */}
          <Box>
            <Typography fontSize={13} fontWeight={600} color="#FEF3C7" mb={0.8}>Password</Typography>
            <TextField
              placeholder="Enter your password" type={showPassword ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)} fullWidth size="small"
              slotProps={{
                input: {
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small" tabIndex={-1} sx={{ color: "rgba(254,243,199,0.4)" }}>
                      {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2, bgcolor: "rgba(28,20,16,0.8)", color: "#FEF3C7",
                  "& fieldset": { borderColor: "rgba(245,158,11,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(245,158,11,0.4)" },
                  "&.Mui-focused fieldset": { borderColor: "#F59E0B" },
                },
                "& .MuiOutlinedInput-input::placeholder": { color: "rgba(254,243,199,0.3)", opacity: 1 },
              }}
            />
          </Box>

          {/* Button */}
          <Button
            variant="contained" fullWidth disableElevation onClick={handleLogin} disabled={loading}
            sx={{
              mt: 1, borderRadius: 2, py: 1.3, fontWeight: 700, fontSize: 15,
              textTransform: "uppercase", letterSpacing: 1.5,
              bgcolor: "#F59E0B", color: "#1C1410",
              "&:hover": { bgcolor: "#D97706", boxShadow: "0 8px 20px rgba(245,158,11,0.4)" },
              "&:disabled": { bgcolor: "rgba(245,158,11,0.3)", color: "rgba(28,20,16,0.5)" },
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <Typography fontSize={12} color="rgba(254,243,199,0.3)" textAlign="center" mt={1}>
            Powered by TicketFlow AI
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};