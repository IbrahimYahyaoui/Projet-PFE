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
  low: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" },
  medium: { bg: "rgba(180,83,9,0.2)", text: "#B45309" },
  high: { bg: "rgba(255,152,0,0.15)", text: "#e65100" },
  critical: { bg: "rgba(198,40,40,0.15)", text: "#c62828" },
};

// ── Couleurs Desert Sand ──
const C = {
  bg: "#1C1410",
  card: "#241A12",
  border: "rgba(245,158,11,0.12)",
  accent: "#F59E0B",
  textPrimary: "#FEF3C7",
  textSecondary: "rgba(254,243,199,0.5)",
  textMuted: "rgba(254,243,199,0.3)",
  tableHeader: "rgba(245,158,11,0.06)",
  hoverBg: "rgba(245,158,11,0.08)",
};

const Dashbord = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.name || "User";
  const userRole = user?.role || "user";
  const isAdmin = userRole === "admin";

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

  const total = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;
  const closedCount = tickets.filter((t) => t.status === "closed").length;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const stats = [
    { label: "Total tickets", value: total, icon: <ConfirmationNumber sx={{ fontSize: 20 }} />, color: "#F59E0B" },
    { label: "Open", value: openCount, icon: <TrendingUp sx={{ fontSize: 20 }} />, color: "#FBBF24" },
    { label: "In progress", value: inProgressCount, icon: <AccessTime sx={{ fontSize: 20 }} />, color: "#D97706" },
    { label: "Resolved", value: resolvedCount, icon: <CheckCircle sx={{ fontSize: 20 }} />, subtitle: `${resolutionRate}% rate`, color: "#B45309" },
  ];

  const getTrendData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = tickets.filter((t) => {
        const ticketDate = new Date(t.createdAt);
        return ticketDate.getMonth() === date.getMonth() && ticketDate.getFullYear() === date.getFullYear();
      }).length;
      data.push({ month: months[date.getMonth()], tickets: count });
    }
    return data;
  };

  const statusData = [
    { name: "Open", value: openCount, color: "#F59E0B" },
    { name: "In progress", value: inProgressCount, color: "#D97706" },
    { name: "Resolved", value: resolvedCount, color: "#B45309" },
    { name: "Closed", value: closedCount, color: "#78350F" },
  ].filter((s) => s.value > 0);

  const priorityData = [
    { name: "Low", value: tickets.filter((t) => t.priority === "low").length, color: "#F59E0B" },
    { name: "Medium", value: tickets.filter((t) => t.priority === "medium").length, color: "#D97706" },
    { name: "High", value: tickets.filter((t) => t.priority === "high").length, color: "#e65100" },
    { name: "Critical", value: tickets.filter((t) => t.priority === "critical").length, color: "#c62828" },
  ];

  const criticalTickets = tickets
    .filter((t) => (t.priority === "critical" || t.priority === "high") && t.status !== "resolved" && t.status !== "closed")
    .slice(0, 5);

  const getCategoryStats = () => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => { counts[t.category] = (counts[t.category] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 3);
  };

  const topCategories = getCategoryStats();

  const getTechStats = () => {
    const techMap: Record<string, { name: string; assigned: number; resolved: number }> = {};
    tickets.forEach((t) => {
      if (t.assignedTo) {
        const id = t.assignedTo._id;
        if (!techMap[id]) techMap[id] = { name: t.assignedTo.name, assigned: 0, resolved: 0 };
        techMap[id].assigned++;
        if (t.status === "resolved" || t.status === "closed") techMap[id].resolved++;
      }
    });
    return Object.values(techMap).map((tech) => ({
      ...tech,
      rate: tech.assigned > 0 ? Math.round((tech.resolved / tech.assigned) * 100) : 0,
    }));
  };

  const techStats = getTechStats();

  const cardStyle = {
    bgcolor: C.card,
    borderRadius: 3,
    border: `1px solid ${C.border}`,
  };

  return (
    <Box sx={{ flex: 1, p: 4, bgcolor: C.bg }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color={C.textPrimary}>
            Dashboard
          </Typography>
          <Typography variant="body2" color={C.textSecondary} mt={0.5}>
            Welcome back, {userName}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          disableElevation
          onClick={() => navigate("/create-ticket")}
          sx={{
            bgcolor: C.accent,
            color: "#1C1410",
            textTransform: "none",
            borderRadius: 2,
            fontWeight: 700,
            px: 3,
            py: 1,
            "&:hover": {
              bgcolor: "#D97706",
              transform: "translateY(-2px)",
              boxShadow: "0 8px 20px rgba(245,158,11,0.3)",
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
              ...cardStyle,
              p: 3,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 24px rgba(0,0,0,0.3)",
                borderColor: "rgba(245,158,11,0.3)",
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
                bgcolor: "rgba(245,158,11,0.05)",
              }}
            />
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "rgba(245,158,11,0.15)",
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
            <Typography fontSize={13} color={C.textSecondary} mb={0.5}>
              {stat.label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>
              {stat.value}
            </Typography>
            {stat.subtitle && (
              <Typography fontSize={11} color={C.textMuted} mt={0.5}>
                {stat.subtitle}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      {/* Charts Row 1 */}
      <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 2, mb: 3 }}>
        {/* Trend */}
        <Box sx={{ ...cardStyle, p: 3 }}>
          <Typography fontSize={15} fontWeight={700} color={C.textPrimary} mb={2}>
            Tickets trend (6 months)
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={getTrendData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.08)" />
              <XAxis dataKey="month" stroke={C.textSecondary} fontSize={12} />
              <YAxis stroke={C.textSecondary} fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#241A12",
                  border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 8,
                  color: "#FEF3C7",
                }}
              />
              <Line
                type="monotone"
                dataKey="tickets"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ fill: "#D97706", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Status donut */}
        <Box sx={{ ...cardStyle, p: 3 }}>
          <Typography fontSize={15} fontWeight={700} color={C.textPrimary} mb={2}>
            Status distribution
          </Typography>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#241A12",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 8,
                    color: "#FEF3C7",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography color={C.textMuted}>No data</Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1 }}>
            {statusData.map((s) => (
              <Box key={s.name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: s.color }} />
                <Typography fontSize={11} color={C.textSecondary}>
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
        <Box sx={{ ...cardStyle, p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Warning sx={{ color: "#c62828", fontSize: 20 }} />
            <Typography fontSize={15} fontWeight={700} color={C.textPrimary}>
              Critical tickets
            </Typography>
          </Box>
          {criticalTickets.length === 0 ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography fontSize={13} color={C.textMuted}>No critical tickets — all clear!</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {criticalTickets.map((t) => (
                <Box
                  key={t._id}
                  onClick={() => navigate(`/tickets/${t._id}`)}
                  sx={{
                    p: 1.5,
                    bgcolor: "rgba(198,40,40,0.08)",
                    borderRadius: 2,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": { bgcolor: "rgba(198,40,40,0.15)", transform: "translateX(4px)" },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography fontSize={13} fontWeight={600} color={C.textPrimary} noWrap sx={{ flex: 1 }}>
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

        {/* Priority chart */}
        <Box sx={{ ...cardStyle, p: 3 }}>
          <Typography fontSize={15} fontWeight={700} color={C.textPrimary} mb={2}>
            Tickets by priority
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.08)" />
              <XAxis dataKey="name" stroke={C.textSecondary} fontSize={12} />
              <YAxis stroke={C.textSecondary} fontSize={12} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#241A12",
                  border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 8,
                  color: "#FEF3C7",
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
        <Typography fontSize={15} fontWeight={700} color={C.textPrimary} mb={2}>
          Top categories
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {topCategories.length === 0 ? (
            <Typography fontSize={13} color={C.textMuted}>No data yet</Typography>
          ) : (
            topCategories.map((cat, index) => (
              <Box
                key={cat.name}
                sx={{
                  ...cardStyle,
                  p: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 24px rgba(0,0,0,0.3)",
                    borderColor: "rgba(245,158,11,0.3)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: 2,
                    bgcolor: "rgba(245,158,11,0.15)",
                    color: C.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {categoryIcons[cat.name] || categoryIcons.other}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography fontSize={12} color={C.textMuted} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    #{index + 1}
                  </Typography>
                  <Typography fontSize={15} fontWeight={700} color={C.textPrimary} sx={{ textTransform: "capitalize" }}>
                    {cat.name}
                  </Typography>
                  <Typography fontSize={12} color={C.textSecondary}>
                    {cat.count} tickets
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Technician performance */}
      {isAdmin && (
        <Box sx={{ ...cardStyle, overflow: "hidden" }}>
          <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${C.border}` }}>
            <Typography fontSize={15} fontWeight={700} color={C.textPrimary}>
              Technician performance
            </Typography>
          </Box>
          {techStats.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography fontSize={13} color={C.textMuted}>No assigned tickets yet</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: C.tableHeader }}>
                    {["Technician", "Assigned", "Resolved", "Resolution rate", "Actions"].map((col) => (
                      <TableCell
                        key={col}
                        sx={{ fontWeight: 600, color: C.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}
                      >
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {techStats.map((tech) => (
                    <TableRow
                      key={tech.name}
                      sx={{
                        "&:last-child td": { borderBottom: 0 },
                        "& td": { borderColor: C.border },
                        "&:hover": { bgcolor: C.hoverBg },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              bgcolor: "rgba(245,158,11,0.2)",
                              color: C.accent,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {tech.name.charAt(0)}
                          </Box>
                          <Typography fontSize={14} fontWeight={500} color={C.textPrimary}>
                            {tech.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={14} color={C.textPrimary}>{tech.assigned}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={14} color={C.textPrimary}>{tech.resolved}</Typography>
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
                              bgcolor: "rgba(245,158,11,0.1)",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: tech.rate >= 70 ? "#F59E0B" : tech.rate >= 40 ? "#D97706" : "#c62828",
                                borderRadius: 3,
                              },
                            }}
                          />
                          <Typography fontSize={13} fontWeight={600} color={C.accent} sx={{ minWidth: 35 }}>
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
                            color: C.accent,
                            fontWeight: 600,
                            fontSize: 12,
                            "&:hover": { bgcolor: "rgba(245,158,11,0.1)" },
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