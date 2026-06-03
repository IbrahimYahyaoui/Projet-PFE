// frontend/src/components/WorkloadBar.tsx
import { Box, Typography, Tooltip } from "@mui/material";
import { C } from "../theme";

interface Props {
  name: string;
  active: number;
  assigned: number;
  availability: "available" | "busy" | "overloaded";
}

const AVAIL_COLOR: Record<string, string> = {
  available:  C.success,
  busy:       C.warning,
  overloaded: C.danger,
};
const AVAIL_LABEL: Record<string, string> = {
  available:  "Disponible",
  busy:       "Occupé",
  overloaded: "Surchargé",
};

export const WorkloadBar = ({ name, active, assigned, availability }: Props) => {
  const pct   = assigned > 0 ? Math.round((active / assigned) * 100) : 0;
  const color = AVAIL_COLOR[availability] ?? C.info;

  return (
    <Tooltip title={`${active} actifs / ${assigned} assignés`} arrow>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textPrimary, width: 120, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </Typography>
        <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: C.border, overflow: "hidden" }}>
          <Box sx={{ height: "100%", width: `${Math.min(pct, 100)}%`, bgcolor: color, borderRadius: 3, transition: "width 0.4s ease" }} />
        </Box>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color, width: 72, flexShrink: 0 }}>
          {AVAIL_LABEL[availability]}
        </Typography>
      </Box>
    </Tooltip>
  );
};
