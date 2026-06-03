// frontend/src/components/PeriodSelector.tsx
import { Box, Typography } from "@mui/material";
import { C } from "../theme";

const OPTIONS = [
  { label: "7j",  value: "7" },
  { label: "30j", value: "30" },
  { label: "90j", value: "90" },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export const PeriodSelector = ({ value, onChange }: Props) => (
  <Box sx={{ display: "flex", gap: 0.5, bgcolor: C.bgPage, borderRadius: "10px", p: 0.5, border: `1px solid ${C.border}` }}>
    {OPTIONS.map((opt) => {
      const active = value === opt.value;
      return (
        <Box
          key={opt.value}
          onClick={() => onChange(opt.value)}
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: "8px",
            cursor: "pointer",
            bgcolor: active ? "#fff" : "transparent",
            boxShadow: active ? C.shadow : "none",
            transition: "all 0.15s",
          }}
        >
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: active ? 600 : 400, color: active ? C.textPrimary : C.textMuted }}>
            {opt.label}
          </Typography>
        </Box>
      );
    })}
  </Box>
);
