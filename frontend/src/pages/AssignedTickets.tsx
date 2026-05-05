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
import { Add, Visibility } from "@mui/icons-material";
import { C, statusColors, priorityColors } from "../theme";

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
}

const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const AssignedTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filtered, setFiltered] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/tickets/assigned`, {
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
    setFiltered(result);
  }, [search, filterStatus, filterPriority, tickets]);

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

  // Stats
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

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
            Assigned Tickets
          </Typography>
          <Typography
            variant="body2"
            color={C.textMuted}
            mt={0.3}
            fontFamily="Inter, sans-serif"
          >
            Tickets assigned to you
          </Typography>
        </Box>
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

      {/* ── Stats Cards ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 2,
        mb: 3,
      }}>
        {[
          { label: "Total assigned", value: totalCount, color: C.navy, bg: "rgba(11,22,44,0.06)" },
          { label: "Open", value: openCount, color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
          { label: "In progress", value: inProgressCount, color: C.accent, bg: C.accentLight },
          { label: "Resolved", value: resolvedCount, color: "#22C55E", bg: "rgba(34,197,94,0.08)" },
        ].map((stat) => (
          <Box
            key={stat.label}
            sx={{
              bgcolor: C.card,
              borderRadius: "10px",
              border: `1px solid ${C.border}`,
              p: 2.5,
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                borderColor: C.accent,
              },
            }}
          >
            <Typography
              fontSize={11}
              fontWeight={600}
              color={C.textMuted}
              fontFamily="Inter, sans-serif"
              sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: 1 }}
            >
              {stat.label}
            </Typography>
            <Typography
              fontSize={28}
              fontWeight={700}
              color={stat.color}
              fontFamily="Inter, sans-serif"
              sx={{ letterSpacing: "-0.5px" }}
            >
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ── Filters ── */}
      <Box sx={{
        display: "flex",
        gap: 1.5,
        mb: 2.5,
        alignItems: "center",
        p: 2,
        bgcolor: C.card,
        borderRadius: "10px",
        border: `1px solid ${C.border}`,
        flexWrap: "wrap",
      }}>
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
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="resolved">Resolved</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
        </TextField>

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
              No assigned tickets yet 🎉
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                  {["Title", "Status", "Priority", "Category", "Created By", "Date", "Actions"].map((col) => (
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
                      transition: "all 0.15s ease",
                    }}
                  >
                    <TableCell
                      onClick={() => navigate(`/tickets/${ticket._id}`)}
                      sx={{ cursor: "pointer", maxWidth: 250 }}
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
                      <Typography fontSize={12} color={C.textMuted} fontFamily="Inter, sans-serif">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Tooltip title="View ticket">
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

export default AssignedTickets;