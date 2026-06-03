// frontend/src/pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, CircularProgress, LinearProgress,
  Avatar, Skeleton, Divider, Tooltip, Alert,
} from "@mui/material";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as ChartTip,
  ResponsiveContainer, Legend,
} from "recharts";
import { C, chartColors, priorityColors, statusColors } from "../theme";
import { api } from "../api";
import { getCurrentUser } from "../hooks/useAuth";
import { SLABadge } from "../components/SLABadge";
import { PriorityChip } from "../components/chips/PriorityChip";
import { StatusChip } from "../components/chips/StatusChip";
import { PeriodSelector } from "../components/PeriodSelector";

// ─── helpers ────────────────────────────────────────────────────────────────
const DAYS    = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MONTHS  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const today   = () => { const d = new Date(); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const greet   = () => { const h = new Date().getHours(); return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"; };
const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
const fmtHours = (h: number) => h < 1 ? `${Math.round(h * 60)}min` : `${h.toFixed(1)}h`;
const fmtDate  = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

const CHART_STYLE = {
  tooltip: { contentStyle: { fontFamily: "Inter, sans-serif", fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}`, boxShadow: C.shadow } },
  axis:    { tick: { fontFamily: "Inter, sans-serif", fontSize: 11, fill: C.textMuted }, axisLine: false, tickLine: false },
  grid:    { stroke: C.border, strokeDasharray: "3 3", vertical: false },
};

const STATUS_COLORS: Record<string, string> = {
  open: "#3B82F6", assigned: "#5FC2BA", in_progress: "#F97316", waiting: "#F59E0B", resolved: "#22C55E", closed: "#94A3B8",
};
const STATUS_LABELS: Record<string, string> = {
  open: "Ouvert", assigned: "Assigné", in_progress: "En cours", waiting: "En attente", resolved: "Résolu", closed: "Fermé",
};
const PRIORITY_COLORS: Record<string, string> = { low: "#22C55E", medium: "#3B82F6", high: "#F97316", critical: "#EF4444" };
const PRIORITY_LABELS: Record<string, string> = { low: "Faible", medium: "Moyenne", high: "Haute", critical: "Critique" };
const CAT_LABELS: Record<string, string>      = { hardware: "Matériel", software: "Logiciel", network: "Réseau", access: "Accès", general: "Général", other: "Autre" };

// ─── shared sub-components ──────────────────────────────────────────────────
const KPI = ({ label, value, icon, color, bg, sub, onClick }: {
  label: string; value: number | string; icon: string; color: string; bg: string; sub?: string; onClick?: () => void;
}) => (
  <Box
    onClick={onClick}
    sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "18px 20px", cursor: onClick ? "pointer" : "default", transition: "all 0.2s", "&:hover": onClick ? { boxShadow: C.shadowMd, transform: "translateY(-2px)" } : {} }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1.4 }}>
        {label}
      </Typography>
      <Box sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Box component="i" className={`ti ti-${icon}`} sx={{ fontSize: 18, color }} />
      </Box>
    </Box>
    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "30px", fontWeight: 700, color, lineHeight: 1, mb: 1 }}>
      {value}
    </Typography>
    {sub && (
      <Box sx={{ display: "inline-flex", bgcolor: bg, borderRadius: "20px", px: 1.2, py: 0.4 }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color }}>{sub}</Typography>
      </Box>
    )}
  </Box>
);

const CardShell = ({ title, subtitle, action, actionLabel, children, icon, noPad }: {
  title: string; subtitle?: string; icon?: string; action?: () => void; actionLabel?: string; children: React.ReactNode; noPad?: boolean;
}) => (
  <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
    <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
      {icon && <Box component="i" className={`ti ti-${icon}`} sx={{ fontSize: 16, color: C.accent }} />}
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>{title}</Typography>
        {subtitle && <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mt: 0.2 }}>{subtitle}</Typography>}
      </Box>
      {action && (
        <Box onClick={action} sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.accent }}>{actionLabel ?? "Voir tout"}</Typography>
          <Box component="i" className="ti ti-arrow-right" sx={{ fontSize: 13, color: C.accent }} />
        </Box>
      )}
    </Box>
    <Box sx={{ flex: 1, ...(noPad ? {} : { p: 2 }) }}>{children}</Box>
  </Box>
);

const SkeletonKPI = () => (
  <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "18px 20px" }}>
    <Skeleton variant="text" width="60%" sx={{ mb: 1.5 }} />
    <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
    <Skeleton variant="rounded" width={80} height={24} />
  </Box>
);

// ─── Recharts custom tooltip ─────────────────────────────────────────────────
const ChartTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: "#fff", border: `1px solid ${C.border}`, borderRadius: "8px", p: "8px 12px", boxShadow: C.shadow }}>
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mb: 0.5 }}>{label}</Typography>
      {payload.map((p: any, i: number) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.color }} />
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textPrimary }}>{p.name}: <b>{p.value}</b></Typography>
        </Box>
      ))}
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function AdminDashboard({ period, setPeriod }: { period: string; setPeriod: (v: string) => void }) {
  const navigate = useNavigate();
  const user     = getCurrentUser();

  const [analytics,  setAnalytics]  = useState<any>(null);
  const [projStats,  setProjStats]  = useState<any>(null);
  const [slaAlerts,  setSlaAlerts]  = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<any>(`/api/analytics?period=${period}`).then(setAnalytics),
      api.get<any>("/api/analytics/projects").then(setProjStats),
      api.get<any[]>("/api/tickets/sla-alerts").then(r => setSlaAlerts(Array.isArray(r) ? r.slice(0, 6) : [])).catch(() => setSlaAlerts([])),
    ]).finally(() => setLoading(false));
  }, [period]);

  const kpis = analytics?.kpis ?? {};
  const byDay = (analytics?.ticketsByDay ?? []).slice(-14);
  const statusDist = (analytics?.statusDistribution ?? []).map((d: any) => ({ name: STATUS_LABELS[d._id] ?? d._id, value: d.count, color: STATUS_COLORS[d._id] ?? C.accent }));
  const priorityDist = (analytics?.priorityDistribution ?? []).map((d: any) => ({ name: PRIORITY_LABELS[d._id] ?? d._id, value: d.count, color: PRIORITY_COLORS[d._id] ?? C.accent }));
  const categoryDist = (analytics?.categoryDistribution ?? []).slice(0, 6).map((d: any) => ({ name: CAT_LABELS[d._id] ?? d._id, value: d.count }));
  const techPerf     = (analytics?.techPerformance ?? []).slice(0, 6);

  const avatarColors = [C.accent, "#3B82F6", "#F97316", "#8B5CF6", "#22C55E", "#EF4444"];

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto", width: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "22px", fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.4px" }}>
            {greet()}, {user?.name?.split(" ")[0]}
          </Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mt: 0.3 }}>{today()}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PeriodSelector value={period} onChange={setPeriod} />
          <Box
            onClick={() => navigate("/tickets/create")}
            sx={{ display: "flex", alignItems: "center", gap: 0.8, px: 2, py: 1, borderRadius: "10px", bgcolor: C.accent, cursor: "pointer", "&:hover": { bgcolor: C.accentHover }, transition: "background 0.15s" }}
          >
            <Box component="i" className="ti ti-plus" sx={{ fontSize: 15, color: "#fff" }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: "#fff" }}>Nouveau ticket</Typography>
          </Box>
        </Box>
      </Box>

      {/* SLA Banner */}
      {!loading && slaAlerts.length > 0 && (
        <Alert
          severity="error"
          icon={<Box component="i" className="ti ti-alert-triangle" sx={{ fontSize: 18 }} />}
          sx={{ mb: 3, borderRadius: "12px", fontFamily: "Inter, sans-serif", fontSize: "13px", cursor: "pointer", "& .MuiAlert-message": { fontFamily: "Inter, sans-serif" } }}
          onClick={() => navigate("/tickets/admin-queue")}
        >
          <b>{slaAlerts.length} ticket(s)</b> avec SLA dépassé ou proche de l'échéance — action requise
        </Alert>
      )}

      {/* KPI Row 1 */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: "Total Tickets",    value: kpis.totalTickets ?? 0,      icon: "ticket",        color: C.accent,    bg: C.accentLight,               sub: `Période ${period}j`,   onClick: () => navigate("/tickets/all") },
          { label: "Ouverts",          value: kpis.openTickets ?? 0,       icon: "inbox",         color: "#3B82F6",   bg: "rgba(59,130,246,.10)",       sub: "Sans équipe",           onClick: () => navigate("/tickets/admin-queue") },
          { label: "En cours",         value: kpis.inProgressTickets ?? 0, icon: "loader",        color: C.warning,   bg: C.warningBg,                  sub: "Actifs" },
          { label: "Résolus",          value: kpis.resolvedTickets ?? 0,   icon: "circle-check",  color: C.success,   bg: C.successBg,                  sub: `${kpis.resolutionRate ?? 0}% taux` },
        ].map(k => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={k.label}>
            {loading ? <SkeletonKPI /> : <KPI {...k} />}
          </Grid>
        ))}
      </Grid>

      {/* KPI Row 2 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "SLA Dépassé",      value: kpis.slaBreachedCount ?? 0,  icon: "alert-triangle", color: C.danger,   bg: C.dangerBg,                   sub: "Urgence" },
          { label: "Conformité SLA",   value: `${kpis.slaComplianceRate ?? 100}%`, icon: "shield-check", color: "#8B5CF6", bg: "rgba(139,92,246,.08)", sub: "Performance" },
          { label: "Escaladés",        value: kpis.escalatedCount ?? 0,    icon: "arrow-up",      color: "#F59E0B",   bg: "rgba(245,158,11,.10)",        sub: "À traiter" },
          { label: "Tps résolution moy",value: fmtHours(kpis.avgResolutionTime ?? 0), icon: "clock", color: C.accent, bg: C.accentLight,                sub: "Moyenne" },
        ].map(k => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={k.label}>
            {loading ? <SkeletonKPI /> : <KPI {...k} />}
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Area chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <CardShell title="Évolution des tickets" subtitle={`${period} derniers jours — créés vs résolus`} icon="chart-line" noPad>
            {loading ? <Skeleton variant="rectangular" height={240} sx={{ m: 2 }} /> : (
              <Box sx={{ p: 2, pt: 1.5 }}>
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={byDay} margin={{ left: -10, right: 4 }}>
                    <defs>
                      <linearGradient id="gradCreated"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent}  stopOpacity={0.15} /><stop offset="95%" stopColor={C.accent}  stopOpacity={0} /></linearGradient>
                      <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.15} /><stop offset="95%" stopColor={C.success} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid {...CHART_STYLE.grid} />
                    <XAxis dataKey="_id" {...CHART_STYLE.axis} tickFormatter={v => v.slice(5)} />
                    <YAxis {...CHART_STYLE.axis} allowDecimals={false} />
                    <ChartTip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="created"  name="Créés"   stroke={C.accent}  strokeWidth={2} fill="url(#gradCreated)"  dot={false} />
                    <Area type="monotone" dataKey="resolved" name="Résolus" stroke={C.success} strokeWidth={2} fill="url(#gradResolved)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardShell>
        </Grid>

        {/* Status donut */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <CardShell title="Distribution statuts" subtitle="Répartition actuelle" icon="chart-pie">
            {loading ? <Skeleton variant="circular" width={140} height={140} sx={{ mx: "auto", mt: 2, mb: 2 }} /> : statusDist.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" innerRadius={44} outerRadius={64} dataKey="value" strokeWidth={0} paddingAngle={2}>
                      {statusDist.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <ChartTip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6, mt: 0.5 }}>
                  {statusDist.map((d: any, i: number) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: d.color, flexShrink: 0 }} />
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary }}>{d.name}</Typography>
                      </Box>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textPrimary }}>{d.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 140 }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>Aucune donnée</Typography>
              </Box>
            )}
          </CardShell>
        </Grid>
      </Grid>

      {/* Analytics + Projects Row */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Priority distribution */}
        <Grid size={{ xs: 12, md: 4 }}>
          <CardShell title="Par priorité" subtitle="Répartition des tickets" icon="flag">
            {loading ? <Skeleton variant="rectangular" height={180} /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={priorityDist} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" {...CHART_STYLE.axis} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" {...CHART_STYLE.axis} width={60} />
                  <ChartTip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" name="Tickets" radius={[0, 6, 6, 0]}>
                    {priorityDist.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardShell>
        </Grid>

        {/* Category distribution */}
        <Grid size={{ xs: 12, md: 4 }}>
          <CardShell title="Par catégorie" subtitle="Volume par type" icon="tag">
            {loading ? <Skeleton variant="rectangular" height={180} /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={categoryDist} margin={{ left: -8, right: 4 }}>
                  <CartesianGrid {...CHART_STYLE.grid} />
                  <XAxis dataKey="name" {...CHART_STYLE.axis} />
                  <YAxis {...CHART_STYLE.axis} allowDecimals={false} />
                  <ChartTip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" name="Tickets" fill={C.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardShell>
        </Grid>

        {/* Projects summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <CardShell title="Projets" subtitle="Vue d'ensemble" icon="folder-open" action={() => navigate("/projects")}>
            {loading || !projStats ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={28} />)}
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {[
                  { label: "Total projets",     value: projStats.totalProjects ?? 0,   color: C.accent,   icon: "folder-open" },
                  { label: "Total tâches",       value: projStats.totalTasks ?? 0,      color: "#3B82F6",  icon: "checkbox" },
                  { label: "Tâches terminées",   value: projStats.doneTasks ?? 0,       color: C.success,  icon: "circle-check" },
                  { label: "Tâches en retard",   value: projStats.overdueTasks ?? 0,    color: C.danger,   icon: "alert-circle" },
                ].map(item => (
                  <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1, borderRadius: "10px", bgcolor: C.bgPage }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: item.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Box component="i" className={`ti ti-${item.icon}`} sx={{ fontSize: 14, color: item.color }} />
                    </Box>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary, flex: 1 }}>{item.label}</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: 700, color: item.color }}>{item.value}</Typography>
                  </Box>
                ))}
                {projStats.completionRate !== undefined && (
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>Complétion globale</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.accent }}>{projStats.completionRate}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={projStats.completionRate ?? 0} sx={{ height: 6, borderRadius: 3, bgcolor: C.border, "& .MuiLinearProgress-bar": { bgcolor: C.accent, borderRadius: 3 } }} />
                  </Box>
                )}
              </Box>
            )}
          </CardShell>
        </Grid>
      </Grid>

      {/* Bottom Row: Tech Performance + SLA Alerts */}
      <Grid container spacing={2}>
        {/* Tech Performance */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <CardShell title="Performance techniciens" subtitle="Taux de résolution — période sélectionnée" icon="users" action={() => navigate("/teams/analytics")}>
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={52} />)}
              </Box>
            ) : techPerf.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Box component="i" className="ti ti-users" sx={{ fontSize: 36, color: C.textMuted, display: "block", mb: 1 }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>Aucune donnée de performance</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {techPerf.map((tech: any, i: number) => (
                  <Box key={tech._id} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1.2, bgcolor: C.bgPage, borderRadius: "10px" }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: avatarColors[i % avatarColors.length] + "22", color: avatarColors[i % avatarColors.length], fontSize: "12px", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                      {initials(tech.name)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tech.name}</Typography>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: tech.successRate >= 80 ? C.success : tech.successRate >= 50 ? C.warning : C.danger, ml: 1, flexShrink: 0 }}>{tech.successRate}%</Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ flex: 1, height: 5, bgcolor: C.border, borderRadius: 3, overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${tech.successRate}%`, bgcolor: tech.successRate >= 80 ? C.success : tech.successRate >= 50 ? C.warning : C.danger, borderRadius: 3, transition: "width 0.6s ease" }} />
                        </Box>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, flexShrink: 0 }}>{tech.resolved}/{tech.assigned}</Typography>
                      </Box>
                    </Box>
                    <Tooltip title={`Temps moyen: ${fmtHours(tech.avgResolutionTime)}`}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "18px", fontWeight: 700, color: C.accent, lineHeight: 1 }}>{tech.resolved}</Typography>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "9px", color: C.textMuted }}>résolus</Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            )}
          </CardShell>
        </Grid>

        {/* SLA Alerts */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <CardShell title="Alertes SLA" subtitle="Tickets proches ou dépassant l'échéance" icon="alert-triangle" action={() => navigate("/tickets/all")}>
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={48} />)}
              </Box>
            ) : slaAlerts.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Box component="i" className="ti ti-shield-check" sx={{ fontSize: 36, color: C.success, display: "block", mb: 1 }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.success, fontWeight: 600 }}>Aucune alerte SLA active</Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, mt: 0.5 }}>Tous les tickets respectent leurs délais</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {slaAlerts.map((t: any, i: number) => (
                  <Box
                    key={t._id}
                    onClick={() => navigate(`/tickets/${t._id}`)}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 0.5, py: 1.2, borderBottom: i < slaAlerts.length - 1 ? `1px solid ${C.divider}` : "none", cursor: "pointer", borderRadius: "8px", "&:hover": { bgcolor: C.bgPage } }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: t.slaBreached ? C.danger : C.warning, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{t.assignedTo?.name ?? "Non assigné"}</Typography>
                    </Box>
                    <PriorityChip priority={t.priority} size="sm" />
                    <SLABadge slaDeadline={t.slaDeadline} slaBreached={t.slaBreached} status={t.status} />
                  </Box>
                ))}
              </Box>
            )}
          </CardShell>
        </Grid>
      </Grid>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEADER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function LeaderDashboard({ period, setPeriod }: { period: string; setPeriod: (v: string) => void }) {
  const navigate = useNavigate();
  const user     = getCurrentUser();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<any>(`/api/analytics?period=${period}`)
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, [period]);

  const kpis    = analytics?.kpis ?? {};
  const byDay   = (analytics?.ticketsByDay ?? []).slice(-14);
  const techPerf = (analytics?.techPerformance ?? []).slice(0, 5);
  const statusDist = (analytics?.statusDistribution ?? []).map((d: any) => ({ name: STATUS_LABELS[d._id] ?? d._id, value: d.count, color: STATUS_COLORS[d._id] ?? C.accent }));

  const avatarColors = [C.accent, "#3B82F6", "#F97316", "#8B5CF6", "#22C55E"];

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto", width: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "22px", fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.4px" }}>
            {greet()}, {user?.name?.split(" ")[0]}
          </Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mt: 0.3 }}>{today()}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <PeriodSelector value={period} onChange={setPeriod} />
          <Box onClick={() => navigate("/teams")} sx={{ display: "flex", alignItems: "center", gap: 0.8, px: 2, py: 1, borderRadius: "10px", border: `1px solid ${C.border}`, cursor: "pointer", "&:hover": { borderColor: C.accent, bgcolor: C.accentLight }, transition: "all 0.15s" }}>
            <Box component="i" className="ti ti-users-group" sx={{ fontSize: 15, color: C.accent }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textSecondary }}>Mon équipe</Typography>
          </Box>
        </Box>
      </Box>

      {/* KPI Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total Tickets",  value: kpis.totalTickets ?? 0,      icon: "ticket",       color: C.accent,  bg: C.accentLight,            sub: `Période ${period}j`, onClick: () => navigate("/teams/tickets") },
          { label: "Ouverts",        value: kpis.openTickets ?? 0,       icon: "circle-dot",   color: "#3B82F6", bg: "rgba(59,130,246,.10)",    sub: "À assigner" },
          { label: "En cours",       value: kpis.inProgressTickets ?? 0, icon: "loader",       color: C.warning, bg: C.warningBg,              sub: "Actifs" },
          { label: "Résolus",        value: kpis.resolvedTickets ?? 0,   icon: "circle-check", color: C.success, bg: C.successBg,              sub: `${kpis.resolutionRate ?? 0}%` },
        ].map(k => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={k.label}>
            {loading ? <SkeletonKPI /> : <KPI {...k} />}
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <CardShell title="Activité de l'équipe" subtitle={`${period} derniers jours`} icon="chart-line" noPad>
            {loading ? <Skeleton variant="rectangular" height={230} sx={{ m: 2 }} /> : (
              <Box sx={{ p: 2, pt: 1.5 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={byDay} margin={{ left: -10, right: 4 }}>
                    <defs>
                      <linearGradient id="lGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.15}/><stop offset="95%" stopColor={C.accent} stopOpacity={0}/></linearGradient>
                      <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.15}/><stop offset="95%" stopColor={C.success} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid {...CHART_STYLE.grid} />
                    <XAxis dataKey="_id" {...CHART_STYLE.axis} tickFormatter={v => v.slice(5)} />
                    <YAxis {...CHART_STYLE.axis} allowDecimals={false} />
                    <ChartTip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="created"  name="Créés"   stroke={C.accent}  strokeWidth={2} fill="url(#lGrad)"  dot={false} />
                    <Area type="monotone" dataKey="resolved" name="Résolus" stroke={C.success} strokeWidth={2} fill="url(#rGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardShell>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <CardShell title="Statuts tickets" subtitle="Distribution actuelle" icon="chart-pie">
            {loading ? <Skeleton variant="circular" width={120} height={120} sx={{ mx: "auto", mt: 2, mb: 2 }} /> : statusDist.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" strokeWidth={0} paddingAngle={2}>
                      {statusDist.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <ChartTip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {statusDist.map((d: any, i: number) => (
                    <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: d.color }} />
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary }}>{d.name}</Typography>
                      </Box>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textPrimary }}>{d.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 140 }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>Aucune donnée</Typography>
              </Box>
            )}
          </CardShell>
        </Grid>
      </Grid>

      {/* Tech performance */}
      <CardShell title="Performance des techniciens" subtitle="Taux de résolution sur la période" icon="users" action={() => navigate("/teams/analytics")}>
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={52} />)}
          </Box>
        ) : techPerf.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>Aucune donnée</Typography>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {techPerf.map((tech: any, i: number) => (
              <Grid size={{ xs: 12, sm: 6 }} key={tech._id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, bgcolor: C.bgPage, borderRadius: "10px" }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: avatarColors[i % avatarColors.length] + "22", color: avatarColors[i % avatarColors.length], fontSize: "12px", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                    {initials(tech.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tech.name}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: tech.successRate >= 80 ? C.success : C.warning, ml: 1, flexShrink: 0 }}>{tech.successRate}%</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <Box sx={{ flex: 1, height: 5, bgcolor: C.border, borderRadius: 3, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${tech.successRate}%`, bgcolor: tech.successRate >= 80 ? C.success : C.warning, borderRadius: 3 }} />
                      </Box>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, flexShrink: 0 }}>{tech.active} actifs</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </CardShell>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TECHNICIAN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function TechDashboard() {
  const navigate  = useNavigate();
  const user      = getCurrentUser();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any[]>("/api/tickets/assigned")
      .then(d => setTickets(Array.isArray(d) ? d : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  const open       = tickets.filter(t => t.status === "open").length;
  const inProgress = tickets.filter(t => t.status === "in_progress").length;
  const resolved   = tickets.filter(t => ["resolved","closed"].includes(t.status)).length;
  const slaRisk    = tickets.filter(t => t.slaDeadline && !["resolved","closed"].includes(t.status) && new Date(t.slaDeadline).getTime() - Date.now() < 4 * 3600000).length;

  const sorted = [...tickets].sort((a, b) => {
    if (a.slaDeadline && b.slaDeadline) return new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime();
    if (a.slaDeadline) return -1;
    if (b.slaDeadline) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, 10);

  return (
    <Box sx={{ p: 3, maxWidth: 1300, mx: "auto", width: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "22px", fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.4px" }}>
            {greet()}, {user?.name?.split(" ")[0]}
          </Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mt: 0.3 }}>{today()}</Typography>
        </Box>
        <Box onClick={() => navigate("/ai-assistant")} sx={{ display: "flex", alignItems: "center", gap: 0.8, px: 2, py: 1, borderRadius: "10px", border: `1px solid ${C.border}`, cursor: "pointer", "&:hover": { borderColor: C.accent, bgcolor: C.accentLight }, transition: "all 0.15s" }}>
          <Box component="i" className="ti ti-robot" sx={{ fontSize: 15, color: C.accent }} />
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textSecondary }}>Assistant IA</Typography>
        </Box>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total assignés",   value: tickets.length, icon: "clipboard-list", color: C.accent,  bg: C.accentLight,         sub: "Mes tickets", onClick: () => navigate("/tickets/assigned") },
          { label: "En cours",         value: inProgress,     icon: "loader",         color: C.warning, bg: C.warningBg,           sub: "Actifs" },
          { label: "Résolus",          value: resolved,       icon: "circle-check",   color: C.success, bg: C.successBg,           sub: "Terminés" },
          { label: "Risque SLA",       value: slaRisk,        icon: "alert-triangle", color: C.danger,  bg: C.dangerBg,            sub: slaRisk > 0 ? "Urgent" : "OK" },
        ].map(k => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={k.label}>
            {loading ? <SkeletonKPI /> : <KPI {...k} />}
          </Grid>
        ))}
      </Grid>

      {/* Main content */}
      <Grid container spacing={2}>
        {/* My tickets list */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <CardShell title="Mes tickets assignés" subtitle="Triés par urgence SLA" icon="clipboard-list" action={() => navigate("/tickets/assigned")}>
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="rounded" height={56} />)}
              </Box>
            ) : sorted.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Box component="i" className="ti ti-clipboard-check" sx={{ fontSize: 40, color: C.success, display: "block", mb: 1 }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 600, color: C.success }}>Aucun ticket assigné</Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, mt: 0.5 }}>Profitez de votre temps libre !</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {sorted.map((t: any, i: number) => (
                  <Box
                    key={t._id}
                    onClick={() => navigate(`/tickets/${t._id}`)}
                    sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5, px: 0.5, borderBottom: i < sorted.length - 1 ? `1px solid ${C.divider}` : "none", cursor: "pointer", borderRadius: "8px", "&:hover": { bgcolor: C.bgPage }, transition: "background 0.12s" }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3 }}>
                        <StatusChip status={t.status} size="xs" />
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{fmtDate(t.createdAt)}</Typography>
                      </Box>
                    </Box>
                    <PriorityChip priority={t.priority} size="sm" />
                    {t.slaDeadline && <SLABadge slaDeadline={t.slaDeadline} slaBreached={t.slaBreached ?? false} status={t.status} />}
                  </Box>
                ))}
              </Box>
            )}
          </CardShell>
        </Grid>

        {/* Quick panel */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
            {/* Quick actions */}
            <CardShell title="Actions rapides" icon="zap">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {[
                  { label: "Mes tickets",          path: "/tickets/assigned",    icon: "clipboard-list", color: C.accent },
                  { label: "Base de connaissances", path: "/knowledge-base",      icon: "books",          color: "#8B5CF6" },
                  { label: "Mes projets",           path: "/projects",            icon: "folder-open",    color: "#3B82F6" },
                  { label: "Assistant IA",          path: "/ai-assistant",        icon: "robot",          color: C.warning },
                ].map(a => (
                  <Box key={a.label} onClick={() => navigate(a.path)} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1, borderRadius: "10px", cursor: "pointer", "&:hover": { bgcolor: a.color + "10" }, transition: "background 0.12s" }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: a.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Box component="i" className={`ti ti-${a.icon}`} sx={{ fontSize: 14, color: a.color }} />
                    </Box>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textSecondary, flex: 1 }}>{a.label}</Typography>
                    <Box component="i" className="ti ti-chevron-right" sx={{ fontSize: 13, color: C.textMuted }} />
                  </Box>
                ))}
              </Box>
            </CardShell>

            {/* Work stats */}
            <CardShell title="Mon activité" subtitle="Vue d'ensemble" icon="chart-bar">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {[
                  { label: "Ouverts",    value: open,       max: tickets.length, color: "#3B82F6" },
                  { label: "En cours",   value: inProgress, max: tickets.length, color: C.warning },
                  { label: "Résolus",    value: resolved,   max: tickets.length, color: C.success },
                ].map(bar => (
                  <Box key={bar.label}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary }}>{bar.label}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: bar.color }}>{bar.value}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={bar.max > 0 ? (bar.value / bar.max) * 100 : 0} sx={{ height: 6, borderRadius: 3, bgcolor: C.border, "& .MuiLinearProgress-bar": { bgcolor: bar.color, borderRadius: 3 } }} />
                  </Box>
                ))}
              </Box>
            </CardShell>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPLOYEE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function EmployeeDashboard() {
  const navigate  = useNavigate();
  const user      = getCurrentUser();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any[]>("/api/tickets/my")
      .then(d => setTickets(Array.isArray(d) ? d : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  const open     = tickets.filter(t => t.status === "open").length;
  const waiting  = tickets.filter(t => t.status === "waiting").length;
  const resolved = tickets.filter(t => ["resolved","closed"].includes(t.status)).length;
  const recent   = [...tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto", width: "100%" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "22px", fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.4px" }}>
          {greet()}, {user?.name?.split(" ")[0]}
        </Typography>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mt: 0.3 }}>{today()}</Typography>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: "Créer un ticket",      path: "/tickets/create",  icon: "plus",       color: C.accent,    bg: C.accentLight,            primary: true },
          { label: "Mes tickets",          path: "/tickets/my",      icon: "ticket",     color: "#3B82F6",   bg: "rgba(59,130,246,.10)" },
          { label: "Base de connaissances",path: "/knowledge-base",  icon: "books",      color: "#8B5CF6",   bg: "rgba(139,92,246,.10)" },
          { label: "Assistant IA",         path: "/ai-assistant",    icon: "robot",      color: C.warning,   bg: C.warningBg },
        ].map(a => (
          <Grid size={{ xs: 6, sm: 3 }} key={a.label}>
            <Box
              onClick={() => navigate(a.path)}
              sx={{ bgcolor: a.primary ? C.accent : "#fff", border: `1px solid ${a.primary ? C.accent : C.border}`, borderRadius: "14px", p: 2, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, textAlign: "center", transition: "all 0.18s", "&:hover": { transform: "translateY(-2px)", boxShadow: C.shadowMd, borderColor: a.color } }}
            >
              <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: a.primary ? "rgba(255,255,255,0.2)" : a.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box component="i" className={`ti ti-${a.icon}`} sx={{ fontSize: 20, color: a.primary ? "#fff" : a.color }} />
              </Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: a.primary ? "#fff" : C.textSecondary, lineHeight: 1.3 }}>
                {a.label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total",        value: tickets.length, icon: "ticket",       color: C.accent,  bg: C.accentLight,         sub: "Mes tickets", onClick: () => navigate("/tickets/my") },
          { label: "Ouverts",      value: open,           icon: "circle-dot",   color: "#3B82F6", bg: "rgba(59,130,246,.10)", sub: "En attente de traitement" },
          { label: "En attente",   value: waiting,        icon: "pause",        color: "#F59E0B", bg: "rgba(245,158,11,.10)", sub: "Informations demandées" },
          { label: "Résolus",      value: resolved,       icon: "circle-check", color: C.success, bg: C.successBg,           sub: "Terminés" },
        ].map(k => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={k.label}>
            {loading ? <SkeletonKPI /> : <KPI {...k} />}
          </Grid>
        ))}
      </Grid>

      {/* Recent tickets */}
      <CardShell title="Mes tickets récents" subtitle="Dernières demandes de support" icon="history" action={() => navigate("/tickets/my")}>
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={56} />)}
          </Box>
        ) : recent.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Box component="i" className="ti ti-ticket-off" sx={{ fontSize: 48, color: C.textMuted, display: "block", mb: 1.5 }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "15px", fontWeight: 600, color: C.textPrimary }}>Aucun ticket pour le moment</Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mt: 0.5, mb: 2 }}>
              Créez votre premier ticket si vous rencontrez un problème
            </Typography>
            <Box onClick={() => navigate("/tickets/create")} sx={{ display: "inline-flex", alignItems: "center", gap: 0.8, px: 2.5, py: 1, borderRadius: "10px", bgcolor: C.accent, cursor: "pointer", "&:hover": { bgcolor: C.accentHover } }}>
              <Box component="i" className="ti ti-plus" sx={{ fontSize: 15, color: "#fff" }} />
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: "#fff" }}>Créer un ticket</Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {recent.map((t: any, i: number) => (
              <Box
                key={t._id}
                onClick={() => navigate(`/tickets/${t._id}`)}
                sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5, px: 0.5, borderBottom: i < recent.length - 1 ? `1px solid ${C.divider}` : "none", cursor: "pointer", borderRadius: "8px", "&:hover": { bgcolor: C.bgPage }, transition: "background 0.12s" }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: STATUS_COLORS[t.status] ?? C.accent, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3 }}>
                    <StatusChip status={t.status} size="xs" />
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{fmtDate(t.createdAt)}</Typography>
                  </Box>
                </Box>
                <PriorityChip priority={t.priority} size="sm" />
                <Box component="i" className="ti ti-chevron-right" sx={{ fontSize: 14, color: C.textMuted, flexShrink: 0 }} />
              </Box>
            ))}
          </Box>
        )}
      </CardShell>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD — role router
// ═══════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const user   = getCurrentUser();
  const role   = user?.role ?? "user";
  const [period, setPeriod] = useState("30");

  if (role === "admin")  return <AdminDashboard  period={period} setPeriod={setPeriod} />;
  if (role === "leader") return <LeaderDashboard period={period} setPeriod={setPeriod} />;
  if (role === "tech")   return <TechDashboard />;
  return <EmployeeDashboard />;
}
