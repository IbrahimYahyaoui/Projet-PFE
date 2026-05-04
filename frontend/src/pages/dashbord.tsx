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
  Legend,
} from "recharts";
import { C, priorityColors, statusColors, chartColors } from "../theme";

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
  hardware: <Computer sx={{ fontSize: 22 }} />,
  software: <Code sx={{ fontSize: 22 }} />,
  network: <Wifi sx={{ fontSize: 22 }} />,
  access: <Lock sx={{ fontSize: 22 }} />,
  other: <HelpOutline sx={{ fontSize: 22 }} />,
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
    {
      label: "Total tickets",
      value: total,
      icon: <ConfirmationNumber sx={{ fontSize: 20 }} />,
      color: C.navy,
      bg: "rgba(11,22,44,0.06)",
      trend: "+12%",
    },
    {
      label: "Open",
      value: openCount,
      icon: <TrendingUp sx={{ fontSize: 20 }} />,
      color: chartColors.blue,
      bg: "rgba(59,130,246,0.08)",
      trend: "+3%",
    },
    {
      label: "In progress",
      value: inProgressCount,
      icon: <AccessTime sx={{ fontSize: 20 }} />,
      color: C.accent,
      bg: C.accentLight,
      trend: "-5%",
    },
    {
      label: "Resolved",
      value: resolvedCount,
      icon: <CheckCircle sx={{ fontSize: 20 }} />,
      color: chartColors.green,
      bg: "rgba(34,197,94,0.08)",
      trend: `${resolutionRate}% rate`,
    },
  ];

  const getTrendData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const open = tickets.filter((t) => {
        const d = new Date(t.createdAt);
        return d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear() &&
          t.status === "open";
      }).length;
      const resolved = tickets.filter((t) => {
        const d = new Date(t.createdAt);
        return d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear() &&
          t.status === "resolved";
      }).length;
      const inProgress = tickets.filter((t) => {
        const d = new Date(t.createdAt);
        return d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear() &&
          t.status === "in_progress";
      }).length;
      data.push({
        month: months[date.getMonth()],
        open,
        resolved,
        inProgress,
      });
    }
    return data;
  };

  const statusData = [
    { name: "Open", value: openCount, color: chartColors.blue },
    { name: "In progress", value: inProgressCount, color: C.accent },
    { name: "Resolved", value: resolvedCount, color: chartColors.green },
    { name: "Closed", value: closedCount, color: "#94A3B8" },
  ].filter((s) => s.value > 0);

  const priorityData = [
    { name: "Low", value: tickets.filter((t) => t.priority === "low").length, color: chartColors.green },
    { name: "Medium", value: tickets.filter((t) => t.priority === "medium").length, color: C.accent },
    { name: "High", value: tickets.filter((t) => t.priority === "high").length, color: chartColors.red },
    { name: "Critical", value: tickets.filter((t) => t.priority === "critical").length, color: "#7C3AED" },
  ];

  const criticalTickets = tickets
    .filter((t) =>
      (t.priority === "critical" || t.priority === "high") &&
      t.status !== "resolved" && t.status !== "closed"
    )
    .slice(0, 5);

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
  const topCategories = getCategoryStats();

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "#FFFFFF",
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      color: C.navy,
      fontSize: 12,
      fontFamily: "Inter, sans-serif",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    },
  };

  const cardStyle = {
    bgcolor: C.card,
    borderRadius: "12px",
    border: `1px solid ${C.border}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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
            Dashboard
          </Typography>
          <Typography
            variant="body2"
            color={C.textMuted}
            mt={0.3}
            fontFamily="Inter, sans-serif"
          >
            Welcome back, {userName} 👋
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
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: 14,
            px: 2.5,
            py: 1,
            fontFamily: "Inter, sans-serif",
            boxShadow: `0 4px 12px rgba(95,194,186,0.3)`,
            "&:hover": {
              bgcolor: C.accentHover,
              transform: "translateY(-1px)",
              boxShadow: `0 8px 20px rgba(95,194,186,0.4)`,
            },
          }}
        >
          New ticket
        </Button>
      </Box>

      {/* ── KPI Cards ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 2,
        mb: 3,
      }}>
        {stats.map((stat) => (
          <Box
            key={stat.label}
            sx={{
              ...cardStyle,
              p: 2.5,
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                borderColor: C.accent,
              },
            }}
          >
            <Box sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}>
              <Typography
                fontSize={12}
                fontWeight={500}
                color={C.textMuted}
                fontFamily="Inter, sans-serif"
                sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
              >
                {stat.label}
              </Typography>
              <Box sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                bgcolor: stat.bg,
                color: stat.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {stat.icon}
              </Box>
            </Box>
            <Typography
              fontSize={28}
              fontWeight={700}
              color={C.navy}
              fontFamily="Inter, sans-serif"
              sx={{ letterSpacing: "-0.5px", lineHeight: 1 }}
            >
              {stat.value}
            </Typography>
            <Typography
              fontSize={11}
              color={stat.color}
              fontFamily="Inter, sans-serif"
              sx={{ mt: 0.8, fontWeight: 500 }}
            >
              {stat.trend}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ── Charts Row 1 ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 2,
        mb: 2,
      }}>
        {/* Trend Chart — 3 lignes vert/bleu/rouge */}
        <Box sx={{ ...cardStyle, p: 3 }}>
          <Typography
            fontSize={14}
            fontWeight={600}
            color={C.navy}
            fontFamily="Inter, sans-serif"
            mb={2.5}
          >
            Tickets trend (6 months)
          </Typography>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={getTrendData()}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis
                dataKey="month"
                stroke={C.textMuted}
                fontSize={11}
                fontFamily="Inter, sans-serif"
              />
              <YAxis
                stroke={C.textMuted}
                fontSize={11}
                fontFamily="Inter, sans-serif"
              />
              <RechartsTooltip {...tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: 12, fontFamily: "Inter, sans-serif" }}
              />
              <Line
                type="monotone"
                dataKey="open"
                name="Open"
                stroke={chartColors.blue}
                strokeWidth={2.5}
                dot={{ fill: chartColors.blue, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke={chartColors.green}
                strokeWidth={2.5}
                dot={{ fill: chartColors.green, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="inProgress"
                name="In Progress"
                stroke={chartColors.red}
                strokeWidth={2.5}
                dot={{ fill: chartColors.red, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Status Donut */}
        <Box sx={{ ...cardStyle, p: 3 }}>
          <Typography
            fontSize={14}
            fontWeight={600}
            color={C.navy}
            fontFamily="Inter, sans-serif"
            mb={2}
          >
            Status distribution
          </Typography>
          {statusData.length === 0 ? (
            <Box sx={{
              height: 240,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Typography fontSize={13} color={C.textMuted} fontFamily="Inter, sans-serif">
                No data yet
              </Typography>
            </Box>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {statusData.map((s) => (
                  <Box key={s.name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{
                      width: 8, height: 8,
                      borderRadius: "50%",
                      bgcolor: s.color,
                    }} />
                    <Typography fontSize={11} color={C.textMuted} fontFamily="Inter, sans-serif">
                      {s.name}: {s.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* ── Charts Row 2 ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 2,
        mb: 2,
      }}>
        {/* Critical tickets */}
        <Box sx={{ ...cardStyle, p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Warning sx={{ color: chartColors.red, fontSize: 18 }} />
            <Typography
              fontSize={14}
              fontWeight={600}
              color={C.navy}
              fontFamily="Inter, sans-serif"
            >
              Critical tickets
            </Typography>
          </Box>
          {criticalTickets.length === 0 ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography fontSize={13} color={C.textMuted} fontFamily="Inter, sans-serif">
                No critical tickets — all clear! ✅
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
                    bgcolor: "rgba(239,68,68,0.04)",
                    borderRadius: "8px",
                    border: "1px solid rgba(239,68,68,0.1)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(239,68,68,0.08)",
                      transform: "translateX(4px)",
                      borderColor: "rgba(239,68,68,0.2)",
                    },
                  }}
                >
                  <Box sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <Typography
                      fontSize={13}
                      fontWeight={500}
                      color={C.navy}
                      fontFamily="Inter, sans-serif"
                      noWrap
                      sx={{ flex: 1, mr: 1 }}
                    >
                      {t.title}
                    </Typography>
                    <Chip
                      label={t.priority}
                      size="small"
                      sx={{
                        bgcolor: priorityColors[t.priority]?.bg,
                        color: priorityColors[t.priority]?.text,
                        border: `1px solid ${priorityColors[t.priority]?.border}`,
                        fontWeight: 600,
                        fontSize: 10,
                        height: 20,
                        textTransform: "uppercase",
                        fontFamily: "Inter, sans-serif",
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Priority Bar Chart */}
        <Box sx={{ ...cardStyle, p: 3 }}>
          <Typography
            fontSize={14}
            fontWeight={600}
            color={C.navy}
            fontFamily="Inter, sans-serif"
            mb={2.5}
          >
            Tickets by priority
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis
                dataKey="name"
                stroke={C.textMuted}
                fontSize={11}
                fontFamily="Inter, sans-serif"
              />
              <YAxis
                stroke={C.textMuted}
                fontSize={11}
                fontFamily="Inter, sans-serif"
              />
              <RechartsTooltip {...tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* ── Top Categories ── */}
      {topCategories.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            fontSize={14}
            fontWeight={600}
            color={C.navy}
            fontFamily="Inter, sans-serif"
            mb={1.5}
          >
            Top categories
          </Typography>
          <Box sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
          }}>
            {topCategories.map((cat, index) => (
              <Box
                key={cat.name}
                sx={{
                  ...cardStyle,
                  p: 2.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    borderColor: C.accent,
                  },
                }}
              >
                <Box sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  bgcolor: C.accentLight,
                  color: C.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {categoryIcons[cat.name] || categoryIcons.other}
                </Box>
                <Box>
                  <Typography
                    fontSize={11}
                    color={C.textMuted}
                    fontFamily="Inter, sans-serif"
                    sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    #{index + 1}
                  </Typography>
                  <Typography
                    fontSize={14}
                    fontWeight={600}
                    color={C.navy}
                    fontFamily="Inter, sans-serif"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {cat.name}
                  </Typography>
                  <Typography
                    fontSize={12}
                    color={C.textMuted}
                    fontFamily="Inter, sans-serif"
                  >
                    {cat.count} tickets
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ── Technician Performance (Admin only) ── */}
      {isAdmin && techStats.length > 0 && (
        <Box sx={{ ...cardStyle, overflow: "hidden" }}>
          <Box sx={{
            px: 3, py: 2,
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <Typography
              fontSize={14}
              fontWeight={600}
              color={C.navy}
              fontFamily="Inter, sans-serif"
            >
              Technician performance
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                  {["Technician", "Assigned", "Resolved", "Resolution rate", "Actions"].map((col) => (
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
                {techStats.map((tech) => (
                  <TableRow
                    key={tech.name}
                    sx={{
                      "&:last-child td": { borderBottom: 0 },
                      "& td": { borderColor: C.border },
                      "&:hover": { bgcolor: "#F8FAFC" },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{
                          width: 32, height: 32,
                          borderRadius: "50%",
                          bgcolor: C.accentLight,
                          color: C.accent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "Inter, sans-serif",
                        }}>
                          {tech.name.charAt(0)}
                        </Box>
                        <Typography
                          fontSize={13}
                          fontWeight={500}
                          color={C.navy}
                          fontFamily="Inter, sans-serif"
                        >
                          {tech.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13} color={C.navy} fontFamily="Inter, sans-serif">
                        {tech.assigned}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13} color={C.navy} fontFamily="Inter, sans-serif">
                        {tech.resolved}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 180 }}>
                        <LinearProgress
                          variant="determinate"
                          value={tech.rate}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: C.border,
                            "& .MuiLinearProgress-bar": {
                              bgcolor: tech.rate >= 70
                                ? chartColors.green
                                : tech.rate >= 40
                                ? C.accent
                                : chartColors.red,
                              borderRadius: 3,
                            },
                          }}
                        />
                        <Typography
                          fontSize={12}
                          fontWeight={600}
                          color={C.navy}
                          fontFamily="Inter, sans-serif"
                          sx={{ minWidth: 35 }}
                        >
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
                          fontFamily: "Inter, sans-serif",
                          borderRadius: "6px",
                          "&:hover": {
                            bgcolor: C.accentLight,
                          },
                        }}
                      >
                        View tickets →
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default Dashbord;