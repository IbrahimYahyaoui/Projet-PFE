// frontend/src/components/EmptyState.tsx
import { Box, Typography, Button } from "@mui/material";
import { C } from "../theme";

interface Props {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon = "inbox", title, description, actionLabel, onAction }: Props) => (
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, px: 4, textAlign: "center" }}>
    <Box sx={{ width: 64, height: 64, borderRadius: "18px", bgcolor: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", mb: 2.5 }}>
      <Box component="i" className={`ti ti-${icon}`} sx={{ fontSize: 32, color: C.accent }} />
    </Box>
    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: 600, color: C.textPrimary, mb: 1 }}>
      {title}
    </Typography>
    {description && (
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, maxWidth: 360, lineHeight: 1.6 }}>
        {description}
      </Typography>
    )}
    {actionLabel && onAction && (
      <Button
        onClick={onAction}
        variant="contained"
        sx={{ mt: 3, bgcolor: C.accent, borderRadius: "10px", textTransform: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, px: 3, "&:hover": { bgcolor: C.accentHover } }}
      >
        {actionLabel}
      </Button>
    )}
  </Box>
);
