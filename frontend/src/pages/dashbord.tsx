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
import { Add } from "@mui/icons-material";

const stats = [
  { label: "Total tickets", value: 24, color: "#111" },
  { label: "Open", value: 8, color: "#1976d2" },
  { label: "In progress", value: 12, color: "#ed6c02" },
  { label: "Resolved", value: 4, color: "#2e7d32" },
];

const tickets = [
  { title: "Printer not working", status: "In progress", priority: "High", assignee: "Mazen" },
  { title: "VPN access request", status: "Open", priority: "Medium", assignee: "Aziz" },
  { title: "Email setup for new employee", status: "Resolved", priority: "Low", assignee: "Ibrahim" },
  { title: "Software installation", status: "In progress", priority: "High", assignee: "Mazen" },
];

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

const Dashbord = () => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.name || "User";

  return (
    <Box sx={{ flex: 1, p: 4 }}>
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
            Welcome back, {userName}
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
            <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>

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
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Ticket</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Assigned to</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket, index) => (
                <TableRow key={index} sx={{ "&:last-child td": { borderBottom: 0 } }}>
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
  );
};

export default Dashbord;