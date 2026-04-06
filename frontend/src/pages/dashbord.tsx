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
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  ConfirmationNumber,
  People,
  Settings,
  ListAlt,
  Add,
  Logout,
} from "@mui/icons-material";

// ── Données fictives pour tester ──
const stats = [
  { label: "Total tickets", value: 24, color: "#111" },
  { label: "Open", value: 8, color: "#1976d2" },
  { label: "In progress", value: 12, color: "#ed6c02" },
  { label: "Resolved", value: 4, color: "#2e7d32" },
];

const tickets = [
  {
    title: "Printer not working",
    status: "In progress",
    priority: "High",
    assignee: "Mazen",
  },
  {
    title: "VPN access request",
    status: "Open",
    priority: "Medium",
    assignee: "Aziz",
  },
  {
    title: "Email setup for new employee",
    status: "Resolved",
    priority: "Low",
    assignee: "Ibrahim",
  },
  {
    title: "Software installation",
    status: "In progress",
    priority: "High",
    assignee: "Mazen",
  },
];

// ── Couleurs des badges ──
const statusColors: Record<string, { bg: string; text: string }> = {
  Open: { bg: "#e3f2fd", text: "#1565c0" },
  "In progress": { bg: "#fff3e0", text: "#e65100" },
  Resolved: { bg: "#e8f5e9", text: "#2e7d32" },
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  High: { bg: "#fce4ec", text: "#c62828" },
  Medium: { bg: "#fff3e0", text: "#e65100" },
  Low: { bg: "#e3f2fd", text: "#1565c0" },
};

// ── Menu latéral ──
const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon fontSize="small" /> },
  { text: "My tickets", icon: <ConfirmationNumber fontSize="small" /> },
  { text: "All tickets", icon: <ListAlt fontSize="small" /> },
  { text: "Users", icon: <People fontSize="small" /> },
  { text: "Settings", icon: <Settings fontSize="small" /> },
];

const Dashbord = () => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {/* ====== SIDEBAR ====== */}
      <Box
        sx={{
          width: 240,
          bgcolor: "#fff",
          borderRight: "1px solid #e0e0e0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <Box sx={{ px: 3, py: 3 }}>
          <Typography variant="h6" fontWeight={700}>
            TicketFlow
          </Typography>
        </Box>

        {/* Menu */}
        <List sx={{ px: 1.5, flex: 1 }}>
          {menuItems.map((item, index) => (
            <ListItemButton
              key={item.text}
              selected={index === 0}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "#e3f2fd",
                  color: "#1565c0",
                  "& .MuiListItemIcon-root": { color: "#1565c0" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontSize: 14 }}
              />
            </ListItemButton>
          ))}
        </List>

        {/* Profil utilisateur */}
        <Box
          sx={{
            px: 2,
            py: 2,
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "#1565c0",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            AZ
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={13} fontWeight={600}>
              Aziz
            </Typography>
            <Typography fontSize={11} color="text.secondary">
              Admin
            </Typography>
          </Box>
          <Logout
            sx={{ fontSize: 18, color: "text.secondary", cursor: "pointer" }}
          />
        </Box>
      </Box>

      {/* ====== CONTENU PRINCIPAL ====== */}
      <Box sx={{ flex: 1, p: 4 }}>
        {/* En-tête */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Welcome back, Aziz
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            disableElevation
            sx={{
              bgcolor: "#111",
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              "&:hover": { bgcolor: "#333" },
            }}
          >
            New ticket
          </Button>
        </Box>

        {/* Cartes de statistiques */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 2,
            mb: 4,
          }}
        >
          {stats.map((stat) => (
            <Box
              key={stat.label}
              sx={{
                bgcolor: "#fff",
                borderRadius: 3,
                p: 3,
                border: "1px solid #e0e0e0",
              }}
            >
              <Typography fontSize={13} color="text.secondary" mb={0.5}>
                {stat.label}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: stat.color }}
              >
                {stat.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Tableau des tickets récents */}
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            overflow: "hidden",
          }}
        >
          <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #e0e0e0" }}>
            <Typography fontSize={15} fontWeight={600}>
              Recent tickets
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                    Ticket
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                    Priority
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                    Assigned to
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((ticket, index) => (
                  <TableRow
                    key={index}
                    sx={{ "&:last-child td": { borderBottom: 0 } }}
                  >
                    <TableCell>
                      <Typography fontSize={14}>{ticket.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.status}
                        size="small"
                        sx={{
                          bgcolor: statusColors[ticket.status]?.bg,
                          color: statusColors[ticket.status]?.text,
                          fontWeight: 600,
                          fontSize: 12,
                          borderRadius: 1.5,
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
                          fontSize: 12,
                          borderRadius: 1.5,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={14} color="text.secondary">
                        {ticket.assignee}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashbord;
