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
import { Add, TrendingUp, ConfirmationNumber, AccessTime, CheckCircle } from "@mui/icons-material";

const stats = [
  { label: "Total tickets", value: 24, icon: <ConfirmationNumber sx={{ fontSize: 20 }} />, color: "#41431B" },
  { label: "Open", value: 8, icon: <TrendingUp sx={{ fontSize: 20 }} />, color: "#AEB784" },
  { label: "In progress", value: 12, icon: <AccessTime sx={{ fontSize: 20 }} />, color: "#8a7f3c" },
  { label: "Resolved", value: 4, icon: <CheckCircle sx={{ fontSize: 20 }} />, color: "#556B2F" },
];

const tickets = [
  { title: "Printer not working", status: "In progress", priority: "High", assignee: "Mazen" },
  { title: "VPN access request", status: "Open", priority: "Medium", assignee: "Aziz" },
  { title: "Email setup for new employee", status: "Resolved", priority: "Low", assignee: "Ibrahim" },
  { title: "Software installation", status: "In progress", priority: "High", assignee: "Mazen" },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  Open: { bg: "rgba(174,183,132,0.25)", text: "#41431B" },
  "In progress": { bg: "rgba(138,127,60,0.2)", text: "#5c5420" },
  Resolved: { bg: "rgba(85,107,47,0.2)", text: "#3d4d21" },
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  High: { bg: "rgba(198,40,40,0.12)", text: "#c62828" },
  Medium: { bg: "rgba(138,127,60,0.2)", text: "#5c5420" },
  Low: { bg: "rgba(174,183,132,0.25)", text: "#41431B" },
};

const Dashbord = () => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userName = user?.name || "User";

  return (
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
              border: "1px solid rgba(65,67,27,0.08)",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 24px rgba(65,67,27,0.08)",
                borderColor: "rgba(174,183,132,0.5)",
              },
            }}
          >
            {/* Icône décorative en fond */}
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
          border: "1px solid rgba(65,67,27,0.08)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: "1px solid rgba(65,67,27,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontSize={16} fontWeight={700} color="#41431B">
            Recent tickets
          </Typography>
          <Typography
            fontSize={13}
            fontWeight={600}
            color="#41431B"
            sx={{
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            View all →
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(174,183,132,0.08)" }}>
                <TableCell sx={{ fontWeight: 600, color: "rgba(65,67,27,0.6)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Ticket
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "rgba(65,67,27,0.6)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "rgba(65,67,27,0.6)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Priority
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "rgba(65,67,27,0.6)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Assigned to
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket, index) => (
                <TableRow
                  key={index}
                  sx={{
                    "&:last-child td": { borderBottom: 0 },
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(174,183,132,0.05)",
                    },
                  }}
                >
                  <TableCell>
                    <Typography fontSize={14} color="#41431B" fontWeight={500}>
                      {ticket.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status}
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          bgcolor: "#AEB784",
                          color: "#41431B",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {ticket.assignee.charAt(0)}
                      </Box>
                      <Typography fontSize={14} color="rgba(65,67,27,0.7)">
                        {ticket.assignee}
                      </Typography>
                    </Box>
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