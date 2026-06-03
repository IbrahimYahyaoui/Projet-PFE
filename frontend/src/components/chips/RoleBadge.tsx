// frontend/src/components/chips/RoleBadge.tsx
import { Box, Typography } from "@mui/material";
import { roleColors } from "../../theme";

const ROLE_LABELS: Record<string, string> = {
  admin:  "Admin",
  leader: "Leader",
  tech:   "Technicien",
  user:   "Employé",
};

interface Props {
  role: string;
  size?: "sm" | "md";
}

export const RoleBadge = ({ role, size = "md" }: Props) => {
  const colors = roleColors[role] ?? { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" };
  const label  = ROLE_LABELS[role] ?? role;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: size === "sm" ? 0.9 : 1.2,
        py: size === "sm" ? 0.2 : 0.35,
        borderRadius: "6px",
        bgcolor: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: size === "sm" ? "10px" : "11px", fontWeight: 700, color: colors.text, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  );
};
