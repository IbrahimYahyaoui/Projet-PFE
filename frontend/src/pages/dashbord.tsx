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
  LinearProgress,
} from "@mui/material";
import {
  Add,
  TrendingUp,
  ConfirmationNumber,
  AccessTime,
  CheckCircle,
  Warning,
  Computer,
  Code,
  Wifi,
  Lock,
  HelpOutline,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface Ticket {
  _id: string;
  title: string;
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

const categoryIcons: Record<string, JSX.Element> = {
  hardware: <Computer sx={{ fontSize: 24 }} />,
  software: <Code sx={{ fontSize: 24 }} />,
  network: <Wifi sx={{ fontSize: 24 }} />,
  access: <Lock sx={{ fontSize: 24 }} />,
  other: <HelpOutline sx={{ fontSize: 24 }} />,
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: "rgba(174,183,132,0.25)", text: "#41431B" },
  medium: { bg: "rgba(138,127,60,0.2)", text: "#5c5420" },
  high: { bg: "rgba(255,152,0,0.15)", text: "#e65100" },
  critical: { bg: "rgba(198,40,40,0.12)", text: "#c62828" },
};

const Dashbord = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.name || "User";
  const userRole = user?.role || "user";
  const isAdmin = userRole === "admin";

  // ── Charger les tickets ──
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = isAdmin ? "/api/tickets/all" : "/api/tickets/my";
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setTickets(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // ── Calculs des stats ──
  const total = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;
  const closedCount = tickets.filter((t) => t.status === "closed").length;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  // ── KPI Cards ──
  const stats = [
    { label: "Total tickets", value: total, icon: <ConfirmationNumber sx={{ fontSize: 20 }} />, color: "#41431B" },
    { label: "Open", value: openCount, icon: <TrendingUp sx={{ fontSize: 20 }} />, color: "#AEB784" },
    { label: "In progress", value: inProgressCount, icon: <AccessTime sx={{ fontSize: 20 }} />, color: "#8a7f3c" },
    { label: "Resolved", value: resolvedCount, icon: <CheckCircle sx={{ fontSize: 20 }} />, subtitle: `${resolutionRate}% rate`, color: "#556B2F" },
  ];

  // ── Trend data (6 derniers mois) ──
  const getTrendData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];

      const count = tickets.filter((t) => {
        const ticketDate = new Date(t.createdAt);
        return (
          ticketDate.getMonth() === date.getMonth() &&
          ticketDate.getFullYear() === date.getFullYear()
        );
      }).length;

      data.push({ month: monthName, tickets: count });
    }

    return data;
  };

  // ── Status distribution data ──
  const statusData = [
    { name: "Open", value: openCount, color: "#AEB784" },
    { name: "In progress", value: inProgressCount, color: "#8a7f3c" },
    { name: "Resolved", value: resolvedCount, color: "#556B2F" },
    { name: "Closed", value: closedCount, color: "#41431B" },
  ].filter((s) => s.value > 0);

  // ── Priority data ──
  const priorityData = [
    { name: "Low", value: tickets.filter((t) => t.priority === "low").length, color: "#AEB784" },
    { name: "Medium", value: tickets.filter((t) => t.priority === "medium").length, color: "#8a7f3c" },
    { name: "High", value: tickets.filter((t) => t.priority === "high").length, color: "#e65100" },
    { name: "Critical", value: tickets.filter((t) => t.priority === "critical").length, color: "#c62828" },
  ];

  // ── Critical tickets ──
  const criticalTickets = tickets
    .filter((t) => (t.priority === "critical" || t.priority === "high") && t.status !== "resolved" && t.status !== "closed")
    .slice(0, 5);

  // ── Top categories ──
  const getCategoryStats = () => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const topCategories = getCategoryStats();

  // ── Technician performance ──
  const getTechStats = () => {
    const techMap: Record<string, { name: string; assigned: number; resolved: number }> = {};

    tickets.forEach((t) => {
      if (t.assignedTo) {
        const id = t.assignedTo._id;
        if (!techMap[id]) {
          techMap[id] = { name: t.assignedTo.name, assigned: 0, resolved: 0 };
        }
        techMap[id].assigned++;
        if (t.status === "resolved" || t.status === "closed") {
          techMap[id].resolved++;
        }
      }
    });

    return Object.values(techMap).map((tech) => ({
      ...tech,
      rate: tech.assigned > 0 ? Math.round((tech.resolved / tech.assigned) * 100) : 0,
    }));
  };

  const techStats = getTechStats();

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
          <Typography variant="h5" fontWeight={700} color="#41431B">
            Dashboard
          </Typography>
          <Typography variant="body2" color="rgba(65,67,27,0.6)" mt={0.5}>
            Welcome back, {userName}
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

      {/* KPI Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
        {stats.map((stat) => (
          <Box
            key={stat.label}
            sx={{
              bgcolor: "#fff",
              borderRadius: 3,
              p: 3,
              border: "1px solid rgba(65,67,27,0.08)",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 24px rgba(65,67,27,0.08)",
              },
            }}
          >
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
            {stat.subtitle && (
              <Typography fontSize={11} color="rgba(65,67,27,0.5)" mt={0.5}>
                {stat.subtitle}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      {/* Charts Row 1 */}
      <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 2, mb: 3 }}>
        {/* Trend chart */}
        <Box sx={{ bgcolor: "#fff", borderRadius: 3, p: 3, border: "1px solid rgba(65,67,27,0.08)" }}>
          <Typography fontSize={15} fontWeight={700} color="#41431B" mb={2}>
            Tickets trend (6 months)
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={getTrendData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,67,27,0.08)" />
              <XAxis dataKey="month" stroke="rgba(65,67,27,0.5)" fontSize={12} />
              <YAxis stroke="rgba(65,67,27,0.5)" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid rgba(65,67,27,0.15)",
                  borderRadius: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="tickets"
                stroke="#41431B"
                strokeWidth={3}
                dot={{ fill: "#AEB784", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Status donut */}
        <Box sx={{ bgcolor: "#fff", borderRadius: 3, p: 3, border: "1px solid rgba(65,67,27,0.08)" }}>
          <Typography fontSize={15} fontWeight={700} color="#41431B" mb={2}>
            Status distribution
          </Typography>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography color="rgba(65,67,27,0.4)">No data</Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1 }}>
            {statusData.map((s) => (
              <Box key={s.name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: s.color }} />
                <Typography fontSize={11} color="rgba(65,67,27,0.7)">
                  {s.name}: {s.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Charts Row 2 */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
        {/* Critical tickets */}
        <Box sx={{ bgcolor: "#fff", borderRadius: 3, p: 3, border: "1px solid rgba(65,67,27,0.08)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Warning sx={{ color: "#c62828", fontSize: 20 }} />
            <Typography fontSize={15} fontWeight={700} color="#41431B">
              Critical tickets
            </Typography>
          </Box>
          {criticalTickets.length === 0 ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography fontSize={13} color="rgba(65,67,27,0.5)">
                No critical tickets — all clear!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {criticalTickets.map((t) => (
                <Box
                  key={t._id}
                  onClick={() => navigate(`/tickets/${t._id}`)}
                  sx={{
                    p: 1.5,
                    bgcolor: "rgba(198,40,40,0.05)",
                    borderRadius: 2,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": { bgcolor: "rgba(198,40,40,0.1)", transform: "translateX(4px)" },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography fontSize={13} fontWeight={600} color="#41431B" noWrap sx={{ flex: 1 }}>
                      {t.title}
                    </Typography>
                    <Chip
                      label={t.priority}
                      size="small"
                      sx={{
                        bgcolor: priorityColors[t.priority]?.bg,
                        color: priorityColors[t.priority]?.text,
                        fontWeight: 600,
                        fontSize: 10,
                        height: 20,
                        textTransform: "uppercase",
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Priority distribution */}
        <Box sx={{ bgcolor: "#fff", borderRadius: 3, p: 3, border: "1px solid rgba(65,67,27,0.08)" }}>
          <Typography fontSize={15} fontWeight={700} color="#41431B" mb={2}>
            Tickets by priority
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,67,27,0.08)" />
              <XAxis dataKey="name" stroke="rgba(65,67,27,0.5)" fontSize={12} />
              <YAxis stroke="rgba(65,67,27,0.5)" fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid rgba(65,67,27,0.15)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Top Categories */}
      <Box sx={{ mb: 3 }}>
        <Typography fontSize={15} fontWeight={700} color="#41431B" mb={2}>
          Top categories
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {topCategories.length === 0 ? (
            <Typography fontSize={13} color="rgba(65,67,27,0.5)">No data yet</Typography>
          ) : (
            topCategories.map((cat, index) => (
              <Box
                key={cat.name}
                sx={{
                  bgcolor: "#fff",
                  borderRadius: 3,
                  p: 3,
                  border: "1px solid rgba(65,67,27,0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  transition: "all 0.3s ease",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 24px rgba(65,67,27,0.08)" },
                }}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: 2,
                    bgcolor: "rgba(174,183,132,0.2)",
                    color: "#41431B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {categoryIcons[cat.name] || categoryIcons.other}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography fontSize={12} color="rgba(65,67,27,0.5)" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    #{index + 1}
                  </Typography>
                  <Typography fontSize={15} fontWeight={700} color="#41431B" sx={{ textTransform: "capitalize" }}>
                    {cat.name}
                  </Typography>
                  <Typography fontSize={12} color="rgba(65,67,27,0.6)">
                    {cat.count} tickets
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Technician performance (admin only) */}
      {isAdmin && (
        <Box sx={{ bgcolor: "#fff", borderRadius: 3, border: "1px solid rgba(65,67,27,0.08)", overflow: "hidden" }}>
          <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid rgba(65,67,27,0.08)" }}>
            <Typography fontSize={15} fontWeight={700} color="#41431B">
              Technician performance
            </Typography>
          </Box>
          {techStats.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography fontSize={13} color="rgba(65,67,27,0.5)">
                No assigned tickets yet
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "rgba(174,183,132,0.08)" }}>
                    {["Technician", "Assigned", "Resolved", "Resolution rate", "Actions"].map((col) => (
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
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {techStats.map((tech) => (
                    <TableRow key={tech.name} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              bgcolor: "#AEB784",
                              color: "#41431B",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {tech.name.charAt(0)}
                          </Box>
                          <Typography fontSize={14} fontWeight={500} color="#41431B">
                            {tech.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={14} color="#41431B">{tech.assigned}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={14} color="#41431B">{tech.resolved}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 200 }}>
                          <LinearProgress
                            variant="determinate"
                            value={tech.rate}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: "rgba(174,183,132,0.2)",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: tech.rate >= 70 ? "#556B2F" : tech.rate >= 40 ? "#8a7f3c" : "#c62828",
                                borderRadius: 3,
                              },
                            }}
                          />
                          <Typography fontSize={13} fontWeight={600} color="#41431B" sx={{ minWidth: 35 }}>
                            {tech.rate}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => navigate("/all-tickets")}
                          sx={{
                            textTransform: "none",
                            color: "#41431B",
                            fontWeight: 600,
                            fontSize: 12,
                            "&:hover": { bgcolor: "rgba(174,183,132,0.2)" },
                          }}
                        >
                          View tickets
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Dashbord;