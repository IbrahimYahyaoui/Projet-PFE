// frontend/src/components/chips/StatusChip.tsx
import { Box, Typography } from "@mui/material";
import { statusColors } from "../../theme";

const STATUS_LABELS: Record<string, string> = {
  open:        "Ouvert",
  pending:     "En attente équipe",
  assigned:    "Assigné",
  in_progress: "En cours",
  waiting:     "En attente",
  resolved:    "Résolu",
  closed:      "Fermé",
};

interface Props {
  status: string;
  size?: "sm" | "md";
}

export const StatusChip = ({ status, size = "md" }: Props) => {
  const colors = statusColors[status] ?? { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" };
  const label  = STATUS_LABELS[status] ?? status;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        px: size === "sm" ? 1 : 1.2,
        py: size === "sm" ? 0.2 : 0.4,
        borderRadius: "20px",
        bgcolor: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: colors.text, flexShrink: 0 }} />
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: size === "sm" ? "11px" : "12px", fontWeight: 600, color: colors.text, lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  );
};
