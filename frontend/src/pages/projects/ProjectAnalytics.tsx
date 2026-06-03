// frontend/src/pages/projects/ProjectAnalytics.tsx
import { useState, useEffect } from "react";
import { Box, Grid, CircularProgress } from "@mui/material";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { C, chartColors } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { KpiCard } from "../../components/KpiCard";
import { EmptyState } from "../../components/EmptyState";

interface ProjectAnalyticsData {
  totalProjects: number;
  totalTasks: number;
  doneTasks: number;
  overdueTasks: number;
  completionRate: number;
  statusBreakdown: { _id: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  planning:    chartColors.blue,
  in_progress: chartColors.orange,
  at_risk:     chartColors.red,
  completed:   chartColors.green,
  on_hold:     "#94A3B8",
};
const STATUS_LABELS: Record<string, string> = {
  planning:    "Planification",
  in_progress: "En cours",
  at_risk:     "À risque",
  completed:   "Complété",
  on_hold:     "En pause",
};

export default function ProjectAnalytics() {
  const [data,    setData]    = useState<ProjectAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ProjectAnalyticsData>("/api/analytics/projects")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;
  if (!data)   return <EmptyState icon="chart-bar" title="Données indisponibles" />;

  const pieData = data.statusBreakdown.map(s => ({
    name: STATUS_LABELS[s._id] ?? s._id,
    value: s.count,
    fill: STATUS_COLORS[s._id] ?? "#94A3B8",
  }));

  const taskBar = [
    { name: "Total",     value: data.totalTasks,      fill: C.accent  },
    { name: "Terminées", value: data.doneTasks,        fill: C.success },
    { name: "En retard", value: data.overdueTasks,     fill: C.danger  },
    { name: "En cours",  value: data.totalTasks - data.doneTasks - data.overdueTasks, fill: C.warning },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <PageHeader title="Analytics projets" subtitle="Vue d'ensemble de la gestion de projets" icon="chart-bar" />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Projets actifs",   value: data.totalProjects,    icon: "folder-open",  color: C.accent,  bg: C.accentLight },
          { label: "Tâches totales",   value: data.totalTasks,       icon: "checkbox",     color: C.info,    bg: C.infoBg },
          { label: "Tâches terminées", value: data.doneTasks,        icon: "circle-check", color: C.success, bg: C.successBg },
          { label: "En retard",        value: data.overdueTasks,     icon: "clock-x",      color: C.danger,  bg: C.dangerBg },
          { label: "Taux complétion",  value: `${data.completionRate}%`, icon: "percent", color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
        ].map(k => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={k.label}>
            <KpiCard {...k} tagColor={k.color} tagBg={k.bg} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: 2.5 }}>
            <Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, mb: 2 }}>Distribution des tâches</Box>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={taskBar}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: "Inter, sans-serif" }} />
                <YAxis tick={{ fontSize: 12, fontFamily: "Inter, sans-serif" }} />
                <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif", borderRadius: 8 }} />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {taskBar.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        <Grid item xs={12} md={5}>
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: 2.5 }}>
            <Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, mb: 2 }}>Statut des projets</Box>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent*100)}%`} labelLine={false}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
