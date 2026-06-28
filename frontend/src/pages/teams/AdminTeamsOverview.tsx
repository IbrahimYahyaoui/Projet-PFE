// frontend/src/pages/teams/AdminTeamsOverview.tsx
import { useState, useEffect } from "react";
import {
  Box, Typography, Dialog, DialogTitle, DialogContent,
  IconButton, Tabs, Tab, LinearProgress,
  CircularProgress, Button,
} from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { RoleBadge } from "../../components/chips/RoleBadge";
import { EmptyState } from "../../components/EmptyState";
import { UserAvatar } from "../../components/UserAvatar";

// ─── Types ───────────────────────────────────────────────────────────────────
interface TeamSummary {
  _id: string;
  name: string;
  description: string;
  category: string;
  tag: string;
  color: string;
  leaderId: { _id: string; name: string; email: string; role: string } | null;
  members: { _id: string }[];
  stats: { total: number; active: number; members: number; slaBreached: number; open?: number; resolved?: number };
}

interface MemberDetail {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  assigned: number;
  active: number;
  resolved: number;
  chargePercent: number;
  availability: "available" | "busy" | "overloaded";
}

interface TeamDetail {
  team: { _id: string; name: string; category: string; tag: string; color: string; leaderId: any };
  members: MemberDetail[];
  stats: { totalTickets: number; openTickets: number; inProgress: number; resolved: number; slaBreached: number };
}

const AVAIL = {
  available: { color: C.success, bg: C.successBg,  label: "Disponible" },
  busy:      { color: C.warning, bg: C.warningBg,  label: "Occupé"     },
  overloaded:{ color: C.danger,  bg: C.dangerBg,   label: "Surchargé"  },
};

const CATEGORY_COLORS: Record<string, string> = {
  hardware: "#EA580C", software: "#7C3AED", network: "#2563EB",
  security: "#EF4444", support: "#0E9188", other: "#6B7280",
};

const getLoadConf = (active: number) => {
  if (active < 3) return { color: C.success, pct: Math.min(active * 15, 100) };
  if (active < 7) return { color: C.warning, pct: Math.min(active * 12, 100) };
  return           { color: C.danger,  pct: Math.min(active * 10, 100) };
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminTeamsOverview() {
  const [teams,       setTeams]       = useState<TeamSummary[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<TeamSummary | null>(null);
  const [detail,      setDetail]      = useState<TeamDetail | null>(null);
  const [detailLoad,  setDetailLoad]  = useState(false);
  const [workload,    setWorkload]    = useState<MemberDetail[]>([]);
  const [tab,         setTab]         = useState(0);

  useEffect(() => {
    api.get<TeamSummary[]>("/api/team/all")
      .then(d => setTeams(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openDetail = async (team: TeamSummary) => {
    setSelected(team);
    setTab(0);
    setDetail(null);
    setWorkload([]);
    setDetailLoad(true);
    try {
      const [det, wl] = await Promise.all([
        api.get<TeamDetail>(`/api/team/${team._id}`),
        api.get<any>(`/api/team/${team._id}/workload`).then(r => r.members ?? []).catch(() => []),
      ]);
      setDetail(det);
      setWorkload(Array.isArray(wl) ? wl : []);
    } catch (e) { console.error(e); }
    finally { setDetailLoad(false); }
  };

  const closeDetail = () => { setSelected(null); setDetail(null); };

  // ── Globals
  const totalTeams   = teams.length;
  const totalMembers = teams.reduce((s, t) => s + (t.stats?.members ?? t.members?.length ?? 0), 0);
  const totalActive  = teams.reduce((s, t) => s + (t.stats?.active ?? 0), 0);
  const totalSla     = teams.reduce((s, t) => s + (t.stats?.slaBreached ?? 0), 0);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      <PageHeader title="Vue d'ensemble des équipes" icon="layout-grid" />

      {/* KPIs */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        {[
          { label: "Équipes",         value: totalTeams,   icon: "users-group",     color: C.accent,  bg: C.accentLight },
          { label: "Membres",         value: totalMembers, icon: "users",           color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
          { label: "Tickets actifs",  value: totalActive,  icon: "rotate-clockwise",color: C.warning, bg: C.warningBg },
          { label: "SLA dépassés",    value: totalSla,     icon: "alert",           color: C.danger,  bg: C.dangerBg },
        ].map(k => (
          <Box key={k.label} sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "20px 22px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {k.label}
              </Typography>
              <Box sx={{ width: 38, height: 38, borderRadius: "11px", bgcolor: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box component="i" className={`ti ti-${k.icon}`} sx={{ fontSize: 20, color: k.color }} />
              </Box>
            </Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "32px", fontWeight: 700, color: k.color, lineHeight: 1, mt: 1 }}>
              {k.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Team cards */}
      {teams.length === 0 ? (
        <EmptyState icon="users-group" title="Aucune équipe" description="Créez votre première équipe." />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 2.5 }}>
          {teams.map(team => {
            const load = getLoadConf(team.stats?.active ?? 0);
            const catColor = CATEGORY_COLORS[team.category] ?? "#6B7280";
            const memberCount = team.stats?.members ?? team.members?.length ?? 0;
            return (
              <Box key={team._id} sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "20px 22px", display: "flex", flexDirection: "column", gap: 2, transition: "box-shadow 0.2s", "&:hover": { boxShadow: C.shadowMd } }}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: team.color || catColor, flexShrink: 0 }} />
                    <Box>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>
                        {team.name}
                      </Typography>
                      {team.description && (
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, mt: 0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                          {team.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ px: 1.2, py: 0.3, borderRadius: "6px", bgcolor: catColor + "18", border: `1px solid ${catColor}44`, flexShrink: 0 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: catColor, letterSpacing: "0.06em" }}>
                      {team.tag || team.category.toUpperCase()}
                    </Typography>
                  </Box>
                </Box>

                {/* Leader */}
                {team.leaderId && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <UserAvatar name={team.leaderId.name} avatar={(team.leaderId as any)?.avatar} sx={{ width: 26, height: 26, fontSize: "11px", fontWeight: 700, bgcolor: C.accentLight, color: C.accent, fontFamily: "Inter, sans-serif" }} />
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary }}>
                      {team.leaderId.name}
                    </Typography>
                    <Box sx={{ px: 0.8, py: 0.2, borderRadius: "4px", bgcolor: "#3B82F620" }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 600, color: "#3B82F6" }}>LEADER</Typography>
                    </Box>
                  </Box>
                )}

                {/* Stats */}
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                  {[
                    { label: "Membres",  value: memberCount,               color: "#8B5CF6" },
                    { label: "Actifs",   value: team.stats?.active ?? 0,   color: C.warning },
                    { label: "Total",    value: team.stats?.total ?? 0,    color: C.accent  },
                  ].map(s => (
                    <Box key={s.label} sx={{ textAlign: "center", py: 1, borderRadius: "8px", bgcolor: C.bgPage }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "18px", fontWeight: 700, color: s.color }}>{s.value}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, textTransform: "uppercase" }}>{s.label}</Typography>
                    </Box>
                  ))}
                </Box>

                {/* Charge bar */}
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>Charge</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: load.color }}>{team.stats?.active ?? 0} actifs</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={load.pct} sx={{ height: 5, borderRadius: 3, bgcolor: C.border, "& .MuiLinearProgress-bar": { bgcolor: load.color, borderRadius: 3 } }} />
                </Box>

                {/* Actions */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Box onClick={() => openDetail(team)} sx={{ flex: 1, py: 1, borderRadius: "9px", bgcolor: C.navy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8, "&:hover": { bgcolor: C.navyMid }, transition: "background 0.15s" }}>
                    <Box component="i" className="ti ti-eye" sx={{ fontSize: 14, color: "#fff" }} />
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "#fff" }}>Voir détails</Typography>
                  </Box>
                  <Box component="a" href="/teams" sx={{ px: 1.5, py: 1, borderRadius: "9px", border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8, textDecoration: "none", "&:hover": { borderColor: C.accent, bgcolor: C.accentLight }, transition: "all 0.15s" }}>
                    <Box component="i" className="ti ti-pencil" sx={{ fontSize: 14, color: C.textMuted }} />
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textSecondary }}>Gérer</Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── Detail Dialog ── */}
      <Dialog open={!!selected} onClose={closeDetail} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0, px: 3, pt: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {selected && <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: selected.color || "#6B7280" }} />}
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "16px", color: C.textPrimary }}>{selected?.name}</Typography>
          </Box>
          <IconButton onClick={closeDetail} size="small" sx={{ color: C.textMuted }}>
            <Box component="i" className="ti ti-x" sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <Box sx={{ px: 3, pt: 1 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ "& .MuiTab-root": { fontFamily: "Inter, sans-serif", fontSize: "13px", textTransform: "none", fontWeight: 500 }, "& .Mui-selected": { fontWeight: 700 } }}>
            <Tab label="Membres" />
            <Tab label="Tickets" />
            <Tab label="Charge de travail" />
          </Tabs>
        </Box>

        <DialogContent sx={{ px: 3, pt: 2 }}>
          {detailLoad ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress sx={{ color: C.accent }} /></Box>
          ) : (
            <>
              {/* Tab 0 — Membres */}
              {tab === 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {(!detail?.members || detail.members.length === 0) ? (
                    <EmptyState icon="users" title="Aucun membre" />
                  ) : detail.members.map(m => {
                    const av = AVAIL[m.availability] ?? AVAIL.available;
                    return (
                      <Box key={m._id} sx={{ display: "flex", alignItems: "center", gap: 2, p: "14px 16px", borderRadius: "12px", border: `1px solid ${C.border}`, bgcolor: "#fff" }}>
                        <UserAvatar name={m.name} avatar={m.avatar} sx={{ width: 40, height: 40, fontSize: "13px", fontWeight: 700, bgcolor: C.accentLight, color: C.accent, fontFamily: "Inter, sans-serif" }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</Typography>
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</Typography>
                        </Box>
                        <RoleBadge role={m.role} size="sm" />
                        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexShrink: 0 }}>
                          {[{ label: "Assignés", v: m.assigned }, { label: "Actifs", v: m.active }, { label: "Résolus", v: m.resolved }].map(s => (
                            <Box key={s.label} sx={{ textAlign: "center" }}>
                              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>{s.v}</Typography>
                              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "9px", color: C.textMuted, textTransform: "uppercase" }}>{s.label}</Typography>
                            </Box>
                          ))}
                        </Box>
                        <Box sx={{ px: 1.2, py: 0.3, borderRadius: "20px", bgcolor: av.bg, flexShrink: 0 }}>
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: av.color }}>{av.label}</Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Tab 1 — Tickets */}
              {tab === 1 && detail && (
                <Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 1.5, mb: 2 }}>
                    {[
                      { label: "Total",      value: detail.stats.totalTickets, color: C.accent,  bg: C.accentLight },
                      { label: "Ouverts",    value: detail.stats.openTickets,  color: C.info,    bg: C.infoBg },
                      { label: "En cours",   value: detail.stats.inProgress,   color: C.warning, bg: C.warningBg },
                      { label: "Résolus",    value: detail.stats.resolved,     color: C.success, bg: C.successBg },
                      { label: "SLA dépassé",value: detail.stats.slaBreached,  color: C.danger,  bg: C.dangerBg },
                    ].map(s => (
                      <Box key={s.label} sx={{ bgcolor: s.bg, borderRadius: "12px", p: "14px 16px", textAlign: "center" }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "24px", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: s.color, mt: 0.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2, borderRadius: "10px", bgcolor: C.bgPage }}>
                    <Box component="i" className="ti ti-info-circle" sx={{ fontSize: 16, color: C.textMuted }} />
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>
                      Pour gérer les tickets, accédez à la file admin via le module Tickets.
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Tab 2 — Charge de travail */}
              {tab === 2 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {workload.length === 0 ? (
                    <EmptyState icon="chart-bar-2" title="Aucune donnée de charge" />
                  ) : workload.map(m => {
                    const av = AVAIL[m.availability] ?? AVAIL.available;
                    return (
                      <Box key={m._id} sx={{ p: "14px 16px", borderRadius: "12px", border: `1px solid ${C.border}`, bgcolor: "#fff" }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <UserAvatar name={m.name} avatar={m.avatar} sx={{ width: 32, height: 32, fontSize: "12px", fontWeight: 700, bgcolor: C.accentLight, color: C.accent, fontFamily: "Inter, sans-serif" }} />
                            <Box>
                              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>{m.name}</Typography>
                              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{m.email}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                            <Box sx={{ px: 1.2, py: 0.3, borderRadius: "20px", bgcolor: av.bg }}>
                              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: av.color }}>{av.label}</Typography>
                            </Box>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: av.color }}>{m.chargePercent}%</Typography>
                          </Box>
                        </Box>
                        <LinearProgress variant="determinate" value={m.chargePercent} sx={{ height: 5, borderRadius: 3, bgcolor: C.border, mb: 1, "& .MuiLinearProgress-bar": { bgcolor: av.color, borderRadius: 3 } }} />
                        <Box sx={{ display: "flex", gap: 1.5 }}>
                          {[{ label: "Assignés", v: m.assigned, c: C.info }, { label: "Actifs", v: m.active, c: C.warning }, { label: "Résolus", v: m.resolved, c: C.success }].map(s => (
                            <Box key={s.label} sx={{ flex: 1, textAlign: "center", py: 0.8, borderRadius: "8px", bgcolor: C.bgPage }}>
                              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: 700, color: s.c }}>{s.v}</Typography>
                              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, textTransform: "uppercase" }}>{s.label}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
