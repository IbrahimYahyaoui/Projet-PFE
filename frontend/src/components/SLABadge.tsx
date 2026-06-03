// frontend/src/components/SLABadge.tsx
import { Box, Typography, Tooltip } from "@mui/material";
import { C } from "../theme";

interface Props {
  slaDeadline: string | null;
  slaBreached: boolean;
  status: string;
}

const formatRemaining = (deadline: Date): string => {
  const diffMs   = deadline.getTime() - Date.now();
  if (diffMs <= 0) return "Dépassé";
  const totalMin = Math.floor(diffMs / 60000);
  if (totalMin < 60) return `${totalMin}m restantes`;
  const hours    = Math.floor(totalMin / 60);
  if (hours < 24) return `${hours}h restantes`;
  return `${Math.floor(hours / 24)}j restants`;
};

export const SLABadge = ({ slaDeadline, slaBreached, status }: Props) => {
  const resolved = ['resolved', 'closed'].includes(status);
  if (!slaDeadline || resolved) return null;

  const deadline = new Date(slaDeadline);
  const now      = Date.now();
  const diffMs   = deadline.getTime() - now;
  const isOver   = diffMs <= 0 || slaBreached;
  const isNear   = !isOver && diffMs < 2 * 3600000;

  const color = isOver ? C.danger : isNear ? C.warning : C.success;
  const bg    = isOver ? C.dangerBg : isNear ? C.warningBg : C.successBg;
  const icon  = isOver ? "alert-triangle" : isNear ? "clock-exclamation" : "clock";
  const label = isOver ? "SLA dépassé" : formatRemaining(deadline);

  return (
    <Tooltip title={`Échéance : ${deadline.toLocaleString('fr-FR')}`} arrow>
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.2, py: 0.4, borderRadius: "20px", bgcolor: bg, border: `1px solid ${color}44` }}>
        <Box component="i" className={`ti ti-${icon}`} sx={{ fontSize: 13, color }} />
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
};
