// frontend/src/pages/Team.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  LinearProgress,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { C, priorityColors, statusColors } from "../theme";

// ─── Types ───────────────────────────────────────────────────
interface Member {
  _id: string;
  name: string;
  email: string;
  role: string;
  assigned: number;
  resolved: number;
  availability: "available" | "busy" | "overloaded";
  chargePercent: number;
}

interface Team {
  _id: string;
  name: string;
  description: string;
  leaderId: { _id: string; name: string; role: string };
  createdAt: string;
}

interface TeamData {
  team: Team;
  members: Member[];
  stats: {
    totalActive: number;
    totalResolved: number;
    totalLate: number;
    totalMembers: number;
  };
}

interface Ticket {
  _id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface Message {
  _id: string;
  userId: { _id: string; name: string; role: string };
  content: string;
  createdAt: string;
}

interface AvailableUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// ─── Helpers ─────────────────────────────────────────────────
const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours}h`;
  return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

const availabilityConfig = {
  available:  { label: "Disponible", color: "#16A34A", bg: "rgba(34,197,94,0.1)",   dot: "#22C55E" },
  busy:       { label: "Occupé",     color: "#EA580C", bg: "rgba(249,115,22,0.1)",  dot: "#F97316" },
  overloaded: { label: "Surchargé",  color: "#DC2626", bg: "rgba(239,68,68,0.08)", dot: "#EF4444" },
};

const chargeColor = (percent: number) => {
  if (percent <= 40) return "#22C55E";
  if (percent <= 70) return "#F97316";
  return "#EF4444";
};

const avatarColors: Record<string, { bg: string; color: string }> = {
  admin: { bg: C.accentLight,            color: "#0E9188" },
  tech:  { bg: "rgba(59,130,246,0.12)",  color: "#2563EB" },
  user:  { bg: "rgba(124,58,237,0.12)",  color: "#7C3AED" },
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    fontFamily: "Inter, sans-serif",
    backgroundColor: C.bg,
    borderRadius: "10px",
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.accent },
    "&.Mui-focused fieldset": { borderColor: C.accent, borderWidth: "2px" },
  },
  "& .MuiInputLabel-root": {
    fontFamily: "Inter, sans-serif",
    color: C.textMuted,
    "&.Mui-focused": { color: C.accent },
  },
  "& .MuiInputBase-input": { color: C.textPrimary },
};

// ── Logo TicketFlow ──
const TeamLogo = ({ size = 48 }: { size?: number }) => (
  <Box sx={{
    width: size, height: size,
    borderRadius: "8px",
    bgcolor: C.navy,
    border: `2px solid ${C.accent}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }}>
    <svg
      width={size * 0.55}
      height={size * 0.55}
      viewBox="0 0 24 24"
      fill="none"
      stroke={C.accent}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  </Box>
);

// ════════════════════════════════════════════════════════════
export default function Team() {
  const navigate = useNavigate();
  const [teamData, setTeamData]           = useState<TeamData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberTickets, setMemberTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [msgLoading, setMsgLoading]       = useState(false);
  const [newMsg, setNewMsg]               = useState("");
  const [sending, setSending]             = useState(false);

  // ── Dialogs ──
  const [createDialog, setCreateDialog]   = useState(false);
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [deleteDialog, setDeleteDialog]   = useState(false);
  const [teamForm, setTeamForm]           = useState({ name: "", description: "" });
  const [formError, setFormError]         = useState<string | null>(null);
  const [formLoading, setFormLoading]     = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [searchUser, setSearchUser]       = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isLeader = teamData?.team?.leaderId?._id === currentUser?.id;
  const canCreateTeam = currentUser?.role === "admin" || currentUser?.role === "tech";

  // ── Fetch team ────────────────────────────────────────────
  const fetchTeam = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data) {
        setTeamData(data);
        if (data.members?.length > 0 && !selectedMember) {
          setSelectedMember(data.members[0]);
        }
      } else {
        setTeamData(null);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch member tickets ──────────────────────────────────
  const fetchMemberTickets = async (memberId: string) => {
    setTicketsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/team/members/${memberId}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMemberTickets(data);
    } catch (err) {
      console.log(err);
    } finally {
      setTicketsLoading(false);
    }
  };

  // ── Fetch messages ────────────────────────────────────────
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/team/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMessages(data);
    } catch (err) {
      console.log(err);
    }
  };

  // ── Fetch available users ─────────────────────────────────
  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/team/available-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setAvailableUsers(data);
    } catch (err) {
      console.log(err);
    }
  };

  // ── Create team ───────────────────────────────────────────
  const handleCreateTeam = async () => {
    if (!teamForm.name.trim()) { setFormError("Le nom est obligatoire."); return; }
    setFormLoading(true);
    setFormError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(teamForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCreateDialog(false);
      setTeamForm({ name: "", description: "" });
      fetchTeam();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Add member ────────────────────────────────────────────
  const handleAddMember = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/team/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        fetchTeam();
        fetchAvailableUsers();
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ── Remove member ─────────────────────────────────────────
  const handleRemoveMember = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/team/members/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTeam();
    } catch (err) {
      console.log(err);
    }
  };

  // ── Delete team ───────────────────────────────────────────
  const handleDeleteTeam = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/team`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteDialog(false);
      setTeamData(null);
    } catch (err) {
      console.log(err);
    }
  };

  // ── Send message ──────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/team/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newMsg.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data]);
        setNewMsg("");
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedMember) fetchMemberTickets(selectedMember._id);
  }, [selectedMember?._id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: C.accent }} />
      </Box>
    );
  }

  // ══ PAGE VIDE — Pas d'équipe ══════════════════════════════
  if (!teamData) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 3, p: 4, position: "relative", overflow: "hidden" }}>

        {/* Cercles décoratifs */}
        {[500, 380, 260].map((size, i) => (
          <Box key={size} sx={{ position: "absolute", width: size, height: size, borderRadius: "50%", border: `1px solid ${C.accent}${["10", "18", "25"][i]}`, top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />
        ))}

        {/* Logo animé */}
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ width: 80, height: 80, bgcolor: C.navy, borderRadius: "20px", border: `3px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", mb: 3, mx: "auto" }}>
            <svg width="44" height="44" viewBox="0 0 34 34" fill="none">
              <polygon points="17,5 30,28 4,28" fill={C.accent} opacity="0.95" />
              <polygon points="17,10 27,28 7,28" fill="white" opacity="0.2" />
              <circle cx="17" cy="17" r="4" fill="white" opacity="0.95" />
            </svg>
          </Box>
        </Box>

        <Box sx={{ textAlign: "center", zIndex: 1 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.6rem", color: C.textPrimary, mb: 1 }}>
            Pas encore d'équipe
          </Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.95rem", color: C.textMuted, maxWidth: 420, lineHeight: 1.7, mb: 1 }}>
            {canCreateTeam
              ? "Créez votre équipe pour collaborer, gérer les tickets ensemble et communiquer en temps réel."
              : "Vous n'avez pas encore été ajouté à une équipe. Contactez votre administrateur."}
          </Typography>
        </Box>

        {canCreateTeam && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialog(true)}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, bgcolor: C.accent, color: C.navy, borderRadius: "12px", px: 4, py: 1.5, textTransform: "none", fontSize: "0.95rem", zIndex: 1, boxShadow: `0 4px 20px ${C.accent}40`, "&:hover": { bgcolor: C.accentHover, boxShadow: `0 6px 24px ${C.accent}60` } }}>
            Créer mon équipe
          </Button>
        )}

        {/* Dialog Créer équipe */}
        <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
          <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <TeamLogo size={32} />
              Créer mon équipe
            </Box>
            <IconButton onClick={() => setCreateDialog(false)} size="small" sx={{ color: C.textMuted }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Divider sx={{ borderColor: C.border }} />
          <DialogContent sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
            {formError && <Alert severity="error" sx={{ bgcolor: C.dangerBg, color: C.danger, border: `1px solid ${C.danger}30`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.danger } }}>{formError}</Alert>}
            <TextField label="Nom de l'équipe" fullWidth value={teamForm.name} onChange={(e) => setTeamForm(f => ({ ...f, name: e.target.value }))} sx={inputSx} placeholder="Ex: Équipe Support Tuskens" />
            <TextField label="Description (optionnel)" fullWidth multiline rows={3} value={teamForm.description} onChange={(e) => setTeamForm(f => ({ ...f, description: e.target.value }))} sx={inputSx} placeholder="Décrivez le rôle de votre équipe..." />
          </DialogContent>
          <Divider sx={{ borderColor: C.border }} />
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button onClick={() => setCreateDialog(false)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none" }}>Annuler</Button>
            <Button variant="contained" onClick={handleCreateTeam} disabled={formLoading}
              startIcon={formLoading ? <CircularProgress size={16} sx={{ color: C.navy }} /> : <AddIcon />}
              sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.accent, color: C.navy, borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { bgcolor: C.accentHover } }}>
              {formLoading ? "Création..." : "Créer l'équipe"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  const { team, members, stats } = teamData;

  // ══ PAGE PRINCIPALE ═══════════════════════════════════════
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: C.bgPage, fontFamily: "Inter, sans-serif", p: 3 }}>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TeamLogo size={48} />
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.3rem", color: C.textPrimary, lineHeight: 1.2 }}>
                {team.name}
              </Typography>
              {isLeader && (
                <Chip label="Leader" size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 700, bgcolor: C.accentLight, color: C.accent, height: 20 }} />
              )}
            </Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: C.textMuted }}>
              {team.description || "Espace collaboratif de votre équipe"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Chip label={`${stats.totalMembers} membres`} sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.75rem", bgcolor: C.accentLight, color: C.accent, border: `1px solid ${C.accent}30` }} />
          {isLeader && (
            <>
              <Button variant="outlined" startIcon={<PersonAddIcon />}
                onClick={() => { setAddMemberDialog(true); fetchAvailableUsers(); }}
                sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, borderColor: C.border, color: C.textSecondary, borderRadius: "10px", textTransform: "none", "&:hover": { borderColor: C.accent, color: C.accent, bgcolor: C.accentLight } }}>
                Ajouter
              </Button>
              <Tooltip title="Supprimer l'équipe">
                <IconButton onClick={() => setDeleteDialog(true)} sx={{ color: C.textMuted, border: `1px solid ${C.border}`, "&:hover": { color: C.danger, bgcolor: C.dangerBg, borderColor: C.danger } }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      {/* ── Stats Cards ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
        {[
          { label: "Tickets actifs",  value: stats.totalActive,   color: C.accent,  bg: C.accentLight,
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
          { label: "Résolus",         value: stats.totalResolved, color: "#16A34A", bg: "rgba(34,197,94,0.1)",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
          { label: "En retard",       value: stats.totalLate,     color: "#EA580C", bg: "rgba(249,115,22,0.1)",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          { label: "Membres",         value: stats.totalMembers,  color: "#2563EB", bg: "rgba(59,130,246,0.1)",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
        ].map((s) => (
          <Paper key={s.label} sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2.5, display: "flex", alignItems: "center", gap: 2, transition: "all 0.2s", "&:hover": { borderColor: C.accent, transform: "translateY(-2px)" } }}>
            <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</Box>
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.5rem", color: C.textPrimary, lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: C.textMuted, mt: 0.3, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* ── Main Grid ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 2 }}>

        {/* LEFT */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Members list */}
          <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${C.border}`, bgcolor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.8px" }}>Membres</Typography>
              <Chip label="Équipe" size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, bgcolor: C.accentLight, color: C.accent, height: 20 }} />
            </Box>
            <Box sx={{ p: 1 }}>
              {members.map((member) => {
                const avail = availabilityConfig[member.availability];
                const av = avatarColors[member.role] ?? avatarColors.user;
                const isSelected = selectedMember?._id === member._id;
                const isMe = member._id === currentUser?.id;
                return (
                  <Box key={member._id} onClick={() => setSelectedMember(member)}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "10px 8px", borderRadius: "10px", cursor: "pointer", transition: "all 0.15s", position: "relative", border: `1px solid ${isSelected ? C.accent + "30" : "transparent"}`, bgcolor: isSelected ? C.accentLight : "transparent", "&:hover": { bgcolor: C.accentLight } }}>
                    <Box sx={{ position: "relative", flexShrink: 0 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.75rem" }}>
                        {getInitials(member.name)}
                      </Avatar>
                      <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: avail.dot, border: "1.5px solid white", position: "absolute", bottom: 0, right: 0 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.8rem", color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name}</Typography>
                        {member._id === team.leaderId._id && <Chip label="Leader" size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.55rem", fontWeight: 700, bgcolor: C.accentLight, color: C.accent, height: 16 }} />}
                      </Box>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", color: C.textMuted, textTransform: "capitalize" }}>{member.role}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", fontWeight: 700, color: C.accent, bgcolor: C.accentLight, px: 1, py: 0.3, borderRadius: "8px", border: `1px solid ${C.accent}20` }}>
                        {member.assigned}
                      </Box>
                      {isLeader && !isMe && (
                        <Tooltip title="Retirer">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRemoveMember(member._id); }}
                            sx={{ color: C.textMuted, width: 22, height: 22, "&:hover": { color: C.danger, bgcolor: C.dangerBg } }}>
                            <PersonRemoveIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>

          {/* Assigned tickets */}
          <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${C.border}`, bgcolor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Tickets de {selectedMember?.name?.split(" ")[0] ?? "..."}
              </Typography>
              <Chip label="Priorité" size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, bgcolor: C.accentLight, color: C.accent, height: 20 }} />
            </Box>
            <Box sx={{ p: 1 }}>
              {ticketsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={20} sx={{ color: C.accent }} /></Box>
              ) : memberTickets.filter(t => t.status !== "resolved" && t.status !== "closed").length === 0 ? (
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textMuted, textAlign: "center", py: 2 }}>Aucun ticket actif</Typography>
              ) : (
                memberTickets.filter(t => t.status !== "resolved" && t.status !== "closed").slice(0, 5).map((ticket) => (
                  <Box key={ticket._id} onClick={() => navigate(`/tickets/${ticket._id}`)}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "7px 8px", borderRadius: "8px", cursor: "pointer", transition: "all 0.15s", border: "1px solid transparent", "&:hover": { bgcolor: C.bgPage, borderColor: C.border } }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: priorityColors[ticket.priority]?.text ?? C.accent, flexShrink: 0 }} />
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textPrimary, fontWeight: 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ticket.title}</Typography>
                    <Chip label={ticket.priority} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, height: 18, bgcolor: priorityColors[ticket.priority]?.bg, color: priorityColors[ticket.priority]?.text }} />
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Box>

        {/* RIGHT */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Member cards */}
          <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(members.length, 3)}, 1fr)`, gap: 2 }}>
            {members.map((member) => {
              const avail = availabilityConfig[member.availability];
              const av = avatarColors[member.role] ?? avatarColors.user;
              const charge = chargeColor(member.chargePercent);
              return (
                <Paper key={member._id} onClick={() => setSelectedMember(member)}
                  sx={{ bgcolor: C.card, border: `1px solid ${selectedMember?._id === member._id ? C.accent : C.border}`, borderRadius: "14px", p: 2, cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden",
                    "&:hover": { borderColor: C.accent, transform: "translateY(-2px)" },
                    "&::before": { content: '""', position: "absolute", top: 0, left: 0, right: 0, height: "3px", bgcolor: charge, borderRadius: "14px 14px 0 0" }
                  }}>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", mx: "auto", mb: 1, border: `2px solid ${av.color}30` }}>
                    {getInitials(member.name)}
                  </Avatar>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: C.textPrimary, textAlign: "center", mb: 0.2 }}>{member.name}</Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: C.textMuted, textAlign: "center", mb: 1, textTransform: "capitalize" }}>{member.role}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 1.5 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: avail.dot }} />
                    <Box sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", fontWeight: 600, color: avail.color, bgcolor: avail.bg, px: 1, py: 0.2, borderRadius: "10px" }}>{avail.label}</Box>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.8, mb: 1.5 }}>
                    {[
                      { label: "Assignés", value: member.assigned },
                      { label: "Résolus",  value: member.resolved },
                      { label: "Retard",   value: Math.max(0, member.assigned - member.resolved) },
                    ].map((s) => (
                      <Box key={s.label} sx={{ textAlign: "center", p: 0.8, bgcolor: C.bgPage, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", color: C.textPrimary }}>{s.value}</Typography>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.3px" }}>{s.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <LinearProgress variant="determinate" value={member.chargePercent}
                    sx={{ height: 5, borderRadius: 3, bgcolor: C.border, "& .MuiLinearProgress-bar": { bgcolor: charge, borderRadius: 3 } }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", color: C.textMuted }}>Charge</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 700, color: charge }}>{member.chargePercent}%</Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>

          {/* Bottom row */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>

            {/* Resolved tickets */}
            <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden" }}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${C.border}`, bgcolor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.8px" }}>Tickets résolus / fermés</Typography>
                <Chip label="Ce mois" size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, bgcolor: C.accentLight, color: C.accent, height: 20 }} />
              </Box>
              <Box sx={{ p: 1 }}>
                {memberTickets.filter(t => t.status === "resolved" || t.status === "closed").length === 0 ? (
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textMuted, textAlign: "center", py: 2 }}>Aucun ticket résolu</Typography>
                ) : (
                  memberTickets.filter(t => t.status === "resolved" || t.status === "closed").slice(0, 4).map((ticket) => (
                    <Box key={ticket._id} onClick={() => navigate(`/tickets/${ticket._id}`)}
                      sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "7px 8px", borderRadius: "8px", cursor: "pointer", transition: "all 0.15s", border: "1px solid transparent", "&:hover": { bgcolor: C.bgPage, borderColor: C.border } }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: statusColors[ticket.status]?.text ?? C.accent, flexShrink: 0 }} />
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textPrimary, fontWeight: 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ticket.title}</Typography>
                      <Chip label={ticket.status.replace("_", " ")} size="small"
                        sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, height: 18, bgcolor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text, textTransform: "capitalize" }} />
                    </Box>
                  ))
                )}
              </Box>
            </Paper>

            {/* Chat */}
            <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${C.border}`, bgcolor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.8px" }}>Chat équipe</Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {members.slice(0, 3).map((m, i) => {
                    const av = avatarColors[m.role] ?? avatarColors.user;
                    return (
                      <Avatar key={m._id} sx={{ width: 22, height: 22, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.6rem", border: "1.5px solid white", ml: i > 0 ? "-6px" : 0 }}>
                        {getInitials(m.name)}
                      </Avatar>
                    );
                  })}
                </Box>
              </Box>

              <Box sx={{ flex: 1, overflowY: "auto", p: 1.5, display: "flex", flexDirection: "column", gap: 1.5, maxHeight: 180,
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-track": { bgcolor: C.bgPage },
                "&::-webkit-scrollbar-thumb": { bgcolor: C.accent, borderRadius: "4px" },
              }}>
                {msgLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={20} sx={{ color: C.accent }} /></Box>
                ) : messages.length === 0 ? (
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textMuted, textAlign: "center", py: 2 }}>Démarrez la conversation ! 💬</Typography>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.userId?._id === currentUser?.id;
                    const av = avatarColors[msg.userId?.role ?? "user"] ?? avatarColors.user;
                    return (
                      <Box key={msg._id} sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexDirection: isMe ? "row-reverse" : "row" }}>
                        <Avatar sx={{ width: 26, height: 26, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.6rem", flexShrink: 0 }}>
                          {getInitials(msg.userId?.name ?? "?")}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", color: C.textMuted, mb: 0.3, textAlign: isMe ? "right" : "left" }}>
                            {msg.userId?.name} · {timeAgo(msg.createdAt)}
                          </Typography>
                          <Box sx={{ p: "7px 11px", borderRadius: isMe ? "12px 4px 12px 12px" : "4px 12px 12px 12px", bgcolor: isMe ? C.accent : C.bgPage, border: isMe ? "none" : `1px solid ${C.border}`, maxWidth: "200px" }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: isMe ? "white" : C.textPrimary, lineHeight: 1.4 }}>
                              {msg.content}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </Box>

              <Box sx={{ display: "flex", gap: 1, p: "10px 12px", borderTop: `2px solid ${C.accent}`, bgcolor: C.bgPage }}>
                <input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="Message à l'équipe..."
                  style={{ flex: 1, padding: "7px 14px", border: `1.5px solid ${C.border}`, borderRadius: "20px", fontSize: "12px", outline: "none", color: C.textPrimary, backgroundColor: C.card, fontFamily: "Inter, sans-serif", colorScheme: "light" }}
                  onFocus={(e) => e.target.style.borderColor = C.accent}
                  onBlur={(e) => e.target.style.borderColor = C.border}
                />
                <button onClick={handleSendMessage} disabled={sending || !newMsg.trim()}
                  style={{ width: 34, height: 34, background: C.accent, border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, opacity: sending || !newMsg.trim() ? 0.5 : 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>

      {/* ════ Dialog Ajouter membre ════ */}
      <Dialog open={addMemberDialog} onClose={() => setAddMemberDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
          Ajouter un membre
          <IconButton onClick={() => setAddMemberDialog(false)} size="small" sx={{ color: C.textMuted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: C.border }} />
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth placeholder="Rechercher un utilisateur..." size="small" value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)} sx={{ ...inputSx, mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 300, overflowY: "auto" }}>
            {availableUsers.filter(u =>
              u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
              u.email.toLowerCase().includes(searchUser.toLowerCase())
            ).length === 0 ? (
              <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted, textAlign: "center", py: 3, fontSize: "0.875rem" }}>
                Aucun utilisateur disponible
              </Typography>
            ) : (
              availableUsers
                .filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase()))
                .map((u) => {
                  const av = avatarColors[u.role] ?? avatarColors.user;
                  return (
                    <Box key={u._id} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "10px", border: `1px solid ${C.border}`, bgcolor: C.bgPage, transition: "all 0.15s", "&:hover": { borderColor: C.accent, bgcolor: C.accentLight } }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.75rem" }}>
                        {getInitials(u.name)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: C.textPrimary }}>{u.name}</Typography>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: C.textMuted }}>{u.email}</Typography>
                      </Box>
                      <Chip label={u.role} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, textTransform: "capitalize", height: 20 }} />
                      <Button size="small" variant="contained" onClick={() => handleAddMember(u._id)}
                        sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.accent, color: C.navy, borderRadius: "8px", textTransform: "none", minWidth: 70, "&:hover": { bgcolor: C.accentHover } }}>
                        Ajouter
                      </Button>
                    </Box>
                  );
                })
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* ════ Dialog Supprimer équipe ════ */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
          Supprimer l'équipe
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, fontSize: "0.9rem" }}>
            Cette action est irréversible. Tous les membres seront retirés de l'équipe <strong>"{team.name}"</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteDialog(false)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none" }}>Annuler</Button>
          <Button variant="contained" onClick={handleDeleteTeam}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.danger, color: "white", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { bgcolor: C.dangerHover } }}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}