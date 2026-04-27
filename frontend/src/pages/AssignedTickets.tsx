import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip,
} from "@mui/material";
import { ConfirmationNumber, TrendingUp, AccessTime, CheckCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { C, statusColors, priorityColors } from "../theme";

interface Ticket {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  createdBy: { _id: string; name: string; email: string; role: string };
}

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const AssignedTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const fetchAssignedTickets = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets/assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setTickets(data);
    } catch (err) { console.log(err); }
  };

  useEffect(() => { fetchAssignedTickets(); }, []);

  const stats = [
    { label: "Total assigned", value: tickets.length, icon: <ConfirmationNumber sx={{ fontSize: 20 }} />, color: C.accent },
    { label: "Open", value: tickets.filter((t) => t.status === "open").length, icon: <TrendingUp sx={{ fontSize: 20 }} />, color: "#D97706" },
    { label: "In progress", value: tickets.filter((t) => t.status === "in_progress").length, icon: <AccessTime sx={{ fontSize: 20 }} />, color: "#B45309" },
    { label: "Resolved", value: tickets.filter((t) => t.status === "resolved").length, icon: <CheckCircle sx={{ fontSize: 20 }} />, color: "#78350F" },
  ];

  return (
    <Box sx={{ flex: 1, p: 4, bgcolor: C.bg }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography fontSize={26} fontWeight={700} color={C.textPrimary}>Assigned tickets</Typography>
        <Typography fontSize={14} color={C.textSecondary} mt={0.5}>Tickets assigned to you</Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 4 }}>
        {stats.map((stat) => (
          <Box key={stat.label} sx={{
            bgcolor: C.card, borderRadius: 3, p: 3, border: `1px solid ${C.border}`,
            position: "relative", overflow: "hidden", transition: "all 0.3s ease",
            "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 24px rgba(0,0,0,0.3)", borderColor: "rgba(245,158,11,0.3)" },
          }}>
            <Box sx={{ position: "absolute", top: -10, right: -10, width: 70, height: 70, borderRadius: "50%", bgcolor: "rgba(245,158,11,0.05)" }} />
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: C.iconBg, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", mb: 2, position: "relative" }}>
              {stat.icon}
            </Box>
            <Typography fontSize={13} color={C.textSecondary} mb={0.5}>{stat.label}</Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>{stat.value}</Typography>
          </Box>
        ))}
      </Box>

      {/* Table */}
      <Box sx={{ bgcolor: C.card, borderRadius: 3, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${C.border}` }}>
          <Typography fontSize={16} fontWeight={700} color={C.textPrimary}>Your assigned tickets</Typography>
        </Box>

        {tickets.length === 0 ? (
          <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <ConfirmationNumber sx={{ fontSize: 48, color: C.textMuted }} />
            <Typography fontSize={16} fontWeight={600} color={C.textMuted}>No tickets assigned yet</Typography>
            <Typography fontSize={14} color={C.textMuted}>New assignments will appear here</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: C.tableHeader }}>
                  {["Title", "Status", "Priority", "Category", "Created by", "Created at", "Actions"].map((col) => (
                    <TableCell key={col} sx={{ fontWeight: 600, color: C.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, borderColor: C.border }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket._id} sx={{ "&:last-child td": { borderBottom: 0 }, "& td": { borderColor: C.border }, "&:hover": { bgcolor: C.hoverBg } }}>
                    <TableCell>
                      <Typography fontSize={14} color={C.textPrimary} fontWeight={500}>{ticket.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={ticket.status.replace("_", " ")} size="small"
                        sx={{ bgcolor: statusColors[ticket.status]?.bg, color: statusColors[ticket.status]?.text, fontWeight: 600, fontSize: 11, borderRadius: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={ticket.priority} size="small"
                        sx={{ bgcolor: priorityColors[ticket.priority]?.bg, color: priorityColors[ticket.priority]?.text, fontWeight: 600, fontSize: 11, borderRadius: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={14} color={C.textSecondary} sx={{ textTransform: "capitalize" }}>{ticket.category}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: C.iconBg, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                          {ticket.createdBy?.name?.charAt(0) || "?"}
                        </Box>
                        <Typography fontSize={13} color={C.textSecondary}>{ticket.createdBy?.name || "Unknown"}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13} color={C.textMuted}>
                        {new Date(ticket.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => navigate(`/tickets/${ticket._id}`)}
                        sx={{ textTransform: "none", color: C.accent, fontWeight: 600, fontSize: 12, borderRadius: 1.5, px: 1.5, "&:hover": { bgcolor: C.hoverBg } }}
                      >
                        View
                      </Button>
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