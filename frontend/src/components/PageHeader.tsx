// frontend/src/components/PageHeader.tsx
import { Box, Typography, Button } from "@mui/material";
import { C } from "../theme";

interface Action {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: "contained" | "outlined";
  color?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  actions?: Action[];
}

export const PageHeader = ({ title, subtitle, icon, iconColor = C.accent, iconBg = C.accentLight, actions = [] }: Props) => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      {icon && (
        <Box sx={{ width: 40, height: 40, borderRadius: "12px", bgcolor: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Box component="i" className={`ti ti-${icon}`} sx={{ fontSize: 20, color: iconColor }} />
        </Box>
      )}
      <Box>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mt: 0.3 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
    {actions.length > 0 && (
      <Box sx={{ display: "flex", gap: 1 }}>
        {actions.map((a) => (
          <Button
            key={a.label}
            onClick={a.onClick}
            variant={a.variant ?? "contained"}
            startIcon={a.icon ? <Box component="i" className={`ti ti-${a.icon}`} sx={{ fontSize: 16 }} /> : undefined}
            sx={{
              bgcolor: a.variant === "outlined" ? "transparent" : (a.color ?? C.accent),
              color: a.variant === "outlined" ? (a.color ?? C.accent) : "#fff",
              border: a.variant === "outlined" ? `1.5px solid ${a.color ?? C.accent}` : "none",
              borderRadius: "10px",
              textTransform: "none",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              px: 2,
              "&:hover": { bgcolor: a.variant === "outlined" ? C.accentLight : (a.color ?? C.accentHover) },
            }}
          >
            {a.label}
          </Button>
        ))}
      </Box>
    )}
  </Box>
);
