import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Link,
} from "@mui/material";
import { Visibility, VisibilityOff, MailOutline, LockOutlined } from "@mui/icons-material";

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

        {/* Forgot password */}
        {/* <Box sx={{ textAlign: "right", mt: -1.5 }}>
          <Link
            href="#"
            underline="hover"
            variant="caption"
            color="text.secondary"
          >
            Forgot password?
          </Link>
        </Box> */}

        {/* Submit */}
        <Button
          variant="contained"
          fullWidth
          disableElevation
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
          Sign in
        </Button>

        {/* Sign up
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Don&apos;t have an account?{" "}
          <Link href="#" underline="hover" color="text.primary" fontWeight={600}>
            Sign up
          </Link>
        </Typography> */}
      </Box>
    </Box>
  );
};
