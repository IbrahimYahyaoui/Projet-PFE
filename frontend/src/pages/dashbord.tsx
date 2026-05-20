// frontend/src/pages/dashbord.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { C, statusColors, priorityColors } from "../theme";
import { useCurrentUser } from "../App";

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

interface Ticket {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  createdBy: { _id: string; name: string };
  assignedTo: { _id: string; name: string } | null;
}

interface TechStat {
  id: string;
  name: string;
  resolved: number;
  assigned: number;
}

const getDayLabel = () => {
  const days = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  const months = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const d = new Date();
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

// ── Stat Card ──
const StatCard = ({ label, value, icon, color, bg, tag, tagColor, tagBg }: any) => (
  <Box
    sx={{
      bgcolor: "#fff",
      borderRadius: "14px",
      border: `1px solid ${C.border}`,
      p: "18px 20px",
      transition: "all 0.2s",
      cursor: "pointer",
      "&:hover": { boxShadow: C.shadowMd, transform: "translateY(-2px)" },
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </Typography>
      <Box sx={{ width: 32, height: 32, borderRadius: "9px", bgcolor: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box component="i" className={`ti ti-${icon}`} sx={{ fontSize: 17, color }} />
      </Box>
    </Box>
    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "28px", fontWeight: 700, color, lineHeight: 1, mb: 1 }}>
      {value}
    </Typography>
    <Box sx={{ display: "inline-flex", bgcolor: tagBg, borderRadius: "20px", px: 1.2, py: 0.4 }}>
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: tagColor }}>
        {tag}
      </Typography>
    </Box>
  </Box>
);

// ── Quick Action ──
const QuickAction = ({ icon, label, color, bg, onClick }: any) => (
  <Box
    onClick={onClick}
    sx={{
      bgcolor: "#fff",
      borderRadius: "12px",
      border: `1px solid ${C.border}`,
      p: 2,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 1,
      cursor: "pointer",
      transition: "all 0.18s",
      "&:hover": { borderColor: color, bgcolor: bg, transform: "translateY(-2px)", boxShadow: C.shadow },
    }}
  >
    <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Box component="i" className={`ti ti-${icon}`} sx={{ fontSize: 21, color }} />
    </Box>
    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500, color: C.textSecondary, textAlign: "center" }}>
      {label}
    </Typography>
  </Box>
);

export default function Dashbord() {
  const navigate = useNavigate();
  const user     = useCurrentUser();
  const isAdmin  = user?.role === "admin";
  const isTech   = user?.role === "tech";

  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token    = localStorage.getItem("token");
        const endpoint = isAdmin ? "/api/tickets/all" : isTech ? "/api/tickets/assigned" : "/api/tickets/my";
        const res      = await fetch(`${apiUrl}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
        const data     = await res.json();
        if (res.ok) setTickets(data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // ── Stats ──
  const total      = tickets.length;
  const open       = tickets.filter(t => t.status === "open").length;
  const inProgress = tickets.filter(t => t.status === "in_progress").length;
  const resolved   = tickets.filter(t => t.status === "resolved").length;
  const closed     = tickets.filter(t => t.status === "closed").length;
  const critical   = tickets.filter(t => t.priority === "critical").length;
  const resRate    = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // ── Health score ──
  const healthScore = total > 0 ? Math.round(
    ((resolved / total) * 40) +
    ((1 - critical / Math.max(total, 1)) * 30) +
    ((inProgress / Math.max(total, 1)) * 30)
  ) : 0;
  const resolveRate  = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const responseRate = total > 0 ? Math.round(((resolved + inProgress) / total) * 100) : 0;
  const satisfRate   = total > 0 ? Math.round(((total - critical) / total) * 100) : 100;

  // ── Chart: 7 derniers jours ──
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
    const count = tickets.filter(t => new Date(t.createdAt).toDateString() === d.toDateString()).length;
    return { label, count };
  });

  // ── Chart: Status ──
  const statusData = [
    { name: "Ouvert",   value: open,       color: "#3B82F6" },
    { name: "En cours", value: inProgress, color: "#F97316" },
    { name: "Résolu",   value: resolved,   color: "#22C55E" },
    { name: "Fermé",    value: closed,     color: "#94A3B8" },
  ].filter(d => d.value > 0);

  // ── Tech performance ──
  const techStats: TechStat[] = [];
  if (isAdmin) {
    const techMap: Record<string, TechStat> = {};
    tickets.forEach(t => {
      if (t.assignedTo) {
        const id   = t.assignedTo._id;
        const name = t.assignedTo.name;
        if (!techMap[id]) techMap[id] = { id, name, resolved: 0, assigned: 0 };
        techMap[id].assigned++;
        if (t.status === "resolved" || t.status === "closed") techMap[id].resolved++;
      }
    });
    Object.values(techMap).sort((a, b) => b.resolved - a.resolved).slice(0, 4).forEach(t => techStats.push(t));
  }

  // ── Recent tickets ──
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const avatarColors = [
    { bg: "rgba(95,194,186,0.15)",  color: "#0E9188" },
    { bg: "rgba(59,130,246,0.15)",  color: "#2563EB" },
    { bg: "rgba(249,115,22,0.15)",  color: "#EA580C" },
    { bg: "rgba(124,58,237,0.15)",  color: "#7C3AED" },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: C.accent }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: "28px 32px", fontFamily: "Inter, sans-serif", bgcolor: "#F4F6FA", minHeight: "100%" }}>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "22px", fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.3px" }}>
            {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mt: 0.4 }}>
            {getDayLabel()}
          </Typography>
        </Box>
        <Button
          onClick={() => navigate("/tickets/create")}
          sx={{ bgcolor: "#3B82F6", color: "#fff", borderRadius: "10px", px: 2.5, py: 1.2, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "none", display: "flex", alignItems: "center", gap: 1, "&:hover": { bgcolor: "#2563EB" }, boxShadow: "0 4px 14px rgba(59,130,246,0.30)" }}
        >
          <Box component="i" className="ti ti-plus" sx={{ fontSize: 17 }} />
          Nouveau Ticket
        </Button>
      </Box>

      {/* ── Alert ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5, mt: 1 }}>
        {critical > 0 ? (
          <>
            <Box component="i" className="ti ti-alert-circle" sx={{ fontSize: 15, color: "#EF4444" }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#EF4444", fontWeight: 500 }}>
              {critical} ticket{critical > 1 ? "s" : ""} critique{critical > 1 ? "s" : ""} nécessite{critical > 1 ? "nt" : ""} votre attention
            </Typography>
          </>
        ) : (
          <>
            <Box component="i" className="ti ti-circle-check" sx={{ fontSize: 15, color: "#16A34A" }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#16A34A" }}>
              Tout est sous contrôle — aucun ticket critique
            </Typography>
          </>
        )}
      </Box>

      {/* ── KPI Cards ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2.5 }}>
        <StatCard label="Total Tickets" value={total}      icon="ticket"       color="#0E9188" bg="rgba(95,194,186,0.10)"  tag="+12% ce mois"                                          tagColor="#0E9188"  tagBg="rgba(95,194,186,0.10)" />
        <StatCard label="Ouverts"       value={open}       icon="circle-dot"   color="#2563EB" bg="rgba(59,130,246,0.10)"  tag={`${open} actif${open > 1 ? "s" : ""}`}                tagColor="#2563EB"  tagBg="rgba(59,130,246,0.10)" />
        <StatCard label="En Cours"      value={inProgress} icon="clock"        color="#EA580C" bg="rgba(249,115,22,0.10)"  tag={critical > 0 ? `${critical} urgent${critical>1?"s":""}` : "Aucun urgent"} tagColor="#EA580C" tagBg="rgba(249,115,22,0.10)" />
        <StatCard label="Résolus"       value={resolved}   icon="circle-check" color="#16A34A" bg="rgba(34,197,94,0.10)"   tag={`${resRate}% taux`}                                   tagColor="#16A34A"  tagBg="rgba(34,197,94,0.10)" />
      </Box>

      {/* ── Health Score ── */}
      <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "20px 24px", display: "flex", gap: 3, alignItems: "center", mb: 2.5 }}>
        {/* Ring */}
        <Box sx={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="40" cy="40" r="32" fill="none" stroke="#EEF1F8" strokeWidth="7" />
            <circle cx="40" cy="40" r="32" fill="none" stroke="#5FC2BA" strokeWidth="7" strokeLinecap="round"
              strokeDasharray="201"
              strokeDashoffset={201 - (201 * healthScore) / 100}
            />
          </svg>
          <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "19px", fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>{healthScore}%</Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>santé</Typography>
          </Box>
        </Box>

        {/* Bars */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.2 }}>
          {[
            { label: "Taux résolution", value: resolveRate,  color: "#5FC2BA" },
            { label: "Temps réponse",   value: responseRate, color: "#3B82F6" },
            { label: "Satisfaction",    value: satisfRate,   color: "#22C55E" },
          ].map((bar) => (
            <Box key={bar.label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#64748B", width: 110, flexShrink: 0 }}>{bar.label}</Typography>
              <Box sx={{ flex: 1, height: 6, bgcolor: "#F0F4FA", borderRadius: "3px", overflow: "hidden" }}>
                <Box sx={{ height: "100%", width: `${bar.value}%`, bgcolor: bar.color, borderRadius: "3px", transition: "width 0.6s ease" }} />
              </Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textPrimary, width: 34, textAlign: "right" }}>{bar.value}%</Typography>
            </Box>
          ))}
        </Box>

        {/* Stats */}
        <Box sx={{ display: "flex", gap: 2.5, pl: 2.5, borderLeft: `1px solid ${C.border}` }}>
          {[
            { label: "Actifs",    value: open + inProgress, color: "#3B82F6" },
            { label: "Critiques", value: critical,           color: "#EF4444" },
            { label: "Résolus",   value: resolved,           color: "#22C55E" },
          ].map((s) => (
            <Box key={s.label} sx={{ textAlign: "center" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", mb: 0.5 }}>{s.label}</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Quick Actions ── */}
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.2 }}>
        Actions rapides
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5, mb: 2.5 }}>
        <QuickAction icon="plus"         label="Nouveau Ticket"  color="#2563EB" bg="rgba(59,130,246,0.08)"  onClick={() => navigate("/tickets/create")} />
        <QuickAction icon="list-details" label="Mes Tickets"     color="#0E9188" bg="rgba(95,194,186,0.08)"  onClick={() => navigate("/tickets/my")} />
        <QuickAction icon="users-group"  label="Mon Équipe"      color="#EA580C" bg="rgba(249,115,22,0.08)"  onClick={() => navigate("/team")} />
        <QuickAction icon="chart-bar"    label="Analytics"       color="#7C3AED" bg="rgba(124,58,237,0.08)" onClick={() => navigate("/analytics")} />
      </Box>

      {/* ── Charts + Recent ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 2, mb: 2.5 }}>

        {/* Activité 7 jours */}
        <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "20px 20px 14px" }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, mb: 0.3 }}>
            Activité — 7 derniers jours
          </Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, mb: 2 }}>
            Tickets créés par jour
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={last7} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" vertical={false} />
              <XAxis dataKey="label" tick={{ fontFamily: "Inter, sans-serif", fontSize: 11, fill: "#8896AB" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: "Inter, sans-serif", fontSize: 11, fill: "#8896AB" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
              <Bar dataKey="count" name="Tickets" fill="#5FC2BA" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Status Pie */}
        <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "20px" }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, mb: 0.3 }}>Statuts</Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, mb: 1 }}>Distribution actuelle</Typography>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={38} outerRadius={56} dataKey="value" strokeWidth={0}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.7, mt: 1 }}>
                {statusData.map((d, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: d.color }} />
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary }}>{d.name}</Typography>
                    </Box>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textPrimary }}>{d.value}</Typography>
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>Aucune donnée</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Recent Tickets + Team ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: isAdmin && techStats.length > 0 ? "1fr 1fr" : "1fr", gap: 2 }}>

        {/* Tickets récents */}
        <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>Tickets récents</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Les 5 derniers tickets</Typography>
            </Box>
            <Box onClick={() => navigate(isAdmin ? "/tickets/all" : "/tickets/my")} sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.accent }}>Voir tout</Typography>
              <Box component="i" className="ti ti-arrow-right" sx={{ fontSize: 13, color: C.accent }} />
            </Box>
          </Box>
          {recentTickets.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Box component="i" className="ti ti-inbox" sx={{ fontSize: 36, color: C.textMuted, display: "block", mb: 1 }} />
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>Aucun ticket</Typography>
            </Box>
          ) : (
            recentTickets.map((ticket, i) => (
              <Box key={ticket._id} onClick={() => navigate(`/tickets/${ticket._id}`)}
                sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.5, cursor: "pointer", borderBottom: i < recentTickets.length - 1 ? `1px solid ${C.divider}` : "none", transition: "all 0.12s", "&:hover": { bgcolor: "#FAFBFD" } }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: statusColors[ticket.status]?.text ?? C.accent, flexShrink: 0 }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 500, color: C.textPrimary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ticket.title}
                </Typography>
                <Box sx={{ px: 1.2, py: 0.3, borderRadius: "20px", bgcolor: priorityColors[ticket.priority]?.bg, border: `1px solid ${priorityColors[ticket.priority]?.border}`, flexShrink: 0 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: priorityColors[ticket.priority]?.text, textTransform: "capitalize" }}>
                    {ticket.priority}
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, flexShrink: 0 }}>
                  {new Date(ticket.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </Typography>
                <Box component="i" className="ti ti-chevron-right" sx={{ fontSize: 14, color: C.textMuted, flexShrink: 0 }} />
              </Box>
            ))
          )}
        </Box>

        {/* Team Performance (admin only) */}
        {isAdmin && techStats.length > 0 && (
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.divider}` }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>Performance équipe</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Tickets résolus par technicien</Typography>
            </Box>
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.2 }}>
              {techStats.map((tech, i) => {
                const av = avatarColors[i % avatarColors.length];
                const rate = tech.assigned > 0 ? Math.round((tech.resolved / tech.assigned) * 100) : 0;
                return (
                  <Box key={tech.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "10px 14px", bgcolor: "#F8FAFB", borderRadius: "10px" }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: av.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: av.color }}>
                        {getInitials(tech.name)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>{tech.name}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                        <Box sx={{ flex: 1, height: 4, bgcolor: "#EEF1F8", borderRadius: "2px", overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${rate}%`, bgcolor: C.accent, borderRadius: "2px" }} />
                        </Box>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{rate}%</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "18px", fontWeight: 700, color: C.accent, lineHeight: 1 }}>{tech.resolved}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>résolus</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>

    </Box>
  );
}