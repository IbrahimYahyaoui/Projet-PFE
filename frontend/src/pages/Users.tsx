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

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "tech",
  });

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create user");
        setLoading(false);
        return;
      }

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

  const roleColors: Record<string, { bg: string; text: string }> = {
    admin: { bg: "rgba(198,40,40,0.12)", text: "#c62828" },
    tech: { bg: "rgba(174,183,132,0.25)", text: "#41431B" },
    user: { bg: "rgba(138,127,60,0.2)", text: "#5c5420" },
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{ flex: 1, p: 4 }}>
      {/* ── En-tête ── */}
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
            Users
          </Typography>
          <Typography variant="body2" color="rgba(65,67,27,0.6)" mt={0.5}>
            Manage your team members
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          disableElevation
          onClick={() => setOpenDialog(true)}
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
          Add user
        </Button>
      </Box>

      {/* ── Cartes de stats ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 2,
          mb: 4,
        }}
      >
        {[
          { label: "Total users", value: users.length, icon: <People sx={{ fontSize: 20 }} />, color: "#41431B" },
          { label: "Technicians", value: users.filter((u) => u.role === "tech").length, icon: <EngineeringOutlined sx={{ fontSize: 20 }} />, color: "#8a7f3c" },
          { label: "Employees", value: users.filter((u) => u.role === "user").length, icon: <WorkOutline sx={{ fontSize: 20 }} />, color: "#556B2F" },
        ].map((stat) => (
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

      {/* ── Tableau des utilisateurs ── */}
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
            All team members
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(174,183,132,0.08)" }}>
                <TableCell sx={{ fontWeight: 600, color: "rgba(65,67,27,0.6)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  User
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "rgba(65,67,27,0.6)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Email
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "rgba(65,67,27,0.6)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Role
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "rgba(65,67,27,0.6)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Joined
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "rgba(65,67,27,0.6)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user._id}
                  sx={{
                    "&:last-child td": { borderBottom: 0 },
                    transition: "all 0.2s ease",
                    "&:hover": { bgcolor: "rgba(174,183,132,0.05)" },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          bgcolor: "#AEB784",
                          color: "#41431B",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(user.name)}
                      </Box>
                      <Typography fontSize={14} fontWeight={500} color="#41431B">
                        {user.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={14} color="rgba(65,67,27,0.7)">
                      {user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      sx={{
                        bgcolor: roleColors[user.role]?.bg || "rgba(174,183,132,0.2)",
                        color: roleColors[user.role]?.text || "#41431B",
                        fontWeight: 600,
                        fontSize: 11,
                        borderRadius: 1.5,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13} color="rgba(65,67,27,0.6)">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {user.role !== "admin" && (
                      <Tooltip title="Delete user">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          sx={{
                            color: "#c62828",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              bgcolor: "rgba(198,40,40,0.1)",
                              transform: "scale(1.1)",
                            },
                          }}
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

      {/* ── Dialog : Ajouter un utilisateur ── */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 1, color: "#41431B" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            Add new team member
            <IconButton size="small" onClick={() => setOpenDialog(false)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="body2" color="rgba(65,67,27,0.6)" mt={0.5}>
            A password will be generated automatically
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&.Mui-focused fieldset": { borderColor: "#AEB784" },
                },
                "& label.Mui-focused": { color: "#41431B" },
              }}
            />

            <TextField
              label="Email address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&.Mui-focused fieldset": { borderColor: "#AEB784" },
                },
                "& label.Mui-focused": { color: "#41431B" },
              }}
            />

            <TextField
              label="Role"
              select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&.Mui-focused fieldset": { borderColor: "#AEB784" },
                },
                "& label.Mui-focused": { color: "#41431B" },
              }}
            >
              <MenuItem value="tech">Technician</MenuItem>
              <MenuItem value="user">Employee</MenuItem>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              textTransform: "none",
              color: "rgba(65,67,27,0.6)",
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleAddUser}
            disabled={loading || !form.name || !form.email}
            startIcon={<Add />}
            sx={{
              bgcolor: "#41431B",
              color: "#E3DBBB",
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              "&:hover": { bgcolor: "#555725" },
            }}
          >
            {loading ? "Creating..." : "Create user"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog : Mot de passe généré ── */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 0, color: "#41431B" }}>
          User created successfully!
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="rgba(65,67,27,0.6)" mb={3}>
            Share these credentials with the new team member. The password
            cannot be retrieved later.
          </Typography>

          <Box
            sx={{
              bgcolor: "rgba(174,183,132,0.15)",
              borderRadius: 2,
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box>
              <Typography fontSize={12} color="rgba(65,67,27,0.6)" mb={0.5}>
                Email
              </Typography>
              <Typography fontSize={14} fontWeight={600} color="#41431B">
                {newUserEmail}
              </Typography>
            </Box>

            <Box>
              <Typography fontSize={12} color="rgba(65,67,27,0.6)" mb={0.5}>
                Generated password
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  fontSize={16}
                  fontWeight={700}
                  fontFamily="monospace"
                  sx={{
                    bgcolor: "#fff",
                    color: "#41431B",
                    px: 2,
                    py: 0.5,
                    borderRadius: 1.5,
                    border: "1px solid rgba(65,67,27,0.15)",
                  }}
                >
                  {generatedPassword}
                </Typography>
                <Tooltip title={copied ? "Copied!" : "Copy password"}>
                  <IconButton size="small" onClick={handleCopyPassword} sx={{ color: "#41431B" }}>
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
          <Button
            variant="contained"
            disableElevation
            onClick={() => setShowPasswordDialog(false)}
            sx={{
              bgcolor: "#41431B",
              color: "#E3DBBB",
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              "&:hover": { bgcolor: "#555725" },
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{ borderRadius: 2 }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;