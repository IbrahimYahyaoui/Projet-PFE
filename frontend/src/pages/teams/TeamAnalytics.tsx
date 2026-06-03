// frontend/src/pages/teams/TeamAnalytics.tsx
import { useState, useEffect } from "react";
import { Box, Grid, CircularProgress } from "@mui/material";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { C, chartColors } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { KpiCard } from "../../components/KpiCard";
import { PeriodSelector } from "../../components/PeriodSelector";
import { EmptyState } from "../../components/EmptyState";

interface AnalyticsData {
  kpis: { totalTickets: number; resolvedTickets: number; openTickets: number; inProgressTickets: number; waitingTickets: number; slaBreachedCount: number; slaComplianceRate: number; resolutionRate: number; avgResolutionTime: number };
  ticketsByDay: { _id: string; created: number; resolved: number }[];
  statusDistribution: { _id: string; count: number }[];
  priorityDistribution: { _id: string; count: number }[];
  techPerformance: { _id: string; name: string; resolved: number; successRate: number; avgResolutionTime: number }[];
}

const STATUS_LABELS: Record<string, string> = { open: "Ouvert", assigned: "Assigné", in_progress: "En cours", waiting: "Attente", resolved: "Résolu", closed: "Fermé" };
const STATUS_COLORS: Record<string, string> = { open: chartColors.teal, assigned: chartColors.blue, in_progress: chartColors.orange, waiting: "#EAB308", resolved: chartColors.green, closed: "#94A3B8" };

export default function TeamAnalytics() {
  const [period,  setPeriod]  = useState("30");
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<AnalyticsData>(`/api/analytics?period=${period}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;
  if (!data)   return <EmptyState icon="chart-pie" title="Données indisponibles" />;

  const { kpis, ticketsByDay, statusDistribution, priorityDistribution, techPerformance } = data;
  const statusData   = statusDistribution.map(s => ({ name: STATUS_LABELS[s._id] ?? s._id, value: s.count, fill: STATUS_COLORS[s._id] ?? "#94A3B8" }));
  const priorityData = priorityDistribution.map(p => ({ name: p._id, value: p.count }));

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <PageHeader title="Analytics équipe" subtitle="Performance et statistiques" icon="chart-pie" />
        <PeriodSelector value={period} onChange={setPeriod} />
      </Box>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total",           value: kpis.totalTickets,       icon: "ticket",       color: C.accent,  bg: C.accentLight },
          { label: "Résolus",         value: kpis.resolvedTickets,     icon: "circle-check", color: C.success, bg: C.successBg },
          { label: "Taux résolution", value: `${kpis.resolutionRate}%`,icon: "percent",      color: C.info,    bg: C.infoBg },
          { label: "Conformité SLA",  value: `${kpis.slaComplianceRate}%`, icon: "shield-check", color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
          { label: "Moy. résolution", value: `${kpis.avgResolutionTime}h`, icon: "clock",    color: C.warning, bg: C.warningBg },
          { label: "SLA dépassé",     value: kpis.slaBreachedCount,   icon: "alert-triangle",color: C.danger, bg: C.dangerBg },
        ].map(k => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={k.label}>
            <KpiCard {...k} tagColor={k.color} tagBg={k.bg} />
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: 2.5 }}>
            <Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, mb: 2 }}>Tickets par jour</Box>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ticketsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fontFamily: "Inter, sans-serif" }} />
                <YAxis tick={{ fontSize: 11, fontFamily: "Inter, sans-serif" }} />
                <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="created"  name="Créés"   fill={C.accent}   radius={[4,4,0,0]} />
                <Bar dataKey="resolved" name="Résolus" fill={C.success}  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: 2.5 }}>
            <Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, mb: 2 }}>Par statut</Box>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>

      {/* Tech performance */}
      {techPerformance.length > 0 && (
        <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.border}` }}>
            <Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary }}>Performance techniciens</Box>
          </Box>
          {techPerformance.map((t, i) => (
            <Box key={t._id} sx={{ display: "flex", alignItems: "center", gap: 2, px: 2.5, py: 1.5, borderBottom: i < techPerformance.length - 1 ? `1px solid ${C.divider}` : "none" }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.accent }}>{i + 1}</Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>{t.name}</Box>
              </Box>
              <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
                <Box sx={{ textAlign: "right" }}><Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.success }}>{t.resolved}</Box><Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>résolus</Box></Box>
                <Box sx={{ textAlign: "right" }}><Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.info }}>{t.successRate}%</Box><Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>succès</Box></Box>
                <Box sx={{ textAlign: "right" }}><Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.warning }}>{t.avgResolutionTime}h</Box><Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>moy.</Box></Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
