// frontend/src/pages/Team.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Alert } from "@mui/material";
import { C, statusColors, priorityColors } from "../theme";
import { useCurrentUser } from "../App";

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

// ── Types ──
interface Member {
  _id: string;
  name: string;
  email: string;
  role: string;
  assigned: number;
  resolved: number;
  active: number;
  chargePercent: number;
  availability: "available" | "busy" | "overloaded";
}

interface TeamData {
  _id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  leaderId: { _id: string; name: string; role: string };
  members: any[];
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    members: number;
  };
}

interface Ticket {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  createdBy: { name: string };
  assignedTo: { _id: string; name: string } | null;
}

// ── Helpers ──
const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const getCategoryConfig = (cat: string) => {
  const map: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    network:  { label: "Réseau",   icon: "wifi",         color: "#2563EB", bg: "rgba(59,130,246,0.10)"  },
    hardware: { label: "Hardware", icon: "cpu",          color: "#EA580C", bg: "rgba(249,115,22,0.10)"  },
    software: { label: "Software", icon: "code",         color: "#7C3AED", bg: "rgba(124,58,237,0.10)"  },
    access:   { label: "Accès",    icon: "lock",         color: "#EF4444", bg: "rgba(239,68,68,0.08)"   },
    other:    { label: "Autre",    icon: "dots-circle",  color: "#8896AB", bg: "rgba(148,163,184,0.10)" },
    general:  { label: "Général",  icon: "users-group",  color: "#0E9188", bg: "rgba(95,194,186,0.10)"  },
  };
  return map[cat] ?? map.general;
};

const getAvailabilityConfig = (av: string) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    available:  { label: "Disponible", color: "#16A34A", bg: "rgba(34,197,94,0.10)"  },
    busy:       { label: "Occupé",     color: "#EA580C", bg: "rgba(249,115,22,0.10)" },
    overloaded: { label: "Chargé",     color: "#DC2626", bg: "rgba(239,68,68,0.08)"  },
  };
  return map[av] ?? map.available;
};

const avatarColors = [
  { bg: "rgba(95,194,186,0.15)",  color: "#0E9188" },
  { bg: "rgba(59,130,246,0.15)",  color: "#2563EB" },
  { bg: "rgba(249,115,22,0.15)",  color: "#EA580C" },
  { bg: "rgba(124,58,237,0.15)",  color: "#7C3AED" },
  { bg: "rgba(239,68,68,0.12)",   color: "#DC2626" },
];

// ════════════════════════════════════════════════
// ADMIN VIEW
// ════════════════════════════════════════════════
const AdminTeamView = () => {
  const navigate = useNavigate();
  const [teams,          setTeams]          = useState<TeamData[]>([]);
  const [selectedTeam,   setSelectedTeam]   = useState<TeamData | null>(null);
  const [members,        setMembers]        = useState<Member[]>([]);
  const [teamTickets,    setTeamTickets]    = useState<Ticket[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [createDialog,   setCreateDialog]   = useState(false);
  const [formError,      setFormError]      = useState<string | null>(null);
  const [formLoading,    setFormLoading]    = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "network", color: "#5FC2BA" });

  const token = localStorage.getItem("token");

  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${apiUrl}/api/team/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setTeams(data);
        if (data.length > 0) selectTeam(data[0]);
      }
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const selectTeam = async (team: TeamData) => {
    setSelectedTeam(team);
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem("token");
      // Fetch members with stats
      const res = await fetch(`${apiUrl}/api/team/all`, { headers: { Authorization: `Bearer ${token}` } });
      const all = await res.json();
      const found = all.find((t: any) => t._id === team._id);
      if (found) {
        setMembers(found.members ?? []);
      }
      // Fetch team tickets via category
      const tRes = await fetch(`${apiUrl}/api/tickets/all`, { headers: { Authorization: `Bearer ${token}` } });
      const tData = await tRes.json();
      if (tRes.ok) {
        setTeamTickets(tData.filter((t: Ticket) => t.category === team.category).slice(0, 6));
      }
    } catch (err) { console.log(err); }
    finally { setLoadingDetails(false); }
  };

  const handleCreateTeam = async () => {
    if (!form.name.trim()) { setFormError("Le nom est requis"); return; }
    setFormLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.message); return; }
      setCreateDialog(false);
      setForm({ name: "", description: "", category: "network", color: "#5FC2BA" });
      fetchTeams();
    } catch (err) { setFormError("Erreur serveur"); }
    finally { setFormLoading(false); }
  };

  if (loading) return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <CircularProgress sx={{ color: C.accent }} />
    </Box>
  );

  return (
    <Box sx={{ p: "28px 32px", fontFamily: "Inter, sans-serif", bgcolor: "#F4F6FA", minHeight: "100%" }}>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 700, color: C.textPrimary }}>
            Gestion des Équipes
          </Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mt: 0.4 }}>
            {teams.length} équipe{teams.length > 1 ? "s" : ""} — organisées par catégorie de tickets
          </Typography>
        </Box>
        <Button
          onClick={() => setCreateDialog(true)}
          sx={{ bgcolor: "#3B82F6", color: "#fff", borderRadius: "10px", px: 2.5, py: 1.2, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "none", display: "flex", alignItems: "center", gap: 1, "&:hover": { bgcolor: "#2563EB" }, boxShadow: "0 4px 14px rgba(59,130,246,0.30)" }}
        >
          <Box component="i" className="ti ti-plus" sx={{ fontSize: 17 }} />
          Nouvelle équipe
        </Button>
      </Box>

      {/* ── Workflow Banner ── */}
      <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "16px 20px", mb: 2.5, display: "flex", alignItems: "center", gap: 0 }}>
        {[
          { icon: "user",         label: "Employé",        sub: "Crée le ticket",    color: "#2563EB", bg: "rgba(59,130,246,0.10)" },
          { icon: "cpu",          label: "Catégorie",      sub: "Définit l'équipe",  color: "#EA580C", bg: "rgba(249,115,22,0.10)" },
          { icon: "users-group",  label: "Équipe",         sub: "Reçoit le ticket",  color: "#0E9188", bg: "rgba(95,194,186,0.10)" },
          { icon: "user-check",   label: "Technicien",     sub: "Prend en charge",   color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
          { icon: "circle-check", label: "Résolu",         sub: "Ticket fermé",      color: "#16A34A", bg: "rgba(34,197,94,0.10)"  },
        ].map((step, i, arr) => (
          <Box key={step.label} sx={{ flex: 1, display: "flex", alignItems: "center" }}>
            <Box sx={{ flex: 1, textAlign: "center" }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "11px", bgcolor: step.bg, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 0.8 }}>
                <Box component="i" className={`ti ti-${step.icon}`} sx={{ fontSize: 19, color: step.color }} />
              </Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textPrimary }}>{step.label}</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{step.sub}</Typography>
            </Box>
            {i < arr.length - 1 && (
              <Box component="i" className="ti ti-arrow-right" sx={{ fontSize: 16, color: C.borderStrong, flexShrink: 0, mx: 0.5 }} />
            )}
          </Box>
        ))}
      </Box>

      {/* ── Teams Grid ── */}
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.2 }}>
        Équipes
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5, mb: 2.5 }}>
        {teams.length === 0 ? (
          <Box sx={{ gridColumn: "span 3", textAlign: "center", py: 4 }}>
            <Box component="i" className="ti ti-users-group" sx={{ fontSize: 40, color: C.textMuted, display: "block", mb: 1 }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>
              Aucune équipe — créez votre première équipe
            </Typography>
          </Box>
        ) : teams.map((team) => {
          const catConf = getCategoryConfig(team.category);
          const isActive = selectedTeam?._id === team._id;
          return (
            <Box
              key={team._id}
              onClick={() => selectTeam(team)}
              sx={{
                bgcolor: "#fff", borderRadius: "14px",
                border: isActive ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                overflow: "hidden", cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: isActive ? `0 0 0 3px ${C.accentLight}` : "none",
                "&:hover": { boxShadow: isActive ? `0 0 0 3px ${C.accentLight}` : C.shadow, transform: "translateY(-2px)" },
              }}
            >
              {/* Header */}
              <Box sx={{ p: "14px 16px 12px", display: "flex", alignItems: "center", gap: 1.5, borderBottom: `1px solid ${C.divider}` }}>
                <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: catConf.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Box component="i" className={`ti ti-${catConf.icon}`} sx={{ fontSize: 19, color: catConf.color }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary }}>{team.name}</Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>Catégorie : {catConf.label}</Typography>
                </Box>
                {isActive && <Box component="i" className="ti ti-check" sx={{ fontSize: 16, color: C.accent }} />}
              </Box>
              {/* Stats */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
                {[
                  { label: "Ouverts",  value: team.stats?.open ?? 0,     color: "#F97316" },
                  { label: "Résolus",  value: team.stats?.resolved ?? 0, color: "#22C55E" },
                  { label: "Membres",  value: team.stats?.members ?? 0,  color: "#3B82F6" },
                ].map((s, i) => (
                  <Box key={s.label} sx={{ py: 1.2, px: 1, textAlign: "center", borderRight: i < 2 ? `1px solid ${C.divider}` : "none" }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "18px", fontWeight: 700, color: s.color }}>{s.value}</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* ── Team Details ── */}
      {selectedTeam && (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>

          {/* Members */}
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>
                  Membres — {selectedTeam.name}
                </Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>
                  Performance et charge de travail
                </Typography>
              </Box>
            </Box>
            {loadingDetails ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} sx={{ color: C.accent }} />
              </Box>
            ) : members.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Box component="i" className="ti ti-users" sx={{ fontSize: 32, color: C.textMuted, display: "block", mb: 1 }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>Aucun membre</Typography>
              </Box>
            ) : (
              members.map((member, i) => {
                const av  = getAvailabilityConfig(member.availability ?? "available");
                const col = avatarColors[i % avatarColors.length];
                const chargeColor = (member.chargePercent ?? 0) >= 80 ? "#EF4444" : (member.chargePercent ?? 0) >= 50 ? "#F97316" : "#22C55E";
                return (
                  <Box key={member._id} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.5, borderBottom: `1px solid ${C.divider}`, "&:last-child": { borderBottom: "none" }, transition: "background 0.12s", "&:hover": { bgcolor: "#FAFBFD" } }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: "50%", bgcolor: col.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: col.color }}>
                        {getInitials(member.name)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>{member.name}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                        <Box sx={{ flex: 1, height: 5, bgcolor: "#F0F4FA", borderRadius: "3px", overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${member.chargePercent ?? 0}%`, bgcolor: chargeColor, borderRadius: "3px", transition: "width 0.6s ease" }} />
                        </Box>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, width: 28, textAlign: "right" }}>
                          {member.chargePercent ?? 0}%
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: "center", minWidth: 44 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: 700, color: C.accent, lineHeight: 1 }}>{member.resolved ?? 0}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>résolus</Typography>
                    </Box>
                    <Box sx={{ px: 1.2, py: 0.3, borderRadius: "20px", bgcolor: av.bg, flexShrink: 0 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: av.color }}>{av.label}</Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>

          {/* Team Tickets */}
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>
                  Tickets — {getCategoryConfig(selectedTeam.category).label}
                </Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>
                  Tickets de cette catégorie
                </Typography>
              </Box>
              <Box onClick={() => navigate("/tickets/all")} sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.accent }}>Voir tout</Typography>
                <Box component="i" className="ti ti-arrow-right" sx={{ fontSize: 13, color: C.accent }} />
              </Box>
            </Box>
            {loadingDetails ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} sx={{ color: C.accent }} />
              </Box>
            ) : teamTickets.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Box component="i" className="ti ti-inbox" sx={{ fontSize: 32, color: C.textMuted, display: "block", mb: 1 }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>Aucun ticket</Typography>
              </Box>
            ) : (
              teamTickets.map((ticket, i) => (
                <Box key={ticket._id} onClick={() => navigate(`/tickets/${ticket._id}`)}
                  sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.4, borderBottom: i < teamTickets.length - 1 ? `1px solid ${C.divider}` : "none", cursor: "pointer", transition: "background 0.12s", "&:hover": { bgcolor: "#FAFBFD" } }}
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
                    {ticket.assignedTo ? `→ ${ticket.assignedTo.name.split(" ")[0]}` : "Non assigné"}
                  </Typography>
                  <Box component="i" className="ti ti-chevron-right" sx={{ fontSize: 14, color: C.textMuted, flexShrink: 0 }} />
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      {/* ── Create Team Dialog ── */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} PaperProps={{ sx: { borderRadius: "16px", minWidth: 440 } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "16px", color: C.textPrimary, pb: 1 }}>
          Nouvelle équipe
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {formError && <Alert severity="error" sx={{ borderRadius: "10px" }}>{formError}</Alert>}
          <TextField label="Nom de l'équipe" fullWidth value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" } }} />
          <TextField label="Description" fullWidth multiline rows={2} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" } }} />
          <TextField select label="Catégorie de tickets" fullWidth value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" } }}>
            {[
              { value: "network",  label: "Réseau" },
              { value: "hardware", label: "Hardware" },
              { value: "software", label: "Software" },
              { value: "access",   label: "Accès / Sécurité" },
              { value: "other",    label: "Autre" },
              { value: "general",  label: "Général" },
            ].map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: "Inter, sans-serif" }}>{opt.label}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setCreateDialog(false)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none" }}>
            Annuler
          </Button>
          <Button onClick={handleCreateTeam} disabled={formLoading} variant="contained"
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: "#3B82F6", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { bgcolor: "#2563EB" } }}>
            {formLoading ? "Création..." : "Créer l'équipe"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

// ════════════════════════════════════════════════
// TECH VIEW
// ════════════════════════════════════════════════
const TechTeamView = () => {
  const navigate = useNavigate();
  const [data,    setData]    = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [teamRes, ticketRes] = await Promise.all([
          fetch(`${apiUrl}/api/team/my`,         { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/team/my/tickets`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (teamRes.ok)   setData(await teamRes.json());
        if (ticketRes.ok) setTickets(await ticketRes.json());
      } catch (err) { console.log(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <CircularProgress sx={{ color: C.accent }} />
    </Box>
  );

  if (!data) return (
    <Box sx={{ p: "28px 32px", textAlign: "center" }}>
      <Box component="i" className="ti ti-users-group" sx={{ fontSize: 48, color: C.textMuted, display: "block", mb: 2 }} />
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: 600, color: C.textPrimary, mb: 1 }}>
        Vous n'êtes dans aucune équipe
      </Typography>
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>
        Contactez votre administrateur pour être ajouté à une équipe
      </Typography>
    </Box>
  );

  const catConf = getCategoryConfig(data.team?.category ?? "general");
  const openTickets     = tickets.filter(t => t.status === "open");
  const inProgTickets   = tickets.filter(t => t.status === "in_progress");
  const resolvedTickets = tickets.filter(t => ["resolved","closed"].includes(t.status));

  return (
    <Box sx={{ p: "28px 32px", fontFamily: "Inter, sans-serif", bgcolor: "#F4F6FA", minHeight: "100%" }}>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: "13px", bgcolor: catConf.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Box component="i" className={`ti ti-${catConf.icon}`} sx={{ fontSize: 24, color: catConf.color }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 700, color: C.textPrimary }}>{data.team?.name}</Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>Équipe {catConf.label} — {data.members?.length ?? 0} membres</Typography>
          </Box>
        </Box>
        <Button onClick={() => navigate("/tickets/create")}
          sx={{ bgcolor: "#3B82F6", color: "#fff", borderRadius: "10px", px: 2.5, py: 1.2, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "none", display: "flex", alignItems: "center", gap: 1, "&:hover": { bgcolor: "#2563EB" } }}>
          <Box component="i" className="ti ti-plus" sx={{ fontSize: 17 }} />
          Nouveau Ticket
        </Button>
      </Box>

      {/* KPIs */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 2.5 }}>
        {[
          { label: "Tickets ouverts",  value: openTickets.length,     color: "#2563EB", bg: "rgba(59,130,246,0.10)",  icon: "circle-dot"    },
          { label: "En cours",         value: inProgTickets.length,    color: "#EA580C", bg: "rgba(249,115,22,0.10)",  icon: "clock"         },
          { label: "Résolus",          value: resolvedTickets.length,  color: "#16A34A", bg: "rgba(34,197,94,0.10)",   icon: "circle-check"  },
        ].map((kpi) => (
          <Box key={kpi.label} sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "16px 20px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{kpi.label}</Typography>
              <Box sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box component="i" className={`ti ti-${kpi.icon}`} sx={{ fontSize: 16, color: kpi.color }} />
              </Box>
            </Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "26px", fontWeight: 700, color: kpi.color }}>{kpi.value}</Typography>
          </Box>
        ))}
      </Box>

      {/* Members + Tickets */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>

        {/* Members */}
        <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.divider}` }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>Mes collègues</Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Charge de travail actuelle</Typography>
          </Box>
          {(data.members ?? []).map((member: Member, i: number) => {
            const col = avatarColors[i % avatarColors.length];
            const av  = getAvailabilityConfig(member.availability ?? "available");
            return (
              <Box key={member._id} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.5, borderBottom: `1px solid ${C.divider}`, "&:last-child": { borderBottom: "none" } }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: col.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: col.color }}>{getInitials(member.name)}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>{member.name}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <Box sx={{ flex: 1, height: 4, bgcolor: "#F0F4FA", borderRadius: "2px", overflow: "hidden" }}>
                      <Box sx={{ height: "100%", width: `${member.chargePercent ?? 0}%`, bgcolor: C.accent, borderRadius: "2px" }} />
                    </Box>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>{member.chargePercent ?? 0}%</Typography>
                  </Box>
                </Box>
                <Box sx={{ px: 1.2, py: 0.3, borderRadius: "20px", bgcolor: av.bg }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: av.color }}>{av.label}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Team Tickets */}
        <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>Tickets de l'équipe</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Catégorie {catConf.label}</Typography>
            </Box>
            <Box onClick={() => navigate("/tickets/assigned")} sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.accent }}>Mes tickets</Typography>
              <Box component="i" className="ti ti-arrow-right" sx={{ fontSize: 13, color: C.accent }} />
            </Box>
          </Box>
          {tickets.slice(0, 6).map((ticket, i) => (
            <Box key={ticket._id} onClick={() => navigate(`/tickets/${ticket._id}`)}
              sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.4, borderBottom: i < Math.min(tickets.length, 6) - 1 ? `1px solid ${C.divider}` : "none", cursor: "pointer", transition: "background 0.12s", "&:hover": { bgcolor: "#FAFBFD" } }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: statusColors[ticket.status]?.text ?? C.accent, flexShrink: 0 }} />
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 500, color: C.textPrimary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.title}</Typography>
              <Box sx={{ px: 1.2, py: 0.3, borderRadius: "20px", bgcolor: priorityColors[ticket.priority]?.bg, flexShrink: 0 }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: priorityColors[ticket.priority]?.text, textTransform: "capitalize" }}>{ticket.priority}</Typography>
              </Box>
              <Box component="i" className="ti ti-chevron-right" sx={{ fontSize: 14, color: C.textMuted, flexShrink: 0 }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// ════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════
export default function Team() {
  const user = useCurrentUser();
  if (user?.role === "admin") return <AdminTeamView />;
  return <TechTeamView />;
}