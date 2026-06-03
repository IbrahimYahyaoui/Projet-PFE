// frontend/src/pages/teams/TeamMembers.tsx
import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Avatar, Grid } from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { RoleBadge } from "../../components/chips/RoleBadge";
import { WorkloadBar } from "../../components/WorkloadBar";
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
  team: { name: string; tag: string };
  members: Member[];
}

const AVAIL_COLOR = { available: C.success, busy: C.warning, overloaded: C.danger };
const AVAIL_LABEL = { available: "Disponible", busy: "Occupé", overloaded: "Surchargé" };

const getInitials = (n: string) => n.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

export default function TeamMembers() {
  const [data, setData]       = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<TeamData>("/api/team/my")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;
  if (!data)   return <EmptyState icon="users-group" title="Aucune équipe" />;

  const { team, members } = data;

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <PageHeader title="Membres de l'équipe" subtitle={`${team.name} · ${members.length} membre(s)`} icon="users" />

      <Grid container spacing={2}>
        {members.map((m) => {
          const aColor = AVAIL_COLOR[m.availability] ?? C.info;
          const aLabel = AVAIL_LABEL[m.availability] ?? m.availability;
          return (
            <Grid item xs={12} sm={6} lg={4} key={m._id}>
              <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: 2.5, transition: "box-shadow 0.2s", "&:hover": { boxShadow: C.shadowMd } }}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ bgcolor: C.accent, width: 42, height: 42, fontSize: "14px", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                    {getInitials(m.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.name}
                    </Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.email}
                    </Typography>
                  </Box>
                  <RoleBadge role={m.role} size="sm" />
                </Box>

                {/* Stats */}
                <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                  {[
                    { label: "Assignés",  value: m.assigned },
                    { label: "Actifs",    value: m.active },
                    { label: "Résolus",   value: m.resolved },
                  ].map((s) => (
                    <Box key={s.label} sx={{ flex: 1, textAlign: "center", py: 1, borderRadius: "8px", bgcolor: C.bgPage }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "18px", fontWeight: 700, color: C.textPrimary }}>{s.value}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, textTransform: "uppercase" }}>{s.label}</Typography>
                    </Box>
                  ))}
                </Box>

                {/* Workload bar */}
                <WorkloadBar name="" active={m.active} assigned={m.assigned} availability={m.availability} />

                {/* Status badge */}
                <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
                  <Box sx={{ px: 1.2, py: 0.3, borderRadius: "20px", bgcolor: aColor + "18", border: `1px solid ${aColor}44` }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: aColor }}>{aLabel}</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {members.length === 0 && <EmptyState icon="users" title="Aucun membre" description="Cette équipe n'a pas encore de membres." />}
    </Box>
  );
}
