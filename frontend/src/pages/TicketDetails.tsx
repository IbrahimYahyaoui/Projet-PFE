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
  MenuItem,
  Alert,
  Snackbar,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack,
  Send,
  AccessTime,
  Category,
  Person,
  Assignment,
  Delete,
} from "@mui/icons-material";

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

const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const statusColors: Record<string, { bg: string; text: string }> = {
  open: { bg: "rgba(174,183,132,0.25)", text: "#41431B" },
  in_progress: { bg: "rgba(138,127,60,0.2)", text: "#5c5420" },
  resolved: { bg: "rgba(85,107,47,0.2)", text: "#3d4d21" },
  closed: { bg: "rgba(65,67,27,0.1)", text: "rgba(65,67,27,0.5)" },
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: "rgba(174,183,132,0.25)", text: "#41431B" },
  medium: { bg: "rgba(138,127,60,0.2)", text: "#5c5420" },
  high: { bg: "rgba(255,152,0,0.15)", text: "#e65100" },
  critical: { bg: "rgba(198,40,40,0.12)", text: "#c62828" },
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

  // ── Charger le ticket ──
  const fetchTicket = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setTicket(data);
      else setError(data.message || "Failed to load ticket");
    } catch (err) {
      setError("Cannot connect to server");
    }
    setLoading(false);
  };

  // ── Charger les techniciens (pour l'assignation) ──
  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTechnicians(data.filter((u: User) => u.role === "tech"));
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchTicket();
    if (isAdmin) fetchTechnicians();
  }, [id]);

  // ── Changer le statut ──
  const handleStatusChange = async (newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (response.ok) {
        setTicket(data);
        setSuccess("Status updated!");
      }
    } catch (err) {
      setError("Failed to update status");
    }
  };

  // ── Assigner un technicien ──
  const handleAssign = async (techId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignedTo: techId || null }),
      });
      const data = await response.json();
      if (response.ok) {
        setTicket(data);
        setSuccess("Assignment updated!");
      }
    } catch (err) {
      setError("Failed to assign ticket");
    }
  };

  // ── Ajouter un commentaire ──
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await response.json();
      if (response.ok) {
        setTicket(data);
        setNewComment("");
      }
    } catch (err) {
      setError("Failed to add comment");
    }
  };

  // ── Supprimer le ticket (admin) ──
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        navigate("/all-tickets");
      }
    } catch (err) {
      setError("Failed to delete ticket");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
        <CircularProgress sx={{ color: "#41431B" }} />
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box sx={{ flex: 1, p: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Ticket not found
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, p: 4 }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{
          textTransform: "none",
          color: "rgba(65,67,27,0.6)",
          mb: 2,
          "&:hover": { bgcolor: "rgba(174,183,132,0.15)" },
        }}
      >
        Back
      </Button>

      <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 3 }}>
        {/* ── Colonne principale ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Ticket info */}
          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 3,
              p: 4,
              border: "1px solid rgba(65,67,27,0.08)",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={24} fontWeight={700} color="#41431B" mb={1}>
                  {ticket.title}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Chip
                    label={ticket.status.replace("_", " ")}
                    size="small"
                    sx={{
                      bgcolor: statusColors[ticket.status]?.bg,
                      color: statusColors[ticket.status]?.text,
                      fontWeight: 600,
                      fontSize: 11,
                      borderRadius: 1.5,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  />
                  <Chip
                    label={ticket.priority}
                    size="small"
                    sx={{
                      bgcolor: priorityColors[ticket.priority]?.bg,
                      color: priorityColors[ticket.priority]?.text,
                      fontWeight: 600,
                      fontSize: 11,
                      borderRadius: 1.5,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  />
                </Box>
              </Box>
              {isAdmin && (
                <IconButton
                  onClick={handleDelete}
                  sx={{
                    color: "#c62828",
                    "&:hover": { bgcolor: "rgba(198,40,40,0.1)" },
                  }}
                >
                  <Delete />
                </IconButton>
              )}
            </Box>

            <Divider sx={{ my: 2, borderColor: "rgba(65,67,27,0.08)" }} />

            <Typography fontSize={13} color="rgba(65,67,27,0.6)" mb={1} fontWeight={600}>
              Description
            </Typography>
            <Typography fontSize={14} color="#41431B" sx={{ whiteSpace: "pre-wrap" }}>
              {ticket.description}
            </Typography>
          </Box>

          {/* Comments */}
          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 3,
              p: 4,
              border: "1px solid rgba(65,67,27,0.08)",
            }}
          >
            <Typography fontSize={16} fontWeight={700} color="#41431B" mb={3}>
              Comments ({ticket.comments.length})
            </Typography>

            {ticket.comments.length === 0 ? (
              <Typography fontSize={14} color="rgba(65,67,27,0.5)" fontStyle="italic">
                No comments yet. Be the first to comment!
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
                {ticket.comments.map((comment) => (
                  <Box
                    key={comment._id}
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      p: 2,
                      bgcolor: "rgba(174,183,132,0.08)",
                      borderRadius: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: "#AEB784",
                        color: "#41431B",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {getInitials(comment.userId?.name || "?")}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography fontSize={13} fontWeight={600} color="#41431B">
                          {comment.userId?.name || "Unknown"}
                        </Typography>
                        <Typography fontSize={11} color="rgba(65,67,27,0.5)">
                          {formatDate(comment.createdAt)}
                        </Typography>
                      </Box>
                      <Typography fontSize={14} color="rgba(65,67,27,0.8)">
                        {comment.content}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* Add comment */}
            <Divider sx={{ my: 2, borderColor: "rgba(65,67,27,0.08)" }} />
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
              <TextField
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                fullWidth
                multiline
                rows={2}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&.Mui-focused fieldset": { borderColor: "#AEB784" },
                  },
                }}
              />
              <Button
                variant="contained"
                disableElevation
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                sx={{
                  bgcolor: "#41431B",
                  color: "#E3DBBB",
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: 600,
                  minWidth: 48,
                  height: 56,
                  "&:hover": { bgcolor: "#555725" },
                }}
              >
                <Send />
              </Button>
            </Box>
          </Box>
        </Box>

        {/* ── Sidebar droite ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Details */}
          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 3,
              p: 3,
              border: "1px solid rgba(65,67,27,0.08)",
            }}
          >
            <Typography fontSize={14} fontWeight={700} color="#41431B" mb={2}>
              Details
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Created by */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Person sx={{ fontSize: 16, color: "rgba(65,67,27,0.5)" }} />
                  <Typography fontSize={12} color="rgba(65,67,27,0.6)">
                    Created by
                  </Typography>
                </Box>
                <Typography fontSize={13} fontWeight={600} color="#41431B" sx={{ ml: 3 }}>
                  {ticket.createdBy?.name || "Unknown"}
                </Typography>
              </Box>

              {/* Category */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Category sx={{ fontSize: 16, color: "rgba(65,67,27,0.5)" }} />
                  <Typography fontSize={12} color="rgba(65,67,27,0.6)">
                    Category
                  </Typography>
                </Box>
                <Typography fontSize={13} fontWeight={600} color="#41431B" sx={{ ml: 3, textTransform: "capitalize" }}>
                  {ticket.category}
                </Typography>
              </Box>

              {/* Created at */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <AccessTime sx={{ fontSize: 16, color: "rgba(65,67,27,0.5)" }} />
                  <Typography fontSize={12} color="rgba(65,67,27,0.6)">
                    Created at
                  </Typography>
                </Box>
                <Typography fontSize={13} fontWeight={600} color="#41431B" sx={{ ml: 3 }}>
                  {formatDate(ticket.createdAt)}
                </Typography>
              </Box>

              {/* Assigned to */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Assignment sx={{ fontSize: 16, color: "rgba(65,67,27,0.5)" }} />
                  <Typography fontSize={12} color="rgba(65,67,27,0.6)">
                    Assigned to
                  </Typography>
                </Box>
                <Typography fontSize={13} fontWeight={600} color="#41431B" sx={{ ml: 3 }}>
                  {ticket.assignedTo?.name || "Unassigned"}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Actions (admin/tech) */}
          {canManage && (
            <Box
              sx={{
                bgcolor: "#fff",
                borderRadius: 3,
                p: 3,
                border: "1px solid rgba(65,67,27,0.08)",
              }}
            >
              <Typography fontSize={14} fontWeight={700} color="#41431B" mb={2}>
                Actions
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Change status */}
                <TextField
                  label="Status"
                  select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&.Mui-focused fieldset": { borderColor: "#AEB784" },
                    },
                  }}
                >
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </TextField>

                {/* Assign technician (admin only) */}
                {isAdmin && (
                  <TextField
                    label="Assign to technician"
                    select
                    value={ticket.assignedTo?._id || ""}
                    onChange={(e) => handleAssign(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&.Mui-focused fieldset": { borderColor: "#AEB784" },
                      },
                    }}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {technicians.map((tech) => (
                      <MenuItem key={tech._id} value={tech._id}>
                        {tech.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TicketDetails;