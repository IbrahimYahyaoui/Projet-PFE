// frontend/src/pages/teams/TeamWorkload.tsx
import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { WorkloadBar } from "../../components/WorkloadBar";
import { RoleBadge } from "../../components/chips/RoleBadge";
import { EmptyState } from "../../components/EmptyState";

interface Member {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: number;
  assigned: number;
  resolved: number;
  chargePercent: number;
  availability: "available" | "busy" | "overloaded";
}

interface TeamData {
  team: { _id: string; name: string };
  members: Member[];
}

const AVAIL_COLOR = { available: C.success, busy: C.warning, overloaded: C.danger };

export default function TeamWorkload() {
  const [data,    setData]    = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<TeamData>("/api/team/my")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;
  if (!data)   return <EmptyState icon="chart-bar-2" title="Aucune équipe" />;

  const { team, members } = data;
  const sorted = [...members].sort((a, b) => b.chargePercent - a.chargePercent);

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <PageHeader title="Charge de travail" subtitle={`${team.name} — aide à l'assignation de tickets`} icon="chart-bar-2" />

      {/* Summary bar */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {[
          { label: "Disponibles",  count: members.filter(m => m.availability === "available").length,  color: C.success },
          { label: "Occupés",      count: members.filter(m => m.availability === "busy").length,       color: C.warning },
          { label: "Surchargés",   count: members.filter(m => m.availability === "overloaded").length, color: C.danger },
        ].map(s => (
          <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#fff", px: 2, py: 1.2, borderRadius: "10px", border: `1px solid ${C.border}` }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: s.color }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textPrimary }}><b>{s.count}</b> {s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Member cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 2.5 }}>
        {sorted.map((m) => {
          const aColor = AVAIL_COLOR[m.availability] ?? C.info;
          return (
            <Box key={m._id} sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "20px 22px", display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary }}>{m.name}</Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>{m.email}</Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
                  <RoleBadge role={m.role} size="sm" />
                  <Box sx={{ px: 1.2, py: 0.2, borderRadius: "20px", bgcolor: aColor + "18" }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: aColor }}>{m.chargePercent}% charge</Typography>
                  </Box>
                </Box>
              </Box>

              <WorkloadBar name="" active={m.active} assigned={m.assigned} availability={m.availability} />

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
                {[
                  { label: "Assignés", value: m.assigned, color: C.info },
                  { label: "Actifs",   value: m.active,   color: C.warning },
                  { label: "Résolus",  value: m.resolved, color: C.success },
                ].map(s => (
                  <Box key={s.label} sx={{ textAlign: "center", py: 1.5, borderRadius: "10px", bgcolor: C.bgPage }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 700, color: s.color }}>{s.value}</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, textTransform: "uppercase" }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>

      {members.length === 0 && <EmptyState icon="users" title="Aucun membre" />}
    </Box>
  );
}
