import { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  MailOutline,
  LockOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const apiUrl = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3002"
  ).replace(/\/$/, "");

  // ── Fonction de login ──
  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      // 1. Envoyer email et password au backend
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // 2. Si le backend renvoie une erreur
      if (!response.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // 3. Si login réussi : stocker le token et les infos user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 4. Rediriger vers le dashboard
      navigate("/Dashbord");
    } catch (err) {
      setError("Cannot connect to server");
      setLoading(false);
    }
  };

  useEffect(() => {
    // Si un token existe déjà, rediriger vers le dashboard
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/Dashbord");
    }
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f5f5",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          bgcolor: "#fff",
          borderRadius: 3,
          boxShadow: "0 2px 24px 0 rgba(0,0,0,0.07)",
          px: 5,
          py: 6,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {/* Logo / Title */}
        <Box sx={{ textAlign: "center", mb: 1 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            letterSpacing={-0.5}
            color="text.primary"
          >
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Sign in to your account
          </Typography>
        </Box>

        {/* Message d'erreur */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Email */}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MailOutline sx={{ fontSize: 18, color: "text.disabled" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />

        {/* Password */}
        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined sx={{ fontSize: 18, color: "text.disabled" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <VisibilityOff sx={{ fontSize: 18 }} />
                    ) : (
                      <Visibility sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />

        {/* Submit */}
        <Button
          variant="contained"
          fullWidth
          disableElevation
          onClick={handleLogin}
          disabled={loading}
          sx={{
            borderRadius: 2,
            py: 1.2,
            fontWeight: 600,
            fontSize: 15,
            textTransform: "none",
            bgcolor: "#111",
            "&:hover": { bgcolor: "#333" },
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </Box>
    </Box>
  );
};
