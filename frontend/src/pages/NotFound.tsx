// frontend/src/pages/NotFound.tsx
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { Home as HomeIcon, ArrowBack as BackIcon } from "@mui/icons-material";
import { C } from "../theme";

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: C.bgPage,
        fontFamily: "Inter, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        textAlign: "center",
        px: 3,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Cercles décoratifs */}
      <Box sx={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", border: `1px solid ${C.accent}15`, top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", border: `1px solid ${C.accent}20`, top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", border: `1px solid ${C.accent}25`, top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />

      {/* 404 */}
      <Typography
        sx={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontSize: { xs: "7rem", md: "11rem" },
          lineHeight: 1,
          background: `linear-gradient(135deg, ${C.accent} 0%, ${C.navy} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          mb: 2,
          letterSpacing: "-0.04em",
          userSelect: "none",
        }}
      >
        404
      </Typography>

      {/* Icône */}
      <Box sx={{ width: 64, height: 64, borderRadius: "16px", backgroundColor: C.accentLight, border: `1px solid ${C.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", mb: 3, fontSize: "2rem" }}>
        🎫
      </Box>

      {/* Texte */}
      <Typography variant="h5" sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary, mb: 1.5 }}>
        Page introuvable
      </Typography>
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.95rem", color: C.textMuted, maxWidth: 400, lineHeight: 1.7, mb: 4 }}>
        La page que vous recherchez n'existe pas ou a été déplacée.
        Retournez au tableau de bord pour continuer.
      </Typography>

      {/* Boutons */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
        <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate(-1)}
          sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, borderColor: C.border, color: C.textSecondary, borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { borderColor: C.accent, color: C.accent, backgroundColor: C.accentLight } }}>
          Retour
        </Button>
        {/* ✅ /Dashbord au lieu de /dashboard */}
        <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate("/Dashbord")}
          sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, backgroundColor: C.accent, color: C.navy, borderRadius: "10px", textTransform: "none", px: 3, boxShadow: `0 4px 20px ${C.accent}40`, "&:hover": { backgroundColor: C.accentHover, boxShadow: `0 6px 24px ${C.accent}60` } }}>
          Tableau de bord
        </Button>
      </Box>

      {/* Footer */}
      <Typography sx={{ position: "absolute", bottom: 24, fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: C.textMuted }}>
        TuskFlow — Tuskens © {new Date().getFullYear()}
      </Typography>
    </Box>
  );
};