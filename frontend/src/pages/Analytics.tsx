// frontend/src/pages/Analytics.tsx
import { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Paper, Chip, CircularProgress, Button, MenuItem, Select, FormControl,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Download as DownloadIcon } from "@mui/icons-material";
import { C } from "../theme";

// ─── Types ───────────────────────────────────────────────────
interface KPIs {
  totalTickets: number;
  resolvedTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolutionRate: number;
  avgResolutionTime: number;
}

interface TechPerformance {
  _id: string;
  name: string;
  email: string;
  role: string;
  assigned: number;
  resolved: number;
  late: number;
  successRate: number;
  avgResolutionTime: number;
}

interface AnalyticsData {
  kpis: KPIs;
  ticketsByDay: { _id: string; created: number; resolved: number }[];
  statusDistribution: { _id: string; count: number }[];
  priorityDistribution: { _id: string; count: number }[];
  categoryDistribution: { _id: string; count: number }[];
  techPerformance: TechPerformance[];
}

// ─── Helpers ─────────────────────────────────────────────────
const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const STATUS_COLORS: Record<string, string> = {
  open: "#3B82F6",
  in_progress: "#F97316",
  resolved: "#22C55E",
  closed: "#94A3B8",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#22C55E",
  medium: "#3B82F6",
  high: "#F97316",
  critical: "#EF4444",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
  closed: "Fermé",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Haute",
  critical: "Critique",
};

const avatarColors = [
  { bg: C.accentLight, color: "#0E9188" },
  { bg: "rgba(59,130,246,0.12)", color: "#2563EB" },
  { bg: "rgba(249,115,22,0.12)", color: "#EA580C" },
  { bg: "rgba(124,58,237,0.12)", color: "#7C3AED" },
  { bg: "rgba(239,68,68,0.08)", color: "#DC2626" },
];

// ════════════════════════════════════════════════════════════
export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [exporting, setExporting] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [period]);

  // ── Export PDF ────────────────────────────────────────────
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow || !data) return;

      const periodLabel = period === "7" ? "7 derniers jours" : period === "30" ? "30 derniers jours" : "3 derniers mois";

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>TicketFlow Analytics Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', Arial, sans-serif; color: #0B162C; background: #fff; padding: 40px; }
            .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #5FC2BA; }
            .logo { width: 48px; height: 48px; background: #0B162C; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
            .title { font-size: 24px; font-weight: 700; color: #0B162C; }
            .subtitle { font-size: 13px; color: #94A3B8; margin-top: 4px; }
            .period-badge { background: rgba(95,194,186,0.1); color: #0E9188; border: 1px solid rgba(95,194,186,0.3); border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600; margin-left: auto; }
            .section-title { font-size: 13px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 16px; margin-top: 32px; }
            .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 8px; }
            .kpi-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; }
            .kpi-value { font-size: 32px; font-weight: 700; color: #0B162C; line-height: 1; }
            .kpi-label { font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; }
            .kpi-accent { color: #5FC2BA; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { background: #F8FAFC; padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E2E8F0; }
            td { padding: 12px 16px; font-size: 13px; color: #0B162C; border-bottom: 1px solid #E2E8F0; }
            tr:last-child td { border-bottom: none; }
            tr:hover td { background: #F8FAFC; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
            .badge-green { background: rgba(34,197,94,0.1); color: #16A34A; }
            .badge-orange { background: rgba(249,115,22,0.1); color: #EA580C; }
            .badge-red { background: rgba(239,68,68,0.08); color: #DC2626; }
            .badge-blue { background: rgba(59,130,246,0.1); color: #2563EB; }
            .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; display: flex; justify-content: space-between; }
            .dist-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .dist-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 8px; }
            .dist-label { font-size: 13px; font-weight: 500; color: #0B162C; }
            .dist-count { font-size: 16px; font-weight: 700; color: #5FC2BA; }
            .progress { height: 4px; background: #E2E8F0; border-radius: 2px; margin-top: 4px; }
            .progress-fill { height: 100%; border-radius: 2px; background: #5FC2BA; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:48px;height:48px;background:#0B162C;border-radius:10px;border:2px solid #5FC2BA;display:flex;align-items:center;justify-content:center">
                <svg width="26" height="26" viewBox="0 0 34 34" fill="none">
                  <polygon points="17,6 29,27 5,27" fill="#5FC2BA" opacity="0.95"/>
                  <circle cx="17" cy="17" r="3.5" fill="white" opacity="0.95"/>
                </svg>
              </div>
              <div>
                <div class="title">TicketFlow Analytics</div>
                <div class="subtitle">Rapport de performance — ${periodLabel}</div>
              </div>
            </div>
            <div class="period-badge">${periodLabel}</div>
          </div>

          <div class="section-title">KPIs Globaux</div>
          <div class="kpis">
            <div class="kpi-card">
              <div class="kpi-value">${data.kpis.totalTickets}</div>
              <div class="kpi-label">Total tickets</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value kpi-accent">${data.kpis.resolutionRate}%</div>
              <div class="kpi-label">Taux de résolution</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">${data.kpis.avgResolutionTime}h</div>
              <div class="kpi-label">Temps moyen résolution</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value" style="color:#22C55E">${data.kpis.resolvedTickets}</div>
              <div class="kpi-label">Résolus</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value" style="color:#3B82F6">${data.kpis.openTickets}</div>
              <div class="kpi-label">Ouverts</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value" style="color:#F97316">${data.kpis.inProgressTickets}</div>
              <div class="kpi-label">En cours</div>
            </div>
          </div>

          <div class="section-title">Distribution</div>
          <div class="dist-grid">
            <div>
              <div style="font-size:12px;font-weight:600;color:#94A3B8;margin-bottom:8px">PAR STATUT</div>
              ${data.statusDistribution.map(s => `
                <div class="dist-item">
                  <span class="dist-label">${STATUS_LABELS[s._id] ?? s._id}</span>
                  <span class="dist-count">${s.count}</span>
                </div>
              `).join('')}
            </div>
            <div>
              <div style="font-size:12px;font-weight:600;color:#94A3B8;margin-bottom:8px">PAR PRIORITÉ</div>
              ${data.priorityDistribution.map(p => `
                <div class="dist-item">
                  <span class="dist-label">${PRIORITY_LABELS[p._id] ?? p._id}</span>
                  <span class="dist-count">${p.count}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section-title">Performance par Technicien</div>
          <table>
            <thead>
              <tr>
                <th>Technicien</th>
                <th>Assignés</th>
                <th>Résolus</th>
                <th>En retard</th>
                <th>Taux succès</th>
                <th>Temps moy.</th>
              </tr>
            </thead>
            <tbody>
              ${data.techPerformance.map(t => `
                <tr>
                  <td><strong>${t.name}</strong><br><span style="font-size:11px;color:#94A3B8">${t.role}</span></td>
                  <td>${t.assigned}</td>
                  <td><span class="badge badge-green">${t.resolved}</span></td>
                  <td><span class="badge ${t.late > 0 ? 'badge-red' : 'badge-green'}">${t.late}</span></td>
                  <td><strong style="color:${t.successRate >= 70 ? '#16A34A' : t.successRate >= 40 ? '#EA580C' : '#DC2626'}">${t.successRate}%</strong></td>
                  <td>${t.avgResolutionTime}h</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">Top Catégories</div>
          <table>
            <thead>
              <tr><th>Catégorie</th><th>Nombre de tickets</th></tr>
            </thead>
            <tbody>
              ${data.categoryDistribution.map(c => `
                <tr>
                  <td style="text-transform:capitalize">${c._id}</td>
                  <td><strong>${c.count}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <span>TicketFlow — Rapport généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <span>Période : ${periodLabel}</span>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } catch (err) {
      console.log(err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: C.accent }} />
      </Box>
    );
  }

  if (!data) return null;

  const statusData = data.statusDistribution.map(s => ({
    name: STATUS_LABELS[s._id] ?? s._id,
    value: s.count,
    color: STATUS_COLORS[s._id] ?? C.accent,
  }));

  const priorityData = data.priorityDistribution.map(p => ({
    name: PRIORITY_LABELS[p._id] ?? p._id,
    value: p.count,
    color: PRIORITY_COLORS[p._id] ?? C.accent,
  }));

  const categoryData = data.categoryDistribution.map(c => ({
    name: c._id.charAt(0).toUpperCase() + c._id.slice(1),
    tickets: c.count,
  }));

  const lineData = data.ticketsByDay.map(d => ({
    date: new Date(d._id).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    Créés: d.created,
    Résolus: d.resolved,
  }));

  return (
    <Box ref={pageRef} sx={{ minHeight: "100vh", bgcolor: C.bgPage, fontFamily: "Inter, sans-serif", p: 3 }}>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.4rem", color: C.textPrimary }}>
            Analytics
          </Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: C.textMuted }}>
            Rapport de performance de votre plateforme
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          {/* Filtre période */}
          <FormControl size="small">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              sx={{
                fontFamily: "Inter, sans-serif", fontSize: 13, color: C.textPrimary,
                bgcolor: C.card, borderRadius: "10px",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: C.border },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: C.accent },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: C.accent },
              }}
            >
              <MenuItem value="7" sx={{ fontFamily: "Inter, sans-serif", fontSize: 13 }}>7 derniers jours</MenuItem>
              <MenuItem value="30" sx={{ fontFamily: "Inter, sans-serif", fontSize: 13 }}>30 derniers jours</MenuItem>
              <MenuItem value="90" sx={{ fontFamily: "Inter, sans-serif", fontSize: 13 }}>3 derniers mois</MenuItem>
            </Select>
          </FormControl>

          {/* Export PDF */}
          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={16} sx={{ color: C.navy }} /> : <DownloadIcon />}
            onClick={handleExportPDF}
            disabled={exporting}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.accent, color: "#fff", borderRadius: "10px", textTransform: "none", px: 2.5, "&:hover": { bgcolor: C.accentHover } }}
          >
            {exporting ? "Export..." : "Export PDF"}
          </Button>
        </Box>
      </Box>

      {/* ── KPIs ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2, mb: 3 }}>
        {[
          { label: "Total tickets",    value: data.kpis.totalTickets,       color: C.accent,  suffix: "" },
          { label: "Taux résolution",  value: data.kpis.resolutionRate,     color: "#16A34A", suffix: "%" },
          { label: "Temps moy.",       value: data.kpis.avgResolutionTime,  color: "#2563EB", suffix: "h" },
          { label: "Résolus",          value: data.kpis.resolvedTickets,    color: "#22C55E", suffix: "" },
          { label: "Ouverts",          value: data.kpis.openTickets,        color: "#3B82F6", suffix: "" },
          { label: "En cours",         value: data.kpis.inProgressTickets,  color: "#F97316", suffix: "" },
        ].map((kpi) => (
          <Paper key={kpi.label} sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2, transition: "all 0.2s", "&:hover": { borderColor: C.accent, transform: "translateY(-2px)" } }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.6rem", color: kpi.color, lineHeight: 1 }}>
              {kpi.value}{kpi.suffix}
            </Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", color: C.textMuted, mt: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {kpi.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* ── Graphiques Row 1 ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 2, mb: 2 }}>

        {/* Line Chart */}
        <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: C.textPrimary }}>
              Évolution des tickets
            </Typography>
            <Chip label="Période sélectionnée" size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, bgcolor: C.accentLight, color: C.accent, height: 20 }} />
          </Box>
          {lineData.length === 0 ? (
            <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted, fontSize: "0.875rem" }}>Aucune donnée pour cette période</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{ fontFamily: "Inter", fontSize: 11, fill: C.textMuted }} />
                <YAxis tick={{ fontFamily: "Inter", fontSize: 11, fill: C.textMuted }} />
                <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
                <Legend wrapperStyle={{ fontFamily: "Inter", fontSize: 12 }} />
                <Line type="monotone" dataKey="Créés" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Résolus" stroke={C.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Pie Chart statut */}
        <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2.5 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: C.textPrimary, mb: 2 }}>
            Par statut
          </Typography>
          {statusData.length === 0 ? (
            <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted, fontSize: "0.875rem" }}>Aucune donnée</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
                <Legend wrapperStyle={{ fontFamily: "Inter", fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>

      {/* ── Graphiques Row 2 ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>

        {/* Bar Chart catégories */}
        <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2.5 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: C.textPrimary, mb: 2 }}>
            Tickets par catégorie
          </Typography>
          {categoryData.length === 0 ? (
            <Box sx={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted, fontSize: "0.875rem" }}>Aucune donnée</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fontFamily: "Inter", fontSize: 11, fill: C.textMuted }} />
                <YAxis tick={{ fontFamily: "Inter", fontSize: 11, fill: C.textMuted }} />
                <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
                <Bar dataKey="tickets" fill={C.accent} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Bar Chart priorité */}
        <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2.5 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: C.textPrimary, mb: 2 }}>
            Par priorité
          </Typography>
          {priorityData.length === 0 ? (
            <Box sx={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted, fontSize: "0.875rem" }}>Aucune donnée</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fontFamily: "Inter", fontSize: 11, fill: C.textMuted }} />
                <YAxis tick={{ fontFamily: "Inter", fontSize: 11, fill: C.textMuted }} />
                <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>

      {/* ── Tableau Performance Techniciens ── */}
      <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden" }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.border}`, bgcolor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: C.textPrimary }}>
            Performance par technicien
          </Typography>
          <Chip label={`${data.techPerformance.length} membres`} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, bgcolor: C.accentLight, color: C.accent, height: 20 }} />
        </Box>

        {/* Table header */}
        <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", px: 2.5, py: 1.5, bgcolor: C.bgPage, borderBottom: `1px solid ${C.border}` }}>
          {["Technicien", "Assignés", "Résolus", "En retard", "Taux succès", "Temps moy."].map((h) => (
            <Typography key={h} sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.7rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {h}
            </Typography>
          ))}
        </Box>

        {/* Table rows */}
        {data.techPerformance.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted, fontSize: "0.875rem" }}>Aucune donnée</Typography>
          </Box>
        ) : (
          data.techPerformance.map((tech, index) => {
            const av = avatarColors[index % avatarColors.length];
            const rateColor = tech.successRate >= 70 ? "#16A34A" : tech.successRate >= 40 ? "#EA580C" : "#DC2626";
            return (
              <Box
                key={tech._id}
                sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", px: 2.5, py: 1.8, borderBottom: index < data.techPerformance.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", transition: "all 0.15s", "&:hover": { bgcolor: C.bgPage } }}
              >
                {/* Nom */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {getInitials(tech.name)}
                  </Box>
                  <Box>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.85rem", color: C.textPrimary }}>{tech.name}</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: C.textMuted, textTransform: "capitalize" }}>{tech.role}</Typography>
                  </Box>
                </Box>

                {/* Assignés */}
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.9rem", color: C.textPrimary }}>{tech.assigned}</Typography>

                {/* Résolus */}
                <Box sx={{ display: "inline-flex" }}>
                  <Chip label={tech.resolved} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: 700, bgcolor: "rgba(34,197,94,0.1)", color: "#16A34A", height: 22 }} />
                </Box>

                {/* En retard */}
                <Box sx={{ display: "inline-flex" }}>
                  <Chip label={tech.late} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: 700, bgcolor: tech.late > 0 ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.1)", color: tech.late > 0 ? "#DC2626" : "#16A34A", height: 22 }} />
                </Box>

                {/* Taux succès */}
                <Box>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: rateColor }}>{tech.successRate}%</Typography>
                  <Box sx={{ height: 3, bgcolor: C.border, borderRadius: 2, mt: 0.5, width: "80%" }}>
                    <Box sx={{ height: "100%", bgcolor: rateColor, borderRadius: 2, width: `${tech.successRate}%` }} />
                  </Box>
                </Box>

                {/* Temps moyen */}
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.85rem", color: C.textSecondary }}>{tech.avgResolutionTime}h</Typography>
              </Box>
            );
          })
        )}
      </Paper>
    </Box>
  );
}