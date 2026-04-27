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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Delete,
  PersonAdd,
  ContentCopy,
  Close,
  People,
  EngineeringOutlined,
  WorkOutline,
} from "@mui/icons-material";
import { C } from "../theme";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const roleColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: "rgba(198,40,40,0.15)", text: "#c62828" },
  tech: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" },
  user: { bg: "rgba(180,83,9,0.15)", text: "#D97706" },
};

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", role: "tech" });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = async () => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "Failed to create user"); setLoading(false); return; }
      setOpenDialog(false);
      setForm({ name: "", email: "", role: "tech" });
      setGeneratedPassword(data.generatedPassword);
      setNewUserEmail(data.user.email);
      setShowPasswordDialog(true);
      fetchUsers();
      setSuccess("User created successfully!");
    } catch (err) {
      setError("Cannot connect to server");
    }
    setLoading(false);
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      setSuccess("User deleted successfully!");
    } catch (err) {
      setError("Failed to delete user");
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: "#1C1410",
      color: C.textPrimary,
      "& fieldset": { borderColor: C.border },
      "&:hover fieldset": { borderColor: "rgba(245,158,11,0.3)" },
      "&.Mui-focused fieldset": { borderColor: C.accent },
    },
    "& .MuiInputLabel-root": { color: C.textSecondary },
    "& .MuiInputLabel-root.Mui-focused": { color: C.accent },
    "& .MuiSelect-icon": { color: C.textSecondary },
  };

  return (
    <Box sx={{ flex: 1, p: 4, bgcolor: C.bg }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography fontSize={26} fontWeight={700} color={C.textPrimary}>Users</Typography>
          <Typography fontSize={14} color={C.textSecondary} mt={0.5}>Manage your team members</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          disableElevation
          onClick={() => setOpenDialog(true)}
          sx={{
            bgcolor: C.accent,
            color: "#1C1410",
            textTransform: "none",
            borderRadius: 2,
            fontWeight: 700,
            px: 3,
            py: 1,
            "&:hover": { bgcolor: C.accentHover, transform: "translateY(-2px)", boxShadow: "0 8px 20px rgba(245,158,11,0.3)" },
          }}
        >
          Add user
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 4 }}>
        {[
          { label: "Total users", value: users.length, icon: <People sx={{ fontSize: 20 }} />, color: C.accent },
          { label: "Technicians", value: users.filter((u) => u.role === "tech").length, icon: <EngineeringOutlined sx={{ fontSize: 20 }} />, color: "#D97706" },
          { label: "Employees", value: users.filter((u) => u.role === "user").length, icon: <WorkOutline sx={{ fontSize: 20 }} />, color: "#B45309" },
        ].map((stat) => (
          <Box
            key={stat.label}
            sx={{
              bgcolor: C.card,
              borderRadius: 3,
              p: 3,
              border: `1px solid ${C.border}`,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 24px rgba(0,0,0,0.3)", borderColor: "rgba(245,158,11,0.3)" },
            }}
          >
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
          <Typography fontSize={16} fontWeight={700} color={C.textPrimary}>All team members</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: C.tableHeader }}>
                {["User", "Email", "Role", "Joined", "Actions"].map((col) => (
                  <TableCell key={col} sx={{ fontWeight: 600, color: C.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, borderColor: C.border }}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user._id}
                  sx={{
                    "&:last-child td": { borderBottom: 0 },
                    "& td": { borderColor: C.border },
                    transition: "all 0.2s ease",
                    "&:hover": { bgcolor: C.hoverBg },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: C.iconBg, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                        {getInitials(user.name)}
                      </Box>
                      <Typography fontSize={14} fontWeight={500} color={C.textPrimary}>{user.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={14} color={C.textSecondary}>{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      sx={{
                        bgcolor: roleColors[user.role]?.bg || C.iconBg,
                        color: roleColors[user.role]?.text || C.accent,
                        fontWeight: 600,
                        fontSize: 11,
                        borderRadius: 1.5,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13} color={C.textMuted}>
                      {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {user.role !== "admin" && (
                      <Tooltip title="Delete user">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          sx={{ color: C.danger, "&:hover": { bgcolor: C.dangerBg, transform: "scale(1.1)" } }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Dialog Add User */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4, bgcolor: C.card, border: `1px solid ${C.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 1, color: C.textPrimary }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Add new team member
            <IconButton size="small" onClick={() => setOpenDialog(false)} sx={{ color: C.textSecondary }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="body2" color={C.textSecondary} mt={0.5}>A password will be generated automatically</Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth size="small" sx={fieldStyle} />
            <TextField label="Email address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth size="small" sx={fieldStyle} />
            <TextField label="Role" select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} fullWidth size="small" sx={fieldStyle}>
              <MenuItem value="tech">Technician</MenuItem>
              <MenuItem value="user">Employee</MenuItem>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: "none", color: C.textSecondary, borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained" disableElevation onClick={handleAddUser}
            disabled={loading || !form.name || !form.email} startIcon={<Add />}
            sx={{ bgcolor: C.accent, color: "#1C1410", textTransform: "none", borderRadius: 2, fontWeight: 700, "&:hover": { bgcolor: C.accentHover } }}
          >
            {loading ? "Creating..." : "Create user"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Password */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4, bgcolor: C.card, border: `1px solid ${C.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 0, color: C.textPrimary }}>
          User created successfully!
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color={C.textSecondary} mb={3}>
            Share these credentials with the new team member. The password cannot be retrieved later.
          </Typography>
          <Box sx={{ bgcolor: "#1C1410", borderRadius: 2, p: 2.5, display: "flex", flexDirection: "column", gap: 2, border: `1px solid ${C.border}` }}>
            <Box>
              <Typography fontSize={12} color={C.textMuted} mb={0.5}>Email</Typography>
              <Typography fontSize={14} fontWeight={600} color={C.textPrimary}>{newUserEmail}</Typography>
            </Box>
            <Box>
              <Typography fontSize={12} color={C.textMuted} mb={0.5}>Generated password</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography fontSize={16} fontWeight={700} fontFamily="monospace"
                  sx={{ bgcolor: "#140E0A", color: C.accent, px: 2, py: 0.5, borderRadius: 1.5, border: `1px solid ${C.border}` }}
                >
                  {generatedPassword}
                </Typography>
                <Tooltip title={copied ? "Copied!" : "Copy password"}>
                  <IconButton size="small" onClick={handleCopyPassword} sx={{ color: C.accent }}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
            Make sure to copy the password now. You won't be able to see it again!
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="contained" disableElevation onClick={() => setShowPasswordDialog(false)}
            sx={{ bgcolor: C.accent, color: "#1C1410", textTransform: "none", borderRadius: 2, fontWeight: 700, "&:hover": { bgcolor: C.accentHover } }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" onClose={() => setSuccess("")} sx={{ borderRadius: 2 }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;