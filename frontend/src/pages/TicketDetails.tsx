// frontend/src/pages/TicketDetails.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, TextField, Chip, Avatar,
  Divider, CircularProgress, MenuItem, Select,
  FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert,
} from "@mui/material";
import {
  ArrowBack,
  Send,
  Delete,
  AddCircleOutline as CreatedIcon,
  SwapHoriz as StatusIcon,
  PersonAdd as AssignedIcon,
  PersonOff as UnassignedIcon,
  PriorityHigh as PriorityIcon,
  Comment as CommentIcon,
} from "@mui/icons-material";
import { C, statusColors, priorityColors, roleColors } from "../theme";
import { SLABadge } from "../components/SLABadge";
import { api } from "../api";

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

// ── Types ──
interface Comment {
  _id: string;
  userId: { _id: string; name: string; role: string };
  content: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  resolvedAt?: string;
  slaDeadline?: string | null;
  slaBreached?: boolean;
  escalationLevel?: number;
  waitingReason?: string;
  createdBy: { _id: string; name: string; role: string };
  assignedTo: { _id: string; name: string; role: string } | null;
  assignedBy: { _id: string; name: string } | null;
  teamId?: { _id: string; name: string; category: string; tag?: string; color?: string; leaderId?: { _id: string; name: string; email: string } | null } | null;
  comments: Comment[];
}

interface User {
  _id: string;
  name: string;
  role: string;
  email: string;
}

interface HistoryItem {
  _id: string;
  userId: { _id: string; name: string; role: string };
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

// ── Helpers ──
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const getStatusLabel = (s: string) => ({
  open: "Ouvert", pending: "En attente équipe", assigned: "Assigné", in_progress: "En cours", waiting: "En attente", resolved: "Résolu", closed: "Fermé"
}[s] ?? s);

const getPriorityLabel = (p: string) => ({
  low: "Faible", medium: "Moyenne", high: "Haute", critical: "Critique"
}[p] ?? p);

const getCategoryLabel = (c: string) => ({
  hardware: "Hardware", software: "Software", network: "Réseau", access: "Accès", other: "Autre"
}[c] ?? c);

const getHistoryConfig = (action: string) => {
  const map: Record<string, any> = {
    created:        { icon: "circle-plus",  color: "#16A34A", bg: "rgba(34,197,94,0.08)",   label: "a créé ce ticket" },
    status_changed: { icon: "arrows-exchange", color: "#2563EB", bg: "rgba(59,130,246,0.08)", label: "a changé le statut" },
    assigned:       { icon: "user-check",   color: "#0E9188", bg: "rgba(95,194,186,0.08)",  label: "a assigné le ticket" },
    unassigned:     { icon: "user-x",       color: "#EA580C", bg: "rgba(249,115,22,0.08)",  label: "a retiré l'assignation" },
    priority_changed:{ icon: "alert-triangle", color: "#DC2626", bg: "rgba(239,68,68,0.08)", label: "a changé la priorité" },
    commented:      { icon: "message",      color: "#7C3AED", bg: "rgba(124,58,237,0.08)",  label: "a commenté" },
  };
  return map[action] ?? { icon: "circle", color: C.accent, bg: C.accentLight, label: action };
};

// ════════════════════════════════════════════════
export default function TicketDetails() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket,         setTicket]         = useState<Ticket | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [comment,        setComment]        = useState("");
  const [sending,        setSending]        = useState(false);
  const [history,        setHistory]        = useState<HistoryItem[]>([]);
  const [techList,         setTechList]         = useState<User[]>([]);
  const [teamList,         setTeamList]         = useState<{ _id: string; name: string; tag: string; color: string; category: string }[]>([]);
  const [deleteDialog,     setDeleteDialog]     = useState(false);
  const [assignDialog,     setAssignDialog]     = useState(false);
  const [assignTeamDialog, setAssignTeamDialog] = useState(false);
  const [selectedTech,     setSelectedTech]     = useState("");
  const [selectedTeam,     setSelectedTeam]     = useState("");
  const [assigning,        setAssigning]        = useState(false);
  const [statusUpdating,   setStatusUpdating]   = useState(false);
  const [escalating,       setEscalating]       = useState(false);
  const [waitingDialog,    setWaitingDialog]    = useState(false);
  const [waitingReason,    setWaitingReason]    = useState("");
  const [error,            setError]            = useState<string | null>(null);

  // ── Current user ──
  const storedUser  = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userRole    = currentUser?.role ?? "user";
  const isAdmin     = userRole === "admin";
  const isLeader    = userRole === "leader";
  const isTech      = userRole === "tech";

  const canAssign    = isAdmin || isLeader;
  const canResolve   = isAdmin || isLeader || isTech;
  const canDelete    = isAdmin;
  const canEscalate  = isAdmin || isLeader;
  const isAssignedToMe = ticket?.assignedTo?._id === currentUser?.id;

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTicket();
    fetchHistory();
    if (isLeader) fetchTechList();
    if (isAdmin)  fetchTeamList();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${apiUrl}/api/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setTicket(data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    try {
      const res  = await fetch(`${apiUrl}/api/tickets/${id}/history`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setHistory(data);
    } catch (err) { console.log(err); }
  };

  const fetchTechList = async () => {
    try {
      const res  = await fetch(`${apiUrl}/api/users/technicians`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setTechList(data);
    } catch (err) { console.log(err); }
  };

  const fetchTeamList = async () => {
    try {
      const res  = await fetch(`${apiUrl}/api/team/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setTeamList(Array.isArray(data) ? data : []);
    } catch (err) { console.log(err); }
  };

  // ── Admin assigns to team (open → pending) ──
  const handleAssignTeam = async () => {
    if (!selectedTeam) return;
    setAssigning(true);
    try {
      const res = await fetch(`${apiUrl}/api/tickets/${id}/assign-team`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teamId: selectedTeam }),
      });
      const data = await res.json();
      if (res.ok) {
        setTicket(data);
        setAssignTeamDialog(false);
        setSelectedTeam("");
        fetchHistory();
      } else {
        setError(data.message);
      }
    } catch { setError("Erreur serveur"); }
    finally { setAssigning(false); }
  };

  // ── Leader/admin assigns tech (pending/assigned → assigned) ──
  const handleAssign = async () => {
    if (!selectedTech) return;
    setAssigning(true);
    try {
      const res = await fetch(`${apiUrl}/api/tickets/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignedTo: selectedTech }),
      });
      const data = await res.json();
      if (res.ok) {
        setTicket(data);
        setAssignDialog(false);
        setSelectedTech("");
        fetchHistory();
      } else {
        setError(data.message);
      }
    } catch (err) { setError("Erreur serveur"); }
    finally { setAssigning(false); }
  };

  // ── Update status (tech/leader) ──
  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setTicket(data);
        fetchHistory();
      } else {
        setError(data.message);
      }
    } catch (err) { setError("Erreur serveur"); }
    finally { setStatusUpdating(false); }
  };

  // ── Add comment ──
  const handleComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/tickets/${id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setTicket(data);
        setComment("");
        fetchHistory();
      }
    } catch (err) { console.log(err); }
    finally { setSending(false); }
  };

  // ── Delete ──
  const handleDelete = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/tickets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) navigate(-1);
    } catch (err) { console.log(err); }
  };

  // ── Escalate ──
  const handleEscalate = async () => {
    setEscalating(true);
    setError(null);
    try {
      const data = await api.put<Ticket>(`/api/tickets/${id}/escalate`, {});
      setTicket(data);
      fetchHistory();
    } catch (err: any) {
      setError(err.message);
    } finally { setEscalating(false); }
  };

  // ── Set waiting ──
  const handleSetWaiting = async () => {
    if (!waitingReason.trim()) return;
    setStatusUpdating(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "waiting", waitingReason }),
      });
      const data = await res.json();
      if (res.ok) { setTicket(data); setWaitingDialog(false); setWaitingReason(""); fetchHistory(); }
      else setError(data.message);
    } catch { setError("Erreur serveur"); }
    finally { setStatusUpdating(false); }
  };

  if (loading) return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <CircularProgress sx={{ color: C.accent }} />
    </Box>
  );

  if (!ticket) return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Ticket introuvable</Typography>
    </Box>
  );

  const statusConf   = statusColors[ticket.status]   ?? statusColors.open;
  const priorityConf = priorityColors[ticket.priority] ?? priorityColors.medium;

  return (
    <Box sx={{ p: "28px 32px", fontFamily: "Inter, sans-serif", bgcolor: "#F4F6FA", minHeight: "100%" }}>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box onClick={() => navigate(-1)} sx={{ width: 36, height: 36, borderRadius: "9px", bgcolor: "#fff", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", "&:hover": { borderColor: C.accent, bgcolor: C.accentLight } }}>
          <ArrowBack sx={{ fontSize: 18, color: C.textSecondary }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "19px", fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.3px" }}>
            {ticket.title}
          </Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, mt: 0.3 }}>
            Créé le {formatDateTime(ticket.createdAt)} par {ticket.createdBy.name}
          </Typography>
        </Box>
        {/* Actions */}
        <Box sx={{ display: "flex", gap: 1 }}>
          {isAdmin && ticket.status === "open" && (
            <Button onClick={() => setAssignTeamDialog(true)}
              sx={{ bgcolor: "#3B82F6", color: "#fff", borderRadius: "9px", px: 2, py: 1, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "none", display: "flex", alignItems: "center", gap: 0.8, "&:hover": { bgcolor: "#2563EB" } }}>
              <Box component="i" className="ti ti-users" sx={{ fontSize: 16 }} />
              Assigner équipe
            </Button>
          )}
          {(isLeader || isAdmin) && (ticket.status === "pending" || ticket.status === "assigned") && (
            <Button onClick={() => setAssignDialog(true)}
              sx={{ bgcolor: "#3B82F6", color: "#fff", borderRadius: "9px", px: 2, py: 1, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "none", display: "flex", alignItems: "center", gap: 0.8, "&:hover": { bgcolor: "#2563EB" } }}>
              <Box component="i" className="ti ti-user-check" sx={{ fontSize: 16 }} />
              Assigner technicien
            </Button>
          )}
          {canResolve && (isAssignedToMe || isLeader || isAdmin) && ticket.status === "assigned" && (
            <Button onClick={() => handleStatusChange("in_progress")} disabled={statusUpdating}
              sx={{ bgcolor: "#F97316", color: "#fff", borderRadius: "9px", px: 2, py: 1, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "none", display: "flex", alignItems: "center", gap: 0.8, "&:hover": { bgcolor: "#EA580C" } }}>
              <Box component="i" className="ti ti-player-play" sx={{ fontSize: 16 }} />
              Prendre en charge
            </Button>
          )}
          {canResolve && (isAssignedToMe || isLeader || isAdmin) && ticket.status === "in_progress" && (
            <Button onClick={() => handleStatusChange("resolved")} disabled={statusUpdating}
              sx={{ bgcolor: "#22C55E", color: "#fff", borderRadius: "9px", px: 2, py: 1, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "none", display: "flex", alignItems: "center", gap: 0.8, "&:hover": { bgcolor: "#16A34A" } }}>
              <Box component="i" className="ti ti-circle-check" sx={{ fontSize: 16 }} />
              Marquer résolu
            </Button>
          )}
          {canEscalate && ticket && !["resolved","closed"].includes(ticket.status) && (ticket.escalationLevel ?? 0) < 2 && (
            <Button onClick={handleEscalate} disabled={escalating}
              sx={{ bgcolor: "#EF4444", color: "#fff", borderRadius: "9px", px: 2, py: 1, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "none", display: "flex", alignItems: "center", gap: 0.8, "&:hover": { bgcolor: "#DC2626" } }}>
              <Box component="i" className="ti ti-alert-triangle" sx={{ fontSize: 16 }} />
              Escalader
            </Button>
          )}
          {canResolve && ticket && ticket.status === "in_progress" && (
            <Button onClick={() => setWaitingDialog(true)}
              sx={{ bgcolor: "#F59E0B", color: "#fff", borderRadius: "9px", px: 2, py: 1, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "none", display: "flex", alignItems: "center", gap: 0.8, "&:hover": { bgcolor: "#D97706" } }}>
              <Box component="i" className="ti ti-pause" sx={{ fontSize: 16 }} />
              En attente
            </Button>
          )}
          {canDelete && (
            <Box onClick={() => setDeleteDialog(true)} sx={{ width: 36, height: 36, borderRadius: "9px", bgcolor: "#fff", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", "&:hover": { borderColor: C.danger, bgcolor: C.dangerBg } }}>
              <Delete sx={{ fontSize: 17, color: C.danger }} />
            </Box>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>{error}</Alert>}

      {/* ── Main Grid ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 2 }}>

        {/* ── LEFT ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Description */}
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "20px 24px" }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <Box component="i" className="ti ti-align-left" sx={{ fontSize: 16, color: C.textMuted }} />
              Description
            </Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: C.textSecondary, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {ticket.description}
            </Typography>
          </Box>

          {/* Comments */}
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.divider}` }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>
                Commentaires ({ticket.comments.length})
              </Typography>
            </Box>

            {ticket.comments.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Box component="i" className="ti ti-message" sx={{ fontSize: 32, color: C.textMuted, display: "block", mb: 1 }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>Aucun commentaire</Typography>
              </Box>
            ) : (
              ticket.comments.map((c) => (
                <Box key={c._id} sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.divider}`, "&:last-child": { borderBottom: "none" } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <Avatar sx={{ width: 30, height: 30, bgcolor: roleColors[c.userId.role]?.bg ?? C.accentLight, color: roleColors[c.userId.role]?.text ?? C.accent, fontSize: "11px", fontWeight: 700 }}>
                      {getInitials(c.userId.name)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>{c.userId.name}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{formatDateTime(c.createdAt)}</Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textSecondary, lineHeight: 1.6, pl: 5.5 }}>
                    {c.content}
                  </Typography>
                </Box>
              ))
            )}

            {/* Add comment */}
            <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${C.divider}`, display: "flex", gap: 1.5, alignItems: "flex-end" }}>
              <TextField
                fullWidth multiline rows={2} placeholder="Ajouter un commentaire..."
                value={comment} onChange={(e) => setComment(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif", fontSize: "13px", "& fieldset": { borderColor: C.border }, "&:hover fieldset": { borderColor: C.accent }, "&.Mui-focused fieldset": { borderColor: C.accent } } }}
              />
              <Button onClick={handleComment} disabled={sending || !comment.trim()}
                sx={{ bgcolor: C.accent, color: "#fff", borderRadius: "10px", minWidth: 44, height: 44, p: 0, "&:hover": { bgcolor: C.accentHover }, "&:disabled": { bgcolor: C.border } }}>
                <Send sx={{ fontSize: 18 }} />
              </Button>
            </Box>
          </Box>

          {/* History */}
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.divider}` }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>
                Historique
              </Typography>
            </Box>
            <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
              {history.map((h) => {
                const conf = getHistoryConfig(h.action);
                return (
                  <Box key={h._id} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: conf.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.2 }}>
                      <Box component="i" className={`ti ti-${conf.icon}`} sx={{ fontSize: 13, color: conf.color }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary }}>
                        <strong style={{ color: C.textPrimary }}>{h.userId?.name}</strong> {conf.label}
                        {h.oldValue && h.newValue && (
                          <> : <span style={{ color: C.danger }}>{h.oldValue}</span> → <span style={{ color: C.success }}>{h.newValue}</span></>
                        )}
                      </Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mt: 0.3 }}>
                        {formatDateTime(h.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              {history.length === 0 && (
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, textAlign: "center" }}>
                  Aucun historique
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* ── RIGHT ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Status + Priority */}
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "18px 20px" }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.5 }}>
              Statut & Priorité
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              {/* Status */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Statut</Typography>
                <Chip label={getStatusLabel(ticket.status)} size="small"
                  sx={{ bgcolor: statusConf.bg, color: statusConf.text, border: `1px solid ${statusConf.border}`, fontWeight: 600, fontSize: "11px", height: 24, fontFamily: "Inter, sans-serif" }} />
              </Box>
              {/* Priority */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Priorité</Typography>
                <Chip label={getPriorityLabel(ticket.priority)} size="small"
                  sx={{ bgcolor: priorityConf.bg, color: priorityConf.text, border: `1px solid ${priorityConf.border}`, fontWeight: 600, fontSize: "11px", height: 24, fontFamily: "Inter, sans-serif" }} />
              </Box>
              {/* Category */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Catégorie</Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textPrimary }}>
                  {getCategoryLabel(ticket.category)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Chaîne d'assignation */}
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "18px 20px" }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.5 }}>
              Chaîne d'assignation
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>

              {/* 1. Créateur */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <Avatar sx={{ width: 30, height: 30, bgcolor: "rgba(124,58,237,0.12)", color: "#7C3AED", fontSize: "11px", fontWeight: 700 }}>
                  {getInitials(ticket.createdBy.name)}
                </Avatar>
                <Box>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textPrimary }}>{ticket.createdBy.name}</Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>Créateur</Typography>
                </Box>
              </Box>

              <Divider sx={{ borderColor: C.divider }} />

              {/* 2. Équipe + Leader */}
              {ticket.teamId ? (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                  <Box sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: `${ticket.teamId.color ?? C.accent}18`, border: `1px solid ${ticket.teamId.color ?? C.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Box component="i" className="ti ti-users" sx={{ fontSize: 14, color: ticket.teamId.color ?? C.accent }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textPrimary }}>{ticket.teamId.name}</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>Équipe assignée</Typography>
                    {ticket.teamId.leaderId && (
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textSecondary, mt: 0.4 }}>
                        Leader : {ticket.teamId.leaderId.name}
                      </Typography>
                    )}
                  </Box>
                  {isAdmin && (
                    <Box onClick={() => setAssignTeamDialog(true)} sx={{ cursor: "pointer", color: C.accent, "&:hover": { opacity: 0.8 }, flexShrink: 0 }}>
                      <Box component="i" className="ti ti-edit" sx={{ fontSize: 15 }} />
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Box sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: C.bgPage, border: `1.5px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Box component="i" className="ti ti-users" sx={{ fontSize: 14, color: C.textMuted }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, fontStyle: "italic" }}>Pas encore assigné à une équipe</Typography>
                  </Box>
                  {isAdmin && ticket.status === "open" && (
                    <Button onClick={() => setAssignTeamDialog(true)} size="small"
                      sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.accent, textTransform: "none", p: 0, minWidth: "auto", "&:hover": { bgcolor: "transparent", opacity: 0.8 } }}>
                      Assigner
                    </Button>
                  )}
                </Box>
              )}

              <Divider sx={{ borderColor: C.divider }} />

              {/* 3. Technicien */}
              {ticket.assignedTo ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Avatar sx={{ width: 30, height: 30, bgcolor: "rgba(249,115,22,0.12)", color: "#EA580C", fontSize: "11px", fontWeight: 700 }}>
                    {getInitials(ticket.assignedTo.name)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textPrimary }}>{ticket.assignedTo.name}</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>Technicien assigné</Typography>
                  </Box>
                  {(isLeader || isAdmin) && (
                    <Box onClick={() => setAssignDialog(true)} sx={{ cursor: "pointer", color: C.accent, "&:hover": { opacity: 0.8 } }}>
                      <Box component="i" className="ti ti-edit" sx={{ fontSize: 15 }} />
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Box sx={{ width: 30, height: 30, borderRadius: "50%", bgcolor: C.bgPage, border: `1.5px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Box component="i" className="ti ti-user-question" sx={{ fontSize: 15, color: C.textMuted }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, fontStyle: "italic" }}>Non assigné à un technicien</Typography>
                  </Box>
                  {(isLeader || isAdmin) && ["pending", "assigned"].includes(ticket.status) && (
                    <Button onClick={() => setAssignDialog(true)} size="small"
                      sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.accent, textTransform: "none", p: 0, minWidth: "auto", "&:hover": { bgcolor: "transparent", opacity: 0.8 } }}>
                      Assigner
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {/* SLA */}
          {ticket.slaDeadline && (
            <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${ticket.slaBreached ? "#EF444433" : C.border}`, p: "18px 20px" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.5 }}>
                SLA
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Échéance</Typography>
                  <SLABadge slaDeadline={ticket.slaDeadline} slaBreached={ticket.slaBreached ?? false} status={ticket.status} />
                </Box>
                {(ticket.escalationLevel ?? 0) > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Niveau d'escalade</Typography>
                    <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: (ticket.escalationLevel ?? 0) >= 2 ? C.dangerBg : C.warningBg }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: (ticket.escalationLevel ?? 0) >= 2 ? C.danger : C.warning }}>
                        Niveau {ticket.escalationLevel}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Waiting reason */}
          {ticket.status === "waiting" && ticket.waitingReason && (
            <Box sx={{ bgcolor: "rgba(234,179,8,.08)", borderRadius: "14px", border: "1px solid rgba(234,179,8,.25)", p: "18px 20px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box component="i" className="ti ti-pause" sx={{ fontSize: 14, color: "#B45309" }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: "#B45309", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  En attente
                </Typography>
              </Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#92400E", lineHeight: 1.5 }}>
                {ticket.waitingReason}
              </Typography>
            </Box>
          )}

          {/* Dates */}
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "18px 20px" }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.5 }}>
              Dates
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Créé le</Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500, color: C.textPrimary }}>{formatDateTime(ticket.createdAt)}</Typography>
              </Box>
              {ticket.resolvedAt && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Résolu le</Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500, color: "#16A34A" }}>{formatDateTime(ticket.resolvedAt)}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Actions technicien */}
          {isTech && isAssignedToMe && (
            <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "18px 20px" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.5 }}>
                Mes actions
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {ticket.status === "assigned" && (
                  <Button fullWidth onClick={() => handleStatusChange("in_progress")} disabled={statusUpdating}
                    sx={{ bgcolor: "#F97316", color: "#fff", borderRadius: "9px", py: 1.2, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "none", "&:hover": { bgcolor: "#EA580C" } }}>
                    <Box component="i" className="ti ti-player-play" sx={{ fontSize: 16, mr: 1 }} />
                    Prendre en charge
                  </Button>
                )}
                {ticket.status === "in_progress" && (
                  <Button fullWidth onClick={() => handleStatusChange("resolved")} disabled={statusUpdating}
                    sx={{ bgcolor: "#22C55E", color: "#fff", borderRadius: "9px", py: 1.2, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "none", "&:hover": { bgcolor: "#16A34A" } }}>
                    <Box component="i" className="ti ti-circle-check" sx={{ fontSize: 16, mr: 1 }} />
                    Marquer comme résolu
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Assign Team Dialog (admin) ── */}
      <Dialog open={assignTeamDialog} onClose={() => setAssignTeamDialog(false)} PaperProps={{ sx: { borderRadius: "16px", minWidth: 420 } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "16px", color: C.textPrimary }}>
          Assigner à une équipe
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mb: 2 }}>
            Sélectionnez l'équipe qui prendra en charge ce ticket
          </Typography>
          <FormControl fullWidth>
            <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Équipe</InputLabel>
            <Select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} label="Équipe"
              sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>
              {teamList.map((team) => (
                <MenuItem key={team._id} value={team._id} sx={{ fontFamily: "Inter, sans-serif" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: team.color }} />
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}>{team.name}</Typography>
                    <Box sx={{ ml: "auto", px: 0.8, py: 0.2, borderRadius: "4px", bgcolor: C.bgPage }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: C.textMuted }}>{team.tag}</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAssignTeamDialog(false)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none" }}>
            Annuler
          </Button>
          <Button onClick={handleAssignTeam} disabled={!selectedTeam || assigning} variant="contained"
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: "#3B82F6", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { bgcolor: "#2563EB" } }}>
            {assigning ? "Assignation..." : "Confirmer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Assign Tech Dialog (leader/admin) ── */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} PaperProps={{ sx: { borderRadius: "16px", minWidth: 400 } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "16px", color: C.textPrimary }}>
          Assigner un technicien
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mb: 2 }}>
            Choisissez un technicien disponible pour ce ticket
          </Typography>
          <FormControl fullWidth>
            <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Technicien</InputLabel>
            <Select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} label="Technicien"
              sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>
              {techList.map((tech) => (
                <MenuItem key={tech._id} value={tech._id} sx={{ fontFamily: "Inter, sans-serif" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: C.accentLight, color: C.accent, fontSize: "11px", fontWeight: 700 }}>
                      {getInitials(tech.name)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600 }}>{tech.name}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{tech.role}</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAssignDialog(false)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none" }}>
            Annuler
          </Button>
          <Button onClick={handleAssign} disabled={!selectedTech || assigning} variant="contained"
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: "#3B82F6", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { bgcolor: "#2563EB" } }}>
            {assigning ? "Assignation..." : "Assigner"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Waiting Dialog ── */}
      <Dialog open={waitingDialog} onClose={() => setWaitingDialog(false)} PaperProps={{ sx: { borderRadius: "16px", minWidth: 420 } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "16px", color: C.textPrimary }}>
          Mettre en attente
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mb: 2 }}>
            Précisez la raison de la mise en attente (ex: attente réponse client, pièce commandée…)
          </Typography>
          <TextField
            fullWidth multiline rows={3}
            placeholder="Raison de l'attente..."
            value={waitingReason}
            onChange={e => setWaitingReason(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif", fontSize: "13px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setWaitingDialog(false)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none" }}>
            Annuler
          </Button>
          <Button onClick={handleSetWaiting} disabled={!waitingReason.trim() || statusUpdating} variant="contained"
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: "#F59E0B", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { bgcolor: "#D97706" } }}>
            {statusUpdating ? "En cours..." : "Confirmer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} PaperProps={{ sx: { borderRadius: "16px", minWidth: 380 } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "16px", color: C.danger }}>
          Supprimer le ticket
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textSecondary }}>
            Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteDialog(false)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none" }}>
            Annuler
          </Button>
          <Button onClick={handleDelete} variant="contained"
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.danger, borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { bgcolor: C.dangerHover } }}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}