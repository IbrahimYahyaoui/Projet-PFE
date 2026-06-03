// frontend/src/components/chips/PriorityChip.tsx
import { Box, Typography } from "@mui/material";
import { priorityColors } from "../../theme";

const PRIORITY_LABELS: Record<string, string> = {
  low:      "Faible",
  medium:   "Moyen",
  high:     "Élevé",
  critical: "Critique",
};

const PRIORITY_ICONS: Record<string, string> = {
  low:      "ti-arrow-down",
  medium:   "ti-minus",
  high:     "ti-arrow-up",
  critical: "ti-flame",
};

interface Props {
  priority: string;
  size?: "sm" | "md";
}

export const PriorityChip = ({ priority, size = "md" }: Props) => {
  const colors = priorityColors[priority] ?? { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" };
  const label  = PRIORITY_LABELS[priority] ?? priority;
  const icon   = PRIORITY_ICONS[priority] ?? "ti-minus";

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: size === "sm" ? 1 : 1.2,
        py: size === "sm" ? 0.2 : 0.4,
        borderRadius: "20px",
        bgcolor: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <Box component="i" className={`ti ${icon}`} sx={{ fontSize: size === "sm" ? 11 : 13, color: colors.text }} />
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: size === "sm" ? "11px" : "12px", fontWeight: 600, color: colors.text, lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  );
};
