import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, TextField, Chip, Avatar, Divider,
  MenuItem, Alert, Snackbar, IconButton, CircularProgress,
} from "@mui/material";
import { ArrowBack, Send, AccessTime, Category, Person, Assignment, Delete } from "@mui/icons-material";
import { C, statusColors, priorityColors } from "../theme";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Comment {
  _id: string;
  content: string;
  userId: User;
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
  createdBy: User;
  assignedTo: User | null;
  comments: Comment[];
}

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const selectStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#1C1410",
    color: C.textPrimary,
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: "rgba(245,158,11,0.3)" },
    "&.Mui-focused fieldset": { borderColor: C.accent },
  },
  "& .MuiInputLabel-root": { color: C.textSecondary },
  "& .MuiInputLabel-root.Mui-focused": { color: C.accent },
  "& .MuiSelect-icon": { color: C.textSecondary },
};

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = currentUser?.role === "admin";
  const isTech = currentUser?.role === "tech";
  const canManage = isAdmin || isTech;

  const fetchTicket = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setTicket(data);
      else setError(data.message || "Failed to load ticket");
    } catch { setError("Cannot connect to server"); }
    setLoading(false);
  };

  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setTechnicians(data.filter((u: User) => u.role === "tech"));
    } catch { console.log("Failed to load technicians"); }
  };

  useEffect(() => {
    fetchTicket();
    if (isAdmin) fetchTechnicians();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (response.ok) { setTicket(data); setSuccess("Status updated!"); }
    } catch { setError("Failed to update status"); }
  };

  const handleAssign = async (techId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignedTo: techId || null }),
      });
      const data = await response.json();
      if (response.ok) { setTicket(data); setSuccess("Assignment updated!"); }
    } catch { setError("Failed to assign ticket"); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await response.json();
      if (response.ok) { setTicket(data); setNewComment(""); }
    } catch { setError("Failed to add comment"); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) navigate("/all-tickets");
    } catch { setError("Failed to delete ticket"); }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", py: 10, bgcolor: C.bg }}>
        <CircularProgress sx={{ color: C.accent }} />
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box sx={{ flex: 1, p: 4, bgcolor: C.bg }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>Ticket not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, p: 4, bgcolor: C.bg }}>
      {/* Back */}
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}
        sx={{ textTransform: "none", color: C.textSecondary, mb: 2, "&:hover": { bgcolor: C.hoverBg } }}
      >
        Back
      </Button>

      <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 3 }}>
        {/* Left column */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Ticket info */}
          <Box sx={{ bgcolor: C.card, borderRadius: 3, p: 4, border: `1px solid ${C.border}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={24} fontWeight={700} color={C.textPrimary} mb={1}>
                  {ticket.title}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Chip label={ticket.status.replace("_", " ")} size="small"
                    sx={{ bgcolor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text, fontWeight: 600, fontSize: 11, borderRadius: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                  />
                  <Chip label={ticket.priority} size="small"
                    sx={{ bgcolor: priorityColors[ticket.priority]?.bg, color: priorityColors[ticket.priority]?.text, fontWeight: 600, fontSize: 11, borderRadius: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                  />
                </Box>
              </Box>
              {isAdmin && (
                <IconButton onClick={handleDelete} sx={{ color: C.danger, "&:hover": { bgcolor: C.dangerBg } }}>
                  <Delete />
                </IconButton>
              )}
            </Box>

            <Divider sx={{ my: 2, borderColor: C.border }} />

            <Typography fontSize={13} color={C.textMuted} mb={1} fontWeight={600}>Description</Typography>
            <Typography fontSize={14} color={C.textSecondary} sx={{ whiteSpace: "pre-wrap" }}>
              {ticket.description}
            </Typography>
          </Box>

          {/* Comments */}
          <Box sx={{ bgcolor: C.card, borderRadius: 3, p: 4, border: `1px solid ${C.border}` }}>
            <Typography fontSize={16} fontWeight={700} color={C.textPrimary} mb={3}>
              Comments ({ticket.comments.length})
            </Typography>

            {ticket.comments.length === 0 ? (
              <Typography fontSize={14} color={C.textMuted} fontStyle="italic">
                No comments yet. Be the first to comment!
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
                {ticket.comments.map((comment) => (
                  <Box key={comment._id} sx={{ display: "flex", gap: 1.5, p: 2, bgcolor: "#1C1410", borderRadius: 2, border: `1px solid ${C.border}` }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: C.iconBg, color: C.accent, fontSize: 13, fontWeight: 700 }}>
                      {getInitials(comment.userId?.name || "?")}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography fontSize={13} fontWeight={600} color={C.textPrimary}>
                          {comment.userId?.name || "Unknown"}
                        </Typography>
                        <Typography fontSize={11} color={C.textMuted}>
                          {formatDate(comment.createdAt)}
                        </Typography>
                      </Box>
                      <Typography fontSize={14} color={C.textSecondary}>{comment.content}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            <Divider sx={{ my: 2, borderColor: C.border }} />
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
              <TextField
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                fullWidth multiline rows={2} size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2, bgcolor: "#1C1410", color: C.textPrimary,
                    "& fieldset": { borderColor: C.border },
                    "&:hover fieldset": { borderColor: "rgba(245,158,11,0.3)" },
                    "&.Mui-focused fieldset": { borderColor: C.accent },
                  },
                  "& .MuiOutlinedInput-input::placeholder": { color: C.textMuted, opacity: 1 },
                }}
              />
              <Button variant="contained" disableElevation onClick={handleAddComment} disabled={!newComment.trim()}
                sx={{ bgcolor: C.accent, color: "#1C1410", borderRadius: 2, minWidth: 48, height: 56, "&:hover": { bgcolor: C.accentHover } }}
              >
                <Send />
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Right column */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Details */}
          <Box sx={{ bgcolor: C.card, borderRadius: 3, p: 3, border: `1px solid ${C.border}` }}>
            <Typography fontSize={14} fontWeight={700} color={C.textPrimary} mb={2}>Details</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { icon: <Person sx={{ fontSize: 16 }} />, label: "Created by", value: ticket.createdBy?.name || "Unknown" },
                { icon: <Category sx={{ fontSize: 16 }} />, label: "Category", value: ticket.category },
                { icon: <AccessTime sx={{ fontSize: 16 }} />, label: "Created at", value: formatDate(ticket.createdAt) },
                { icon: <Assignment sx={{ fontSize: 16 }} />, label: "Assigned to", value: ticket.assignedTo?.name || "Unassigned" },
              ].map((item) => (
                <Box key={item.label}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Box sx={{ color: C.textMuted }}>{item.icon}</Box>
                    <Typography fontSize={12} color={C.textMuted}>{item.label}</Typography>
                  </Box>
                  <Typography fontSize={13} fontWeight={600} color={C.textPrimary} sx={{ ml: 3, textTransform: "capitalize" }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Actions */}
          {canManage && (
            <Box sx={{ bgcolor: C.card, borderRadius: 3, p: 3, border: `1px solid ${C.border}` }}>
              <Typography fontSize={14} fontWeight={700} color={C.textPrimary} mb={2}>Actions</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField label="Status" select value={ticket.status} onChange={(e) => handleStatusChange(e.target.value)} fullWidth size="small" sx={selectStyle}>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </TextField>

                {isAdmin && (
                  <TextField label="Assign to technician" select value={ticket.assignedTo?._id || ""} onChange={(e) => handleAssign(e.target.value)} fullWidth size="small" sx={selectStyle}>
                    <MenuItem value="">Unassigned</MenuItem>
                    {technicians.map((tech) => (
                      <MenuItem key={tech._id} value={tech._id}>{tech.name}</MenuItem>
                    ))}
                  </TextField>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TicketDetails;