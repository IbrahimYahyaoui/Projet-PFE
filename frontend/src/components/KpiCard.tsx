// frontend/src/components/KpiCard.tsx
import { Box, Typography } from "@mui/material";
import { C } from "../theme";

interface Props {
  label: string;
  value: number | string;
  icon: string;           // Tabler icon name e.g. "ticket"
  color: string;
  bg: string;
  tag?: string;
  tagColor?: string;
  tagBg?: string;
  onClick?: () => void;
}

export const KpiCard = ({ label, value, icon, color, bg, tag, tagColor, tagBg, onClick }: Props) => (
  <Box
    onClick={onClick}
    sx={{
      bgcolor: "#fff",
      borderRadius: "14px",
      border: `1px solid ${C.border}`,
      p: "20px 22px",
      transition: "all 0.2s",
      cursor: onClick ? "pointer" : "default",
      "&:hover": onClick ? { boxShadow: C.shadowMd, transform: "translateY(-2px)" } : {},
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1.3 }}>
        {label}
      </Typography>
      <Box sx={{ width: 38, height: 38, borderRadius: "11px", bgcolor: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box component="i" className={`ti ti-${icon}`} sx={{ fontSize: 20, color }} />
      </Box>
    </Box>
    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "32px", fontWeight: 700, color, lineHeight: 1, mt: 1.5, mb: 0.5 }}>
      {value}
    </Typography>
    {tag && (
      <Box sx={{ display: "inline-flex", bgcolor: tagBg, borderRadius: "20px", px: 1.2, py: 0.4 }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: tagColor }}>
          {tag}
        </Typography>
      </Box>
    )}
  </Box>
);
