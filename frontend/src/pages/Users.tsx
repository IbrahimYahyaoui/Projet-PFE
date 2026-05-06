// frontend/src/pages/Users.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  PersonAdd as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Engineering as TechIcon,
  Person as UserIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { C, roleColors } from "../theme";

type Role = "admin" | "tech" | "user";

interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

const ROLES: { value: Role | "all"; label: string }[] = [
  { value: "all",   label: "Tous les rôles" },
  { value: "admin", label: "Administrateur" },
  { value: "tech",  label: "Technicien" },
  { value: "user",  label: "Utilisateur" },
];

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  tech:  "Technicien",
  user:  "Utilisateur",
};

// ✅ React.ReactNode au lieu de JSX.Element
const ROLE_ICONS: Record<Role, React.ReactNode> = {
  admin: <AdminIcon sx={{ fontSize: 14 }} />,
  tech:  <TechIcon  sx={{ fontSize: 14 }} />,
  user:  <UserIcon  sx={{ fontSize: 14 }} />,
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });

const inputSx = {
  "& .MuiOutlinedInput-root": {
    fontFamily: "Inter, sans-serif",
    backgroundColor: C.bg,
    borderRadius: "10px",
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.accent },
    "&.Mui-focused fieldset": { borderColor: C.accent, borderWidth: "2px" },
  },
  "& .MuiInputLabel-root": {
    fontFamily: "Inter, sans-serif",
    color: C.textMuted,
    "&.Mui-focused": { color: C.accent },
  },
  "& .MuiInputBase-input": { color: C.textPrimary },
  "& .MuiSelect-icon": { color: C.textMuted },
};

// ✅ apiUrl correct
const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const emptyForm = { name: "", email: "", role: "user" as Role };

export default function Users() {
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser]     = useState<User | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [formError, setFormError]   = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ✅ apiUrl dans fetch
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = [
    { label: "Total",           value: users.length,                                   icon: <PeopleIcon />, color: C.accent  },
    { label: "Administrateurs", value: users.filter((u) => u.role === "admin").length, icon: <AdminIcon />,  color: "#0E9188" },
    { label: "Techniciens",     value: users.filter((u) => u.role === "tech").length,  icon: <TechIcon />,   color: "#2563EB" },
    { label: "Utilisateurs",    value: users.filter((u) => u.role === "user").length,  icon: <UserIcon />,   color: "#16A34A" },
  ];

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role });
    setFormError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditUser(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim())  { setFormError("Le nom est obligatoire.");  return; }
    if (!form.email.trim()) { setFormError("L'email est obligatoire."); return; }

    setFormLoading(true);
    setFormError(null);

    try {
      const token = localStorage.getItem("token");

      if (editUser) {
        // ✅ UPDATE — PUT /api/users/:id
        const res = await fetch(`${apiUrl}/api/users/${editUser._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: form.name, email: form.email, role: form.role }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.message || "Erreur serveur.");
        }
      } else {
        // ✅ CREATE — POST /api/users — backend génère le password auto
        const res = await fetch(`${apiUrl}/api/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: form.name, email: form.email, role: form.role }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.message || "Erreur serveur.");
        }
      }

      closeDialog();
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/users/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteId(null);
      fetchUsers();
    } catch {
      setDeleteId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: C.bgPage, fontFamily: "Inter, sans-serif", p: { xs: 2, md: 4 } }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", backgroundColor: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PeopleIcon sx={{ color: C.accent, fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>
              Gestion des Utilisateurs
            </Typography>
            <Typography variant="body2" sx={{ color: C.textMuted, fontFamily: "Inter, sans-serif" }}>
              {users.length} membre{users.length !== 1 ? "s" : ""} au total
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.accent, color: C.navy, borderRadius: "10px", textTransform: "none", px: 2.5, "&:hover": { backgroundColor: C.accentHover } }}>
          Nouvel utilisateur
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, mb: 4 }}>
        {stats.map((s) => (
          <Paper key={s.label} sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: "10px", backgroundColor: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
              {s.icon}
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.4rem", color: C.textPrimary, lineHeight: 1 }}>
                {s.value}
              </Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: C.textMuted, mt: 0.3 }}>
                {s.label}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Paper sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2, mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <FilterIcon sx={{ color: C.textMuted, fontSize: 20 }} />
        <TextField
          placeholder="Rechercher par nom ou email…" size="small" value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ...inputSx, flex: 1, minWidth: 220 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: C.textMuted, fontSize: 18 }} /></InputAdornment> }}
        />
        <TextField select size="small" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | "all")} sx={{ ...inputSx, minWidth: 180 }}>
          {ROLES.map((r) => (
            <MenuItem key={r.value} value={r.value} sx={{ fontFamily: "Inter, sans-serif", color: C.textPrimary, "&:hover": { backgroundColor: C.accentLight } }}>
              {r.label}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {/* Table */}
      <Paper sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
            <CircularProgress sx={{ color: C.accent }} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <PeopleIcon sx={{ fontSize: 48, color: C.textMuted, mb: 1 }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted, fontSize: "0.95rem" }}>
              Aucun utilisateur trouvé
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: C.bgPage }}>
                  {["Utilisateur", "Email", "Rôle", "Membre depuis", "Actions"].map((h) => (
                    <TableCell key={h} sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.75rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.border}`, py: 1.5 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((u, idx) => {
                  const role = roleColors[u.role] ?? roleColors["user"];
                  return (
                    <TableRow key={u._id} sx={{ backgroundColor: idx % 2 === 0 ? C.card : C.bgPage, "&:hover": { backgroundColor: C.accentLight }, transition: "background 0.15s" }}>
                      <TableCell sx={{ borderBottom: `1px solid ${C.border}`, py: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, backgroundColor: C.accentLight, color: C.accent, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.8rem", border: `1px solid ${C.accent}30` }}>
                            {getInitials(u.name)}
                          </Avatar>
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: C.textPrimary }}>
                            {u.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${C.border}`, fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: C.textSecondary }}>
                        {u.email}
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${C.border}` }}>
                        <Chip
                          icon={<>{ROLE_ICONS[u.role]}</>}
                          label={ROLE_LABELS[u.role]}
                          size="small"
                          sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.75rem", backgroundColor: role.bg, color: role.text, border: `1px solid ${role.border}`, "& .MuiChip-icon": { color: role.text } }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${C.border}`, fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: C.textMuted }}>
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${C.border}` }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Modifier">
                            <IconButton size="small" onClick={() => openEdit(u)} sx={{ color: C.textMuted, "&:hover": { color: C.accent, backgroundColor: C.accentLight } }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton size="small" onClick={() => setDeleteId(u._id)} sx={{ color: C.textMuted, "&:hover": { color: C.danger, backgroundColor: C.dangerBg } }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog Create / Edit */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary, pb: 1 }}>
          {editUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          <IconButton onClick={closeDialog} size="small" sx={{ color: C.textMuted, "&:hover": { color: C.danger } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider sx={{ borderColor: C.border }} />

        <DialogContent sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {formError && (
            <Alert severity="error" sx={{ backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.danger}30`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.danger } }}>
              {formError}
            </Alert>
          )}
          <TextField label="Nom complet" fullWidth value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} sx={inputSx} />
          <TextField label="Email" type="email" fullWidth value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} sx={inputSx} />

          {/* ✅ Password seulement en mode edit, pas création (backend génère auto) */}
          {editUser && (
            <TextField label="Nouveau mot de passe (optionnel)" type="password" fullWidth
              onChange={(e) => setForm((f) => ({ ...f, ...( e.target.value ? { password: e.target.value } : {} ) }))}
              sx={inputSx} />
          )}

          {/* ✅ Info pour création */}
          {!editUser && (
            <Alert severity="info" sx={{ backgroundColor: C.accentLight, color: C.accent, border: `1px solid ${C.accent}30`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.accent } }}>
              Un mot de passe sera généré automatiquement et envoyé par email.
            </Alert>
          )}

          <TextField select label="Rôle" fullWidth value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))} sx={inputSx}>
            {ROLES.filter((r) => r.value !== "all").map((r) => (
              <MenuItem key={r.value} value={r.value} sx={{ fontFamily: "Inter, sans-serif", color: C.textPrimary, "&:hover": { backgroundColor: C.accentLight } }}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>

        <Divider sx={{ borderColor: C.border }} />

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={closeDialog} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none", "&:hover": { backgroundColor: C.bgPage } }}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={16} sx={{ color: C.navy }} /> : undefined}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.accent, color: C.navy, borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { backgroundColor: C.accentHover }, "&.Mui-disabled": { backgroundColor: C.slate, color: C.textMuted } }}>
            {formLoading ? "Enregistrement…" : editUser ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Delete */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, fontSize: "0.9rem" }}>
            Cette action est irréversible. L'utilisateur sera définitivement supprimé.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none", "&:hover": { backgroundColor: C.bgPage } }}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleDelete} disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <DeleteIcon />}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.danger, color: "#fff", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { backgroundColor: C.dangerHover }, "&.Mui-disabled": { backgroundColor: C.slate, color: C.textMuted } }}>
            {deleteLoading ? "Suppression…" : "Supprimer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}