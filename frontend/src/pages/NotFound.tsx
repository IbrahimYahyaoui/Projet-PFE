import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        bgcolor: "#f5f5f5",
      }}
    >
      <Typography variant="h1" fontWeight={700} color="text.primary">
        404
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Page not found
      </Typography>
      <Button
        variant="contained"
        disableElevation
        onClick={() => navigate("/login")}
        sx={{
          mt: 1,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 600,
          bgcolor: "#111",
          "&:hover": { bgcolor: "#333" },
        }}
      >
        Back to login
      </Button>
    </Box>
  );
};
