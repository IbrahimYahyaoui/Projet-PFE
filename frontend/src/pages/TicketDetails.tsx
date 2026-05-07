// frontend/src/pages/TicketDetails.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack,
  Send,
  Delete,
  Edit,
  Save,
  Close,
  AddCircleOutline as CreatedIcon,
  SwapHoriz as StatusIcon,
  PersonAdd as AssignedIcon,
  PersonOff as UnassignedIcon,
  PriorityHigh as PriorityIcon,
  Comment as CommentIcon,
} from "@mui/icons-material";
import { C, statusColors, priorityColors } from "../theme";

// ─── Types ───────────────────────────────────────────────────
interface Comment {
  _id: string;
  userId: { _id: string; name: string };
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
  createdBy: { _id: string; name: string };
  assignedTo: { _id: string; name: string } | null;
  comments: Comment[];
}

interface User {
  _id: string;
  name: string;
  role: string;
}

interface HistoryItem {
  _id: string;
  userId: { _id: string; name: string; role: string };
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────
const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const getHistoryConfig = (action: string) => {
  switch (action) {
    case "created":
      return {
        icon: <CreatedIcon sx={{ fontSize: 16 }} />,
        color: "#16A34A",
        bg: "rgba(34, 197, 94, 0.1)",
        label: "a créé ce ticket",
      };
    case "status_changed":
      return {
        icon: <StatusIcon sx={{ fontSize: 16 }} />,
        color: "#2563EB",
        bg: "rgba(59, 130, 246, 0.1)",
        label: "a changé le statut",
      };
    case "assigned":
      return {
        icon: <AssignedIcon sx={{ fontSize: 16 }} />,
        color: C.accent,
        bg: C.accentLight,
        label: "a assigné le ticket",
      };
    case "unassigned":
      return {
        icon: <UnassignedIcon sx={{ fontSize: 16 }} />,
        color: "#EA580C",
        bg: "rgba(249, 115, 22, 0.1)",
        label: "a retiré l'assignation",
      };
    case "priority_changed":
      return {
        icon: <PriorityIcon sx={{ fontSize: 16 }} />,
        color: "#DC2626",
        bg: "rgba(239, 68, 68, 0.08)",
        label: "a changé la priorité",
      };
    case "commented":
      return {
        icon: <CommentIcon sx={{ fontSize: 16 }} />,
        color: "#7C3AED",
        bg: "rgba(124, 58, 237, 0.08)",
        label: "a ajouté un commentaire",
      };
    default:
      return {
        icon: <CreatedIcon sx={{ fontSize: 16 }} />,
        color: C.accent,
        bg: C.accentLight,
        label: action,
      };
  }
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

// ════════════════════════════════════════════════════════════
const TicketDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [techList, setTechList] = useState<User[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [editStatus, setEditStatus] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === "admin";
  const isTech = user?.role === "tech";
  const canEdit = isAdmin || isTech;

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTicket(data);
        setEditStatus(data.status);
        setEditAssignedTo(data.assignedTo?._id || "");
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/tickets/${id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setHistory(data);
    } catch (err) {
      console.log(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchTechs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTechList(data.filter((u: User) => u.role === "tech" || u.role === "admin"));
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchTicket();
    fetchHistory();
    if (canEdit) fetchTechs();
  }, [id]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: editStatus, assignedTo: editAssignedTo || null }),
      });
      if (res.ok) {
        await fetchTicket();
        await fetchHistory();
        setIsEditing(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/tickets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) navigate("/all-tickets");
    } catch (err) {
      console.log(err);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      setSending(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/tickets/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: comment }),
      });
      if (res.ok) {
        await fetchTicket();
        await fetchHistory();
        setComment("");
      }
    } catch (err) {
      console.log(err);
    } finally {
      setSending(false);
    }
  };

  const selectSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: C.bgPage, borderRadius: "8px", fontSize: 13, color: C.navy,
      fontFamily: "Inter, sans-serif",
      "& fieldset": { borderColor: C.border },
      "&:hover fieldset": { borderColor: C.accent },
      "&.Mui-focused fieldset": { borderColor: C.accent },
    },
    "& .MuiInputLabel-root": { fontSize: 13, fontFamily: "Inter, sans-serif", color: C.textMuted },
    "& .MuiInputLabel-root.Mui-focused": { color: C.accent },
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: C.accent }} />
      </Box>
    );
  }

  if (!ticket) {
    return <Box sx={{ p: 4 }}><Typography color={C.textMuted}>Ticket not found</Typography></Box>;
  }

  return (
    <Box sx={{ flex: 1, p: 3, bgcolor: C.bgPage, fontFamily: "Inter, sans-serif" }}>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}
          sx={{ color: C.slate, textTransform: "none", fontFamily: "Inter, sans-serif", fontSize: 13, "&:hover": { color: C.accent, bgcolor: C.accentLight }, borderRadius: "8px" }}>
          Back
        </Button>
        {canEdit && (
          <Box sx={{ display: "flex", gap: 1 }}>
            {isEditing ? (
              <>
                <Button startIcon={<Save />} onClick={handleSave} variant="contained" disableElevation
                  sx={{ bgcolor: C.accent, color: C.navy, textTransform: "none", borderRadius: "8px", fontWeight: 600, fontSize: 13, fontFamily: "Inter, sans-serif", "&:hover": { bgcolor: C.accentHover } }}>
                  Save changes
                </Button>
                <Button startIcon={<Close />} onClick={() => setIsEditing(false)} variant="outlined" disableElevation
                  sx={{ borderColor: C.border, color: C.slate, textTransform: "none", borderRadius: "8px", fontSize: 13, fontFamily: "Inter, sans-serif", "&:hover": { borderColor: C.accent, color: C.accent } }}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button startIcon={<Edit />} onClick={() => setIsEditing(true)} variant="outlined" disableElevation
                  sx={{ borderColor: C.border, color: C.slate, textTransform: "none", borderRadius: "8px", fontSize: 13, fontFamily: "Inter, sans-serif", "&:hover": { borderColor: C.accent, color: C.accent } }}>
                  Edit
                </Button>
                {isAdmin && (
                  <Button startIcon={<Delete />} onClick={() => setDeleteDialog(true)} variant="outlined" disableElevation
                    sx={{ borderColor: C.border, color: C.textMuted, textTransform: "none", borderRadius: "8px", fontSize: 13, fontFamily: "Inter, sans-serif", "&:hover": { borderColor: C.danger, color: C.danger, bgcolor: C.dangerBg } }}>
                    Delete
                  </Button>
                )}
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Main Grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 3 }}>

        {/* LEFT */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Title + Badges */}
          <Box sx={{ bgcolor: C.card, borderRadius: "10px", border: `1px solid ${C.border}`, p: 3 }}>
            <Typography variant="h5" fontWeight={700} color={C.navy} fontFamily="Inter, sans-serif" sx={{ letterSpacing: "-0.3px", mb: 1.5 }}>
              {ticket.title}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={ticket.status.replace("_", " ")} size="small"
                sx={{ bgcolor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text, border: `1px solid ${statusColors[ticket.status]?.border}`, fontWeight: 600, fontSize: 11, textTransform: "capitalize", fontFamily: "Inter, sans-serif" }} />
              <Chip label={ticket.priority} size="small"
                sx={{ bgcolor: priorityColors[ticket.priority]?.bg, color: priorityColors[ticket.priority]?.text, border: `1px solid ${priorityColors[ticket.priority]?.border}`, fontWeight: 600, fontSize: 11, textTransform: "capitalize", fontFamily: "Inter, sans-serif" }} />
              <Chip label={ticket.category} size="small"
                sx={{ bgcolor: "#F8FAFC", color: C.slate, border: `1px solid ${C.border}`, fontWeight: 500, fontSize: 11, textTransform: "capitalize", fontFamily: "Inter, sans-serif" }} />
            </Box>
          </Box>

          {/* Description */}
          <Box sx={{ bgcolor: C.card, borderRadius: "10px", border: `1px solid ${C.border}`, p: 3 }}>
            <Typography fontSize={13} fontWeight={600} color={C.textMuted} fontFamily="Inter, sans-serif" sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: 1.5 }}>
              Description
            </Typography>
            <Typography fontSize={14} color={C.navy} fontFamily="Inter, sans-serif" sx={{ lineHeight: 1.7 }}>
              {ticket.description}
            </Typography>
          </Box>

          {/* Comments */}
          <Box sx={{ bgcolor: C.card, borderRadius: "10px", border: `1px solid ${C.border}`, p: 3 }}>
            <Typography fontSize={13} fontWeight={600} color={C.textMuted} fontFamily="Inter, sans-serif" sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: 2 }}>
              Comments ({ticket.comments.length})
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3, maxHeight: 350, overflowY: "auto" }}>
              {ticket.comments.length === 0 ? (
                <Typography fontSize={13} color={C.textMuted} fontFamily="Inter, sans-serif">No comments yet. Be the first!</Typography>
              ) : (
                ticket.comments.map((c) => (
                  <Box key={c._id}>
                    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: C.accentLight, color: C.accent, fontSize: 12, fontWeight: 700, border: `1.5px solid ${C.border}` }}>
                        {c.userId?.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Typography fontSize={13} fontWeight={600} color={C.navy} fontFamily="Inter, sans-serif">{c.userId?.name}</Typography>
                          <Typography fontSize={11} color={C.textMuted} fontFamily="Inter, sans-serif">{formatDateTime(c.createdAt)}</Typography>
                        </Box>
                        <Box sx={{ bgcolor: C.bgPage, borderRadius: "8px", p: 1.5, border: `1px solid ${C.border}` }}>
                          <Typography fontSize={13} color={C.navy} fontFamily="Inter, sans-serif" sx={{ lineHeight: 1.6 }}>{c.content}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
            <Divider sx={{ borderColor: C.border, mb: 2 }} />
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: C.accentLight, color: C.accent, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, display: "flex", gap: 1 }}>
                <TextField fullWidth multiline rows={2} placeholder="Write a comment..." value={comment} onChange={(e) => setComment(e.target.value)} size="small"
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: C.bgPage, borderRadius: "8px", fontSize: 13, color: C.navy, fontFamily: "Inter, sans-serif", "& fieldset": { borderColor: C.border }, "&:hover fieldset": { borderColor: C.accent }, "&.Mui-focused fieldset": { borderColor: C.accent } }, "& .MuiOutlinedInput-input::placeholder": { color: C.textMuted, opacity: 1 } }}
                />
                <Button variant="contained" disableElevation onClick={handleComment} disabled={sending || !comment.trim()}
                  sx={{ bgcolor: C.accent, color: C.navy, minWidth: 44, height: 44, borderRadius: "8px", alignSelf: "flex-end", "&:hover": { bgcolor: C.accentHover }, "&:disabled": { opacity: 0.5 } }}>
                  <Send sx={{ fontSize: 16 }} />
                </Button>
              </Box>
            </Box>
          </Box>

          {/* ══ AUDIT TRAIL — Timeline ══ */}
          <Box sx={{ bgcolor: C.card, borderRadius: "10px", border: `1px solid ${C.border}`, p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <Box sx={{ width: 4, height: 20, borderRadius: "2px", bgcolor: C.accent }} />
              <Typography fontSize={13} fontWeight={600} color={C.textMuted} fontFamily="Inter, sans-serif" sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Activité
              </Typography>
              <Chip label={history.length} size="small" sx={{ ml: 1, height: 20, fontSize: "0.7rem", fontWeight: 700, backgroundColor: C.accentLight, color: C.accent }} />
            </Box>

            {historyLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} sx={{ color: C.accent }} />
              </Box>
            ) : history.length === 0 ? (
              <Typography fontSize={13} color={C.textMuted} fontFamily="Inter, sans-serif">
                Aucune activité enregistrée.
              </Typography>
            ) : (
              <Box sx={{ position: "relative" }}>
                {/* Ligne verticale teal */}
                <Box sx={{ position: "absolute", left: 17, top: 0, bottom: 0, width: 2, bgcolor: `${C.accent}30`, borderRadius: "1px" }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {history.map((item, index) => {
                    const config = getHistoryConfig(item.action);
                    const isLast = index === history.length - 1;
                    return (
                      <Box key={item._id} sx={{ display: "flex", gap: 2, pb: isLast ? 0 : 3, position: "relative" }}>
                        {/* Cercle icône */}
                        <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: config.bg, color: config.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, border: `2px solid ${config.color}30` }}>
                          {config.icon}
                        </Box>

                        {/* Contenu */}
                        <Box sx={{ flex: 1, pt: 0.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: C.navy }}>
                              {item.userId?.name}
                            </Typography>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: C.textSecondary }}>
                              {config.label}
                            </Typography>
                          </Box>

                          {/* oldValue → newValue */}
                          {(item.oldValue || item.newValue) && item.action !== 'commented' && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                              {item.oldValue && (
                                <Chip
                                  label={STATUS_LABELS[item.oldValue] ?? PRIORITY_LABELS[item.oldValue] ?? item.oldValue}
                                  size="small"
                                  sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600, bgcolor: "#F1F5F9", color: C.textSecondary }}
                                />
                              )}
                              {item.oldValue && item.newValue && (
                                <Typography sx={{ fontSize: "0.75rem", color: C.textMuted }}>→</Typography>
                              )}
                              {item.newValue && (
                                <Chip
                                  label={STATUS_LABELS[item.newValue] ?? PRIORITY_LABELS[item.newValue] ?? item.newValue}
                                  size="small"
                                  sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600, bgcolor: `${config.color}15`, color: config.color }}
                                />
                              )}
                            </Box>
                          )}

                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: C.textMuted }}>
                            {formatDateTime(item.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* RIGHT */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Details */}
          <Box sx={{ bgcolor: C.card, borderRadius: "10px", border: `1px solid ${C.border}`, p: 3 }}>
            <Typography fontSize={13} fontWeight={600} color={C.textMuted} fontFamily="Inter, sans-serif" sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: 2 }}>
              Details
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography fontSize={11} color={C.textMuted} fontFamily="Inter, sans-serif" mb={0.5}>Created by</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: C.accentLight, color: C.accent, fontSize: 10, fontWeight: 700 }}>
                    {ticket.createdBy.name.charAt(0)}
                  </Avatar>
                  <Typography fontSize={13} fontWeight={500} color={C.navy} fontFamily="Inter, sans-serif">{ticket.createdBy.name}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography fontSize={11} color={C.textMuted} fontFamily="Inter, sans-serif" mb={0.5}>Category</Typography>
                <Typography fontSize={13} fontWeight={500} color={C.navy} fontFamily="Inter, sans-serif" sx={{ textTransform: "capitalize" }}>{ticket.category}</Typography>
              </Box>
              <Box>
                <Typography fontSize={11} color={C.textMuted} fontFamily="Inter, sans-serif" mb={0.5}>Created at</Typography>
                <Typography fontSize={13} fontWeight={500} color={C.navy} fontFamily="Inter, sans-serif">{formatDateTime(ticket.createdAt)}</Typography>
              </Box>
              <Box>
                <Typography fontSize={11} color={C.textMuted} fontFamily="Inter, sans-serif" mb={0.5}>Assigned to</Typography>
                <Typography fontSize={13} fontWeight={500} color={C.navy} fontFamily="Inter, sans-serif">
                  {ticket.assignedTo?.name || <span style={{ color: C.textMuted, fontStyle: "italic" }}>Unassigned</span>}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Actions */}
          {canEdit && (
            <Box sx={{ bgcolor: C.card, borderRadius: "10px", border: `1px solid ${C.border}`, p: 3 }}>
              <Typography fontSize={13} fontWeight={600} color={C.textMuted} fontFamily="Inter, sans-serif" sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: 2 }}>
                Actions
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControl fullWidth size="small" sx={selectSx}>
                  <InputLabel>Status</InputLabel>
                  <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} label="Status" disabled={!isEditing}>
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={selectSx}>
                  <InputLabel>Assign to</InputLabel>
                  <Select value={editAssignedTo} onChange={(e) => setEditAssignedTo(e.target.value)} label="Assign to" disabled={!isEditing}>
                    <MenuItem value="">Unassigned</MenuItem>
                    {techList.map((tech) => (
                      <MenuItem key={tech._id} value={tech._id}>{tech.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}
        PaperProps={{ sx: { borderRadius: "12px", border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" } }}>
        <DialogTitle sx={{ color: C.navy, fontFamily: "Inter, sans-serif", fontWeight: 700 }}>Delete Ticket</DialogTitle>
        <DialogContent>
          <Typography fontSize={14} color={C.textSecondary} fontFamily="Inter, sans-serif">
            Are you sure you want to delete <strong>"{ticket.title}"</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog(false)} sx={{ color: C.slate, textTransform: "none", fontFamily: "Inter, sans-serif", borderRadius: "8px", "&:hover": { bgcolor: C.bgPage } }}>
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained" disableElevation
            sx={{ bgcolor: C.danger, color: "#FFFFFF", textTransform: "none", fontFamily: "Inter, sans-serif", borderRadius: "8px", fontWeight: 600, "&:hover": { bgcolor: C.dangerHover } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TicketDetails;