// frontend/src/pages/teams/TeamDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Select, MenuItem } from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { getCurrentUser } from "../../hooks/useAuth";
import { PageHeader } from "../../components/PageHeader";
import { KpiCard } from "../../components/KpiCard";
import { EmptyState } from "../../components/EmptyState";
import { WorkloadBar } from "../../components/WorkloadBar";

interface TeamData {
  team: { _id: string; name: string; category: string; tag: string; color: string };
  members: { _id: string; name: string; active: number; assigned: number; availability: string }[];
  stats: { totalTickets: number; openTickets: number; inProgress: number; waiting: number; resolved: number; slaBreached: number; totalMembers: number };
}

export default function TeamDashboard() {
  const navigate = useNavigate();
  const user     = getCurrentUser();
  const role     = user?.role ?? "user";

  const [data,           setData]           = useState<TeamData | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [allTeams,       setAllTeams]       = useState<{ _id: string; name: string }[]>([]);

  // Initial load
  useEffect(() => {
    if (role === "admin") {
      api.get<any[]>("/api/team/all")
        .then((teams) => {
          const list = Array.isArray(teams) ? teams : [];
          setAllTeams(list.map((t: any) => ({ _id: t._id, name: t.name })));
          if (list.length > 0) {
            setSelectedTeamId(list[0]._id);
          } else {
            setLoading(false);
          }
        })
        .catch((err) => { console.error(err); setLoading(false); });
    } else {
      api.get<TeamData>("/api/team/my")
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [role]);

  // Admin: reload when selected team changes
  useEffect(() => {
    if (role !== "admin" || !selectedTeamId) return;
    setLoading(true);
    api.get<TeamData>(`/api/team/${selectedTeamId}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedTeamId, role]);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;
  if (!data)   return <EmptyState icon="users" title="Aucune équipe" description="Vous n'êtes membre d'aucune équipe pour le moment." />;

  const { team, stats, members } = data;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <PageHeader
        title={team.name}
        subtitle={`Catégorie : ${team.category} · Tag : ${team.tag}`}
        icon="users"
        actions={[
          { label: "Tickets équipe", icon: "ticket",      onClick: () => navigate("/teams/tickets") },
          { label: "Charge",         icon: "chart-bar-2", onClick: () => navigate("/teams/workload"), variant: "outlined" },
        ]}
      />

      {/* Admin team selector */}
      {role === "admin" && (
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textMuted }}>
            Équipe sélectionnée :
          </Typography>
          <Select
            size="small"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            sx={{ fontFamily: "Inter, sans-serif", borderRadius: "10px", minWidth: 200, fontSize: "13px" }}
          >
            {allTeams.map(t => (
              <MenuItem key={t._id} value={t._id} sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
      )}

      {/* KPIs */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }, gap: 2, mb: 3 }}>
        {[
          { label: "Total tickets", value: stats.totalTickets, icon: "ticket",           color: C.accent,  bg: C.accentLight,           tag: "Total" },
          { label: "Ouverts",       value: stats.openTickets,  icon: "inbox",            color: C.info,    bg: C.infoBg,                tag: "En attente" },
          { label: "En cours",      value: stats.inProgress,   icon: "rotate-clockwise", color: C.warning, bg: C.warningBg,             tag: "Actifs" },
          { label: "Résolus",       value: stats.resolved,     icon: "check",            color: C.success, bg: C.successBg,             tag: "Terminés" },
          { label: "SLA dépassé",   value: stats.slaBreached,  icon: "alert",            color: C.danger,  bg: C.dangerBg,              tag: "Urgent" },
          { label: "Membres",       value: stats.totalMembers, icon: "users",            color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", tag: "Équipe" },
        ].map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} tagColor={kpi.color} tagBg={kpi.bg} />
        ))}
      </Box>

      {/* Workload overview */}
      <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: 2.5, mb: 3 }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, mb: 2 }}>
          Charge de travail — aperçu
        </Typography>
        {members.length === 0
          ? <EmptyState icon="users" title="Aucun membre" />
          : members.map((m) => (
            <WorkloadBar key={m._id} name={m.name} active={m.active} assigned={m.assigned} availability={m.availability as any} />
          ))
        }
      </Box>

      {/* Quick actions */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        {[
          { label: "Voir les membres",    path: "/teams/members",   icon: "users",       color: C.accent },
          { label: "Tickets de l'équipe", path: "/teams/tickets",   icon: "ticket",      color: C.info },
          { label: "Analytiques",         path: "/teams/analytics", icon: "chart-donut", color: "#8B5CF6" },
        ].map((a) => (
          <Box
            key={a.label}
            onClick={() => navigate(a.path)}
            sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.2, bgcolor: "#fff", borderRadius: "10px", border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.15s", "&:hover": { borderColor: a.color, boxShadow: C.shadow } }}
          >
            <Box component="i" className={`ti ti-${a.icon}`} sx={{ fontSize: 16, color: a.color }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 500, color: C.textPrimary }}>{a.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
