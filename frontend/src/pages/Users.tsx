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
  Avatar,
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
    admin: { bg: "#fce4ec", text: "#c62828" },
    tech: { bg: "#e3f2fd", text: "#1565c0" },
    user: { bg: "#e8f5e9", text: "#2e7d32" },
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "#1565c0",
      "#2e7d32",
      "#c62828",
      "#ef6c00",
      "#6a1b9a",
      "#00838f",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

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
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage your team members
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          disableElevation
          onClick={() => setOpenDialog(true)}
          sx={{
            bgcolor: "#111",
            textTransform: "none",
            borderRadius: 2,
            fontWeight: 600,
            px: 3,
            "&:hover": { bgcolor: "#333" },
          }}
        >
          Add user
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 2,
          mb: 4,
        }}
      >
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: 3,
            p: 3,
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography fontSize={13} color="text.secondary" mb={0.5}>
            Total users
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {users.length}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: 3,
            p: 3,
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography fontSize={13} color="text.secondary" mb={0.5}>
            Technicians
          </Typography>
          <Typography variant="h4" fontWeight={700} color="#1565c0">
            {users.filter((u) => u.role === "tech").length}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: 3,
            p: 3,
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography fontSize={13} color="text.secondary" mb={0.5}>
            Employees
          </Typography>
          <Typography variant="h4" fontWeight={700} color="#2e7d32">
            {users.filter((u) => u.role === "user").length}
          </Typography>
        </Box>
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
            All team members
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                  User
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Email
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Role
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Joined
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "text.secondary" }}
                  align="right"
                >
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
                    "&:hover": { bgcolor: "#fafafa" },
                  }}
                >
                  <TableCell>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: getAvatarColor(user.name),
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {getInitials(user.name)}
                      </Avatar>
                      <Typography fontSize={14} fontWeight={500}>
                        {user.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={14} color="text.secondary">
                      {user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      sx={{
                        bgcolor: roleColors[user.role]?.bg || "#f5f5f5",
                        color: roleColors[user.role]?.text || "#333",
                        fontWeight: 600,
                        fontSize: 12,
                        borderRadius: 1.5,
                        textTransform: "capitalize",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13} color="text.secondary">
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
                          onClick={() =>
                            handleDeleteUser(user._id, user.name)
                          }
                          sx={{
                            color: "#c62828",
                            "&:hover": { bgcolor: "#fce4ec" },
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

      {/* Dialog : Ajouter un utilisateur */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 1 }}>
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
          <Typography variant="body2" color="text.secondary" mt={0.5}>
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
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            <TextField
              label="Email address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            <TextField
              label="Role"
              select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              fullWidth
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
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
              color: "text.secondary",
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
              bgcolor: "#111",
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              "&:hover": { bgcolor: "#333" },
            }}
          >
            {loading ? "Creating..." : "Create user"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Mot de passe généré */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 0 }}>
          User created successfully!
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Share these credentials with the new team member. The password
            cannot be retrieved later.
          </Typography>

          <Box
            sx={{
              bgcolor: "#f5f5f5",
              borderRadius: 2,
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box>
              <Typography fontSize={12} color="text.secondary" mb={0.5}>
                Email
              </Typography>
              <Typography fontSize={14} fontWeight={600}>
                {newUserEmail}
              </Typography>
            </Box>

            <Box>
              <Typography fontSize={12} color="text.secondary" mb={0.5}>
                Generated password
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  fontSize={16}
                  fontWeight={700}
                  fontFamily="monospace"
                  sx={{
                    bgcolor: "#fff",
                    px: 2,
                    py: 0.5,
                    borderRadius: 1.5,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  {generatedPassword}
                </Typography>
                <Tooltip title={copied ? "Copied!" : "Copy password"}>
                  <IconButton size="small" onClick={handleCopyPassword}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>

          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
            Make sure to copy the password now. You won't be able to see it
            again!
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="contained"
            disableElevation
            onClick={() => setShowPasswordDialog(false)}
            sx={{
              bgcolor: "#111",
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              "&:hover": { bgcolor: "#333" },
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de succès */}
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