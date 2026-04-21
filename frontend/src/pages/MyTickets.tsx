import { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  Add,
  ConfirmationNumber,
  TrendingUp,
  CheckCircle,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface Ticket {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
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

const statCardStyle = {
  bgcolor: "#fff",
  borderRadius: 3,
  p: 3,
  border: "1px solid rgba(65,67,27,0.08)",
  position: "relative" as const,
  overflow: "hidden",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 24px rgba(65,67,27,0.08)",
    borderColor: "rgba(174,183,132,0.5)",
  },
};

const MyTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const fetchMyTickets = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setTickets(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const total = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  const stats = [
    { label: "Total my tickets", value: total, icon: <ConfirmationNumber sx={{ fontSize: 20 }} />, color: "#41431B" },
    { label: "Open", value: openCount, icon: <TrendingUp sx={{ fontSize: 20 }} />, color: "#AEB784" },
    { label: "Resolved", value: resolvedCount, icon: <CheckCircle sx={{ fontSize: 20 }} />, color: "#556B2F" },
  ];

  return (
    <Box sx={{ flex: 1, p: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography fontSize={26} fontWeight={700} color="#41431B">
            My tickets
          </Typography>
          <Typography fontSize={14} color="rgba(65,67,27,0.5)" mt={0.5}>
            Track your submitted tickets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          disableElevation
          onClick={() => navigate("/create-ticket")}
          sx={{
            bgcolor: "#41431B",
            color: "#E3DBBB",
            textTransform: "none",
            borderRadius: 2,
            fontWeight: 600,
            px: 3,
            py: 1,
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "#555725",
              transform: "translateY(-2px)",
              boxShadow: "0 8px 20px rgba(65,67,27,0.25)",
            },
          }}
        >
          New ticket
        </Button>
      </Box>

      {/* Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 2,
          mb: 4,
        }}
      >
        {stats.map((stat) => (
          <Box key={stat.label} sx={statCardStyle}>
            <Box
              sx={{
                position: "absolute",
                top: -10,
                right: -10,
                width: 70,
                height: 70,
                borderRadius: "50%",
                bgcolor: "rgba(174,183,132,0.08)",
              }}
            />
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "rgba(174,183,132,0.2)",
                color: stat.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                position: "relative",
              }}
            >
              {stat.icon}
            </Box>
            <Typography fontSize={13} color="rgba(65,67,27,0.6)" mb={0.5}>
              {stat.label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Table */}
      <Box
        sx={{
          bgcolor: "#fff",
          borderRadius: 3,
          border: "1px solid rgba(65,67,27,0.08)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: "1px solid rgba(65,67,27,0.08)",
          }}
        >
          <Typography fontSize={16} fontWeight={700} color="#41431B">
            All my tickets
          </Typography>
        </Box>

        {tickets.length === 0 ? (
          <Box
            sx={{
              py: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <ConfirmationNumber sx={{ fontSize: 48, color: "rgba(65,67,27,0.15)" }} />
            <Typography fontSize={16} fontWeight={600} color="rgba(65,67,27,0.4)">
              No tickets yet
            </Typography>
            <Button
              variant="contained"
              disableElevation
              onClick={() => navigate("/create-ticket")}
              sx={{
                bgcolor: "#41431B",
                color: "#E3DBBB",
                textTransform: "none",
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                "&:hover": { bgcolor: "#555725" },
              }}
            >
              Create your first ticket
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(174,183,132,0.08)" }}>
                  {["Title", "Status", "Priority", "Category", "Created at", "Actions"].map(
                    (col) => (
                      <TableCell
                        key={col}
                        sx={{
                          fontWeight: 600,
                          color: "rgba(65,67,27,0.6)",
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {col}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket._id}
                    sx={{
                      "&:last-child td": { borderBottom: 0 },
                      transition: "all 0.2s ease",
                      "&:hover": { bgcolor: "rgba(174,183,132,0.05)" },
                    }}
                  >
                    <TableCell>
                      <Typography fontSize={14} color="#41431B" fontWeight={500}>
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
                          fontWeight: 600,
                          fontSize: 11,
                          borderRadius: 1.5,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
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
                          fontWeight: 600,
                          fontSize: 11,
                          borderRadius: 1.5,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={14} color="rgba(65,67,27,0.7)" sx={{ textTransform: "capitalize" }}>
                        {ticket.category}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13} color="rgba(65,67,27,0.5)">
                        {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => navigate(`/tickets/${ticket._id}`)}
                        sx={{
                          textTransform: "none",
                          color: "#41431B",
                          fontWeight: 600,
                          fontSize: 12,
                          borderRadius: 1.5,
                          px: 1.5,
                          "&:hover": { bgcolor: "rgba(174,183,132,0.2)" },
                        }}
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

export default MyTickets;
