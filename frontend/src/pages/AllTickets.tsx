import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Download,
  Delete,
  Visibility,
  FilterList,
} from "@mui/icons-material";
import { C, statusColors, priorityColors } from "../theme";
import { SLABadge } from "../components/SLABadge";

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  slaDeadline?: string | null;
  slaBreached?: boolean;
  escalationLevel?: number;
  createdBy: { _id: string; name: string };
  assignedTo: { _id: string; name: string } | null;
}

const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const AllTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filtered, setFiltered] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === "admin";

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/tickets/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data);
        setFiltered(data);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    let result = tickets;
    if (search) {
      result = result.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.createdBy.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterStatus !== "all") result = result.filter((t) => t.status === filterStatus);
    if (filterPriority !== "all") result = result.filter((t) => t.priority === filterPriority);
    if (filterCategory !== "all") result = result.filter((t) => t.category === filterCategory);
    setFiltered(result);
  }, [search, filterStatus, filterPriority, filterCategory, tickets]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/tickets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTickets(tickets.filter((t) => t._id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Status", "Priority", "Category", "Created By", "Assigned To", "Created At"];
    const rows = filtered.map((t) => [
      t._id,
      t.title,
      t.status,
      t.priority,
      t.category,
      t.createdBy.name,
      t.assignedTo?.name || "Unassigned",
      new Date(t.createdAt).toLocaleDateString(),
    ]);
    let csv = headers.join(",") + "\n";
    rows.forEach((row) => { csv += row.map((c) => `"${c}"`).join(",") + "\n"; });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `tickets_${new Date().toISOString().split("T")[0]}.csv`);
    link.click();
  };

  const selectSx = {
    minWidth: 130,
    "& .MuiOutlinedInput-root": {
      bgcolor: C.card,
      borderRadius: "8px",
      fontSize: 13,
      color: C.navy,
      fontFamily: "Inter, sans-serif",
      "& fieldset": { borderColor: C.border },
      "&:hover fieldset": { borderColor: C.accent },
      "&.Mui-focused fieldset": { borderColor: C.accent },
    },
    "& .MuiInputLabel-root": {
      fontSize: 13,
      fontFamily: "Inter, sans-serif",
      color: C.textMuted,
    },
    "& .MuiInputLabel-root.Mui-focused": { color: C.accent },
    "& .MuiSelect-icon": { color: C.textMuted },
  };

  return (
    <Box sx={{
      flex: 1,
      p: 3,
      bgcolor: C.bgPage,
      fontFamily: "Inter, sans-serif",
    }}>

      {/* ── Header ── */}
      <Box sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
      }}>
        <Box>
          <Typography
            variant="h5"
            fontWeight={700}
            color={C.navy}
            fontFamily="Inter, sans-serif"
            sx={{ letterSpacing: "-0.3px" }}
          >
            All Tickets
          </Typography>
          <Typography
            variant="body2"
            color={C.textMuted}
            mt={0.3}
            fontFamily="Inter, sans-serif"
          >
            Manage all company tickets — {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          {isAdmin && (
            <Button
              variant="outlined"
              onClick={() => navigate("/tickets/admin-queue")}
              sx={{ borderColor: C.accent, color: C.accent, textTransform: "none", borderRadius: "8px", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 0.8, "&:hover": { bgcolor: C.accentLight } }}
            >
              <Box component="i" className="ti ti-inbox" sx={{ fontSize: 16 }} />
              File d'attente
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportCSV}
            disableElevation
            sx={{
              borderColor: C.border,
              color: C.slate,
              textTransform: "none",
              borderRadius: "8px",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "Inter, sans-serif",
              "&:hover": {
                borderColor: C.accent,
                color: C.accent,
                bgcolor: C.accentLight,
              },
            }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            disableElevation
            onClick={() => navigate("/create-ticket")}
            sx={{
              bgcolor: C.accent,
              color: C.navy,
              textTransform: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "Inter, sans-serif",
              boxShadow: `0 4px 12px rgba(95,194,186,0.3)`,
              "&:hover": {
                bgcolor: C.accentHover,
                transform: "translateY(-1px)",
                boxShadow: `0 8px 20px rgba(95,194,186,0.4)`,
              },
            }}
          >
            New Ticket
          </Button>
        </Box>
      </Box>

      {/* ── Filters ── */}
      <Box sx={{
        display: "flex",
        gap: 1.5,
        mb: 2.5,
        flexWrap: "wrap",
        alignItems: "center",
        p: 2,
        bgcolor: C.card,
        borderRadius: "10px",
        border: `1px solid ${C.border}`,
      }}>
        <FilterList sx={{ color: C.textMuted, fontSize: 18 }} />

        {/* Search */}
        <TextField
          placeholder="Search tickets..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            flex: 1,
            minWidth: 200,
            "& .MuiOutlinedInput-root": {
              bgcolor: C.bgPage,
              borderRadius: "8px",
              fontSize: 13,
              color: C.navy,
              fontFamily: "Inter, sans-serif",
              "& fieldset": { borderColor: C.border },
              "&:hover fieldset": { borderColor: C.accent },
              "&.Mui-focused fieldset": { borderColor: C.accent },
            },
            "& .MuiOutlinedInput-input::placeholder": {
              color: C.textMuted,
              opacity: 1,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </InputAdornment>
            ),
          }}
        />

        {/* Status filter */}
        <TextField
          select
          label="Status"
          size="small"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          sx={selectSx}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="assigned">Assigned</MenuItem>
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="waiting">Waiting</MenuItem>
          <MenuItem value="resolved">Resolved</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
        </TextField>

        {/* Priority filter */}
        <TextField
          select
          label="Priority"
          size="small"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          sx={selectSx}
        >
          <MenuItem value="all">All Priority</MenuItem>
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
        </TextField>

        {/* Category filter */}
        <TextField
          select
          label="Category"
          size="small"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          sx={selectSx}
        >
          <MenuItem value="all">All Categories</MenuItem>
          <MenuItem value="hardware">Hardware</MenuItem>
          <MenuItem value="software">Software</MenuItem>
          <MenuItem value="network">Network</MenuItem>
          <MenuItem value="access">Access</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </TextField>
      </Box>

      {/* ── Table ── */}
      <Box sx={{
        bgcolor: C.card,
        borderRadius: "10px",
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography fontSize={13} color={C.textMuted} fontFamily="Inter, sans-serif">
              Loading tickets...
            </Typography>
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography fontSize={14} color={C.textMuted} fontFamily="Inter, sans-serif">
              No tickets found
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                  {["Title", "Status", "Priority", "SLA", "Category", "Created By", "Assigned To", "Date", "Actions"].map((col) => (
                    <TableCell
                      key={col}
                      sx={{
                        fontWeight: 600,
                        color: C.textMuted,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        fontFamily: "Inter, sans-serif",
                        borderColor: C.border,
                        py: 1.5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((ticket) => (
                  <TableRow
                    key={ticket._id}
                    sx={{
                      "&:last-child td": { borderBottom: 0 },
                      "& td": { borderColor: C.border },
                      "&:hover": { bgcolor: "#F8FAFC" },
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <TableCell
                      onClick={() => navigate(`/tickets/${ticket._id}`)}
                      sx={{ maxWidth: 220 }}
                    >
                      <Typography
                        fontSize={13}
                        fontWeight={500}
                        color={C.navy}
                        fontFamily="Inter, sans-serif"
                        noWrap
                        sx={{
                          "&:hover": { color: C.accent },
                          transition: "color 0.15s ease",
                        }}
                      >
                        {ticket.title}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={ticket.status.replace("_", " ")}
                        size="small"
                        sx={{
                          bgcolor: statusColors[ticket.status]?.bg,
                          color: statusColors[ticket.status]?.text,
                          border: `1px solid ${statusColors[ticket.status]?.border}`,
                          fontWeight: 600,
                          fontSize: 11,
                          height: 22,
                          textTransform: "capitalize",
                          fontFamily: "Inter, sans-serif",
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={ticket.priority}
                        size="small"
                        sx={{
                          bgcolor: priorityColors[ticket.priority]?.bg,
                          color: priorityColors[ticket.priority]?.text,
                          border: `1px solid ${priorityColors[ticket.priority]?.border}`,
                          fontWeight: 600,
                          fontSize: 11,
                          height: 22,
                          textTransform: "capitalize",
                          fontFamily: "Inter, sans-serif",
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {ticket.slaDeadline ? (
                          <SLABadge slaDeadline={ticket.slaDeadline} slaBreached={ticket.slaBreached ?? false} status={ticket.status} />
                        ) : (
                          <Typography fontSize={11} color={C.textMuted} fontFamily="Inter, sans-serif">—</Typography>
                        )}
                        {(ticket.escalationLevel ?? 0) > 0 && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                            <Box component="i" className="ti ti-alert-triangle" sx={{ fontSize: 11, color: C.danger }} />
                            <Typography fontSize={10} color={C.danger} fontFamily="Inter, sans-serif" fontWeight={600}>
                              Escalade {ticket.escalationLevel}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography
                        fontSize={13}
                        color={C.textSecondary}
                        fontFamily="Inter, sans-serif"
                        sx={{ textTransform: "capitalize" }}
                      >
                        {ticket.category}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography fontSize={13} color={C.textSecondary} fontFamily="Inter, sans-serif">
                        {ticket.createdBy.name}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography fontSize={13} color={C.textSecondary} fontFamily="Inter, sans-serif">
                        {ticket.assignedTo?.name || (
                          <span style={{ color: C.textMuted, fontStyle: "italic" }}>Unassigned</span>
                        )}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography fontSize={12} color={C.textMuted} fontFamily="Inter, sans-serif">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/tickets/${ticket._id}`)}
                            sx={{
                              color: C.accent,
                              "&:hover": { bgcolor: C.accentLight },
                            }}
                          >
                            <Visibility sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        {isAdmin && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(ticket._id)}
                              sx={{
                                color: C.textMuted,
                                "&:hover": {
                                  color: C.danger,
                                  bgcolor: C.dangerBg,
                                },
                              }}
                            >
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default AllTickets;