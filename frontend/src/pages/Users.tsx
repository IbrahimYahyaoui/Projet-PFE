// frontend/src/pages/Users.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, TablePagination, Chip, Avatar,
  IconButton, Button, TextField, MenuItem, InputAdornment, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Alert, Divider, Switch, FormControlLabel, Checkbox,
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
  VpnKey as KeyIcon,
  PowerSettingsNew as ToggleIcon,
  SupervisorAccount as LeaderIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { C, roleColors } from "../theme";

type Role = "admin" | "leader" | "tech" | "user";
type Order = "asc" | "desc";
type OrderBy = "name" | "email" | "role" | "isActive" | "lastLoginAt" | "createdAt";

interface TeamRef { _id: string; name: string; tag: string; color: string; }

interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  department?: string;
  expertise?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  teamId?: TeamRef | null;
}

// Mêmes catégories que team.js (backend/schemas/team.js)
const EXPERTISE_OPTIONS = [
  { value: "hardware", label: "Matériel" },
  { value: "software", label: "Logiciel" },
  { value: "network",  label: "Réseau" },
  { value: "security", label: "Sécurité" },
  { value: "support",  label: "Support" },
  { value: "other",    label: "Autre" },
];

const ROLES: { value: Role | "all"; label: string }[] = [
  { value: "all",    label: "Tous les rôles" },
  { value: "admin",  label: "Administrateur" },
  { value: "leader", label: "Team Leader" },
  { value: "tech",   label: "Technicien" },
  { value: "user",   label: "Employé" },
];

const ROLE_LABELS: Record<Role, string> = {
  admin:  "Administrateur",
  leader: "Team Leader",
  tech:   "Technicien",
  user:   "Employé",
};

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  admin:  <AdminIcon  sx={{ fontSize: 14 }} />,
  leader: <LeaderIcon sx={{ fontSize: 14 }} />,
  tech:   <TechIcon   sx={{ fontSize: 14 }} />,
  user:   <UserIcon   sx={{ fontSize: 14 }} />,
};

const getInitials = (name?: string | null) =>
  (name ?? "?").split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const formatRelative = (iso?: string | null): string => {
  if (!iso) return "Jamais";
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 2)   return "À l'instant";
  if (mins  < 60)  return `Il y a ${mins}min`;
  if (hours < 24)  return `Il y a ${hours}h`;
  if (days  < 30)  return `Il y a ${days}j`;
  return formatDate(iso);
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    fontFamily: "Inter, sans-serif", backgroundColor: C.bg, borderRadius: "10px",
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.accent },
    "&.Mui-focused fieldset": { borderColor: C.accent, borderWidth: "2px" },
  },
  "& .MuiInputLabel-root": { fontFamily: "Inter, sans-serif", color: C.textMuted, "&.Mui-focused": { color: C.accent } },
  "& .MuiInputBase-input": { color: C.textPrimary },
  "& .MuiSelect-icon": { color: C.textMuted },
};

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const emptyForm = {
  name: "", email: "", role: "user" as Role,
  password: "", phone: "", department: "", expertise: "",
  passwordMode: "auto" as "auto" | "manual",
  isActive: true,
};

function sortUsers(users: User[], orderBy: OrderBy, order: Order): User[] {
  return [...users].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    if (orderBy === "name")        { av = a.name.toLowerCase();         bv = b.name.toLowerCase(); }
    else if (orderBy === "email")  { av = a.email.toLowerCase();        bv = b.email.toLowerCase(); }
    else if (orderBy === "role")   { av = a.role;                       bv = b.role; }
    else if (orderBy === "isActive") { av = a.isActive ? 1 : 0;        bv = b.isActive ? 1 : 0; }
    else if (orderBy === "lastLoginAt") {
      av = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
      bv = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
    } else {
      av = new Date(a.createdAt).getTime();
      bv = new Date(b.createdAt).getTime();
    }
    if (av < bv) return order === "asc" ? -1 : 1;
    if (av > bv) return order === "asc" ?  1 : -1;
    return 0;
  });
}

export default function Users() {
  const [users,        setUsers]        = useState<User[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState<Role | "all">("all");
  const [order,        setOrder]        = useState<Order>("asc");
  const [orderBy,      setOrderBy]      = useState<OrderBy>("name");
  const [page,         setPage]         = useState(0);
  const [rowsPerPage,  setRowsPerPage]  = useState(10);

  // Dialog states
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editUser,      setEditUser]      = useState<User | null>(null);
  const [form,          setForm]          = useState({ ...emptyForm });
  const [showPwd,       setShowPwd]       = useState(false);
  const [formError,     setFormError]     = useState<string | null>(null);
  const [formLoading,   setFormLoading]   = useState(false);
  const [createdPwd,    setCreatedPwd]    = useState<string | null>(null);
  const [copiedPwd,     setCopiedPwd]     = useState(false);

  // Delete dialog
  const [deleteUser,    setDeleteUser]    = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  // Reset password dialog
  const [resetUser,     setResetUser]     = useState<User | null>(null);
  const [resetLoading,  setResetLoading]  = useState(false);
  const [resetPwd,      setResetPwd]      = useState<string | null>(null);
  const [copiedReset,   setCopiedReset]   = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"role" | "activate" | "deactivate" | "delete" | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkRole, setBulkRole] = useState<Role>("user");

  const token = () => localStorage.getItem("token") ?? "";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${apiUrl}/api/users`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users ?? []);
    } catch { setUsers([]); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => { setPage(0); setSelected([]); }, [search, roleFilter]);

  const filtered = sortUsers(
    users.filter((u) => {
      const q = search.toLowerCase();
      return (
        (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
        (roleFilter === "all" || u.role === roleFilter)
      );
    }),
    orderBy, order
  );

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (col: OrderBy) => {
    if (orderBy === col) setOrder(o => o === "asc" ? "desc" : "asc");
    else { setOrderBy(col); setOrder("asc"); }
  };

  const stats = [
    { label: "Total",           value: users.length,                                     icon: <PeopleIcon />,  color: C.accent   },
    { label: "Administrateurs", value: users.filter(u => u.role === "admin").length,     icon: <AdminIcon />,   color: "#0E9188"  },
    { label: "Team Leaders",    value: users.filter(u => u.role === "leader").length,    icon: <LeaderIcon />,  color: "#2563EB"  },
    { label: "Techniciens",     value: users.filter(u => u.role === "tech").length,      icon: <TechIcon />,    color: "#EA580C"  },
    { label: "Employés",        value: users.filter(u => u.role === "user").length,      icon: <UserIcon />,    color: "#7C3AED"  },
  ];

  // ── Dialog helpers ──────────────────────────────────────────────────
  const openCreate = () => {
    setEditUser(null); setForm({ ...emptyForm }); setFormError(null); setShowPwd(false);
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, password: "", phone: u.phone ?? "", department: u.department ?? "", expertise: u.expertise ?? "", passwordMode: "manual", isActive: u.isActive });
    setFormError(null); setShowPwd(false);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false); setEditUser(null); setForm({ ...emptyForm });
    setFormError(null); setShowPwd(false);
  };

  const closeCreatedPwd = () => { setCreatedPwd(null); setCopiedPwd(false); };

  // ── Submit create/edit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim())  { setFormError("Le nom est obligatoire.");  return; }
    if (!form.email.trim()) { setFormError("L'email est obligatoire."); return; }
    setFormLoading(true); setFormError(null);
    try {
      if (editUser) {
        const body: Record<string, any> = { name: form.name, email: form.email, role: form.role, phone: form.phone, department: form.department, isActive: form.isActive, expertise: form.role === "tech" ? (form.expertise || null) : null };
        if (form.password.trim()) body.password = form.password;
        const res = await fetch(`${apiUrl}/api/users/${editUser._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).message || "Erreur serveur.");
        closeDialog(); fetchUsers();
      } else {
        const body: Record<string, any> = { name: form.name, email: form.email, role: form.role, phone: form.phone, department: form.department, expertise: form.role === "tech" ? (form.expertise || null) : null };
        if (form.passwordMode === "manual" && form.password.trim()) body.password = form.password;
        const res = await fetch(`${apiUrl}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erreur serveur.");
        closeDialog(); fetchUsers();
        if (data.generatedPassword) setCreatedPwd(data.generatedPassword);
      }
    } catch (err: any) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  // ── Delete ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true); setDeleteError(null); setDeleteWarning(null);
    try {
      const res  = await fetch(`${apiUrl}/api/users/${deleteUser._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.message || "Erreur serveur."); return; }
      if (data.warnings) { setDeleteWarning(data.warnings); fetchUsers(); }
      else               { setDeleteUser(null); fetchUsers(); }
    } catch { setDeleteError("Erreur réseau."); }
    finally { setDeleteLoading(false); }
  };

  // ── Toggle active ────────────────────────────────────────────────────
  const handleToggle = async (u: User) => {
    try {
      const res = await fetch(`${apiUrl}/api/users/${u._id}/toggle-active`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Erreur"); return; }
      setUsers(prev => prev.map(p => p._id === u._id ? { ...p, isActive: data.isActive } : p));
    } catch { alert("Erreur réseau"); }
  };

  // ── Reset password ───────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!resetUser) return;
    setResetLoading(true);
    try {
      const res  = await fetch(`${apiUrl}/api/users/${resetUser._id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Erreur"); return; }
      setResetPwd(data.generatedPassword);
    } catch { alert("Erreur réseau"); }
    finally { setResetLoading(false); }
  };

  const closeResetDialog = () => { setResetUser(null); setResetPwd(null); setCopiedReset(false); };

  // ── Bulk actions ─────────────────────────────────────────────────────
  const allOnPageSelected = paginated.length > 0 && paginated.every(u => selected.includes(u._id));
  const someSelected      = selected.length > 0;

  const toggleSelectAll = () => {
    if (allOnPageSelected) setSelected(s => s.filter(id => !paginated.find(u => u._id === id)));
    else setSelected(s => [...new Set([...s, ...paginated.map(u => u._id)])]);
  };

  const toggleSelect = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const handleBulkConfirm = async () => {
    if (!bulkAction) return;
    setBulkLoading(true);
    try {
      if (bulkAction === "delete") {
        await Promise.all(selected.map(id =>
          fetch(`${apiUrl}/api/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } })
        ));
      } else if (bulkAction === "activate" || bulkAction === "deactivate") {
        await Promise.all(selected.map(id =>
          fetch(`${apiUrl}/api/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
            body: JSON.stringify({ isActive: bulkAction === "activate" }),
          })
        ));
      } else if (bulkAction === "role") {
        await Promise.all(selected.map(id =>
          fetch(`${apiUrl}/api/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
            body: JSON.stringify({ role: bulkRole }),
          })
        ));
      }
      setSelected([]); setBulkAction(null); fetchUsers();
    } catch { alert("Erreur lors de l'action groupée"); }
    finally { setBulkLoading(false); }
  };

  // ── CSV Export ───────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ["Nom", "Email", "Rôle", "Équipe", "Statut", "Dernière connexion", "Membre depuis"];
    const rows = filtered.map(u => [
      u.name, u.email, ROLE_LABELS[u.role],
      u.teamId?.name ?? "—",
      u.isActive ? "Actif" : "Inactif",
      formatRelative(u.lastLoginAt),
      formatDate(u.createdAt),
    ]);
    const csv  = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `utilisateurs_tuskflow_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Sortable header cell ─────────────────────────────────────────────
  const SortCell = ({ col, label }: { col: OrderBy; label: string }) => (
    <TableCell sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.72rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.border}`, py: 1.5, whiteSpace: "nowrap" }}>
      <TableSortLabel active={orderBy === col} direction={orderBy === col ? order : "asc"} onClick={() => handleSort(col)}
        sx={{ "& .MuiTableSortLabel-icon": { color: `${C.accent} !important` }, "&.Mui-active": { color: C.accent }, color: C.textMuted }}>
        {label}
      </TableSortLabel>
    </TableCell>
  );

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
          sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.accent, color: "#FFFFFF", borderRadius: "10px", textTransform: "none", px: 2.5, "&:hover": { backgroundColor: C.accentHover } }}>
          Nouvel utilisateur
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" }, gap: 2, mb: 4 }}>
        {stats.map((s) => (
          <Paper key={s.label} sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: "10px", backgroundColor: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
              {s.icon}
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.4rem", color: C.textPrimary, lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: C.textMuted, mt: 0.3 }}>{s.label}</Typography>
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
        <TextField select size="small" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | "all")} sx={{ ...inputSx, minWidth: 170 }}>
          {ROLES.map((r) => (
            <MenuItem key={r.value} value={r.value} sx={{ fontFamily: "Inter, sans-serif", color: C.textPrimary, "&:hover": { backgroundColor: C.accentLight } }}>
              {r.label}
            </MenuItem>
          ))}
        </TextField>
        <Tooltip title="Exporter en CSV">
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, borderColor: C.border, color: C.textSecondary, borderRadius: "10px", textTransform: "none", "&:hover": { borderColor: C.accent, color: C.accent, backgroundColor: C.accentLight } }}>
            Exporter CSV
          </Button>
        </Tooltip>
      </Paper>

      {/* Bulk action bar */}
      {someSelected && (
        <Paper sx={{ backgroundColor: C.navyMid, border: `1px solid ${C.accent}40`, borderRadius: "12px", p: "10px 16px", mb: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: "#fff" }}>
            {selected.length} sélectionné(s)
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {[
              { label: "Activer",    action: "activate"   as const, color: C.success },
              { label: "Désactiver", action: "deactivate" as const, color: C.warning },
              { label: "Supprimer", action: "delete"     as const, color: C.danger  },
            ].map(a => (
              <Button key={a.action} size="small" onClick={() => setBulkAction(a.action)}
                sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "12px", color: a.color, borderColor: `${a.color}50`, border: "1px solid", borderRadius: "8px", textTransform: "none", px: 1.5, "&:hover": { backgroundColor: `${a.color}15` } }}>
                {a.label}
              </Button>
            ))}
            <Button size="small" onClick={() => setBulkAction("role")}
              sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "12px", color: "#fff", borderColor: "rgba(255,255,255,0.3)", border: "1px solid", borderRadius: "8px", textTransform: "none", px: 1.5, "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}>
              Changer rôle
            </Button>
          </Box>
          <Button size="small" onClick={() => setSelected([])} sx={{ ml: "auto", color: "rgba(255,255,255,0.6)", fontFamily: "Inter, sans-serif", textTransform: "none" }}>
            Désélectionner
          </Button>
        </Paper>
      )}

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
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: C.bgPage }}>
                    <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${C.border}`, pl: 2 }}>
                      <Checkbox checked={allOnPageSelected} indeterminate={someSelected && !allOnPageSelected} onChange={toggleSelectAll}
                        sx={{ color: C.textMuted, "&.Mui-checked": { color: C.accent }, "&.MuiCheckbox-indeterminate": { color: C.accent } }} />
                    </TableCell>
                    <SortCell col="name"        label="Utilisateur" />
                    <SortCell col="email"       label="Email" />
                    <SortCell col="role"        label="Rôle" />
                    <TableCell sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.72rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.border}`, py: 1.5 }}>Équipe</TableCell>
                    <SortCell col="isActive"    label="Statut" />
                    <SortCell col="lastLoginAt" label="Dernière connexion" />
                    <SortCell col="createdAt"   label="Membre depuis" />
                    <TableCell sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.72rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.border}`, py: 1.5 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((u, idx) => {
                    const rc      = roleColors[u.role] ?? roleColors["user"];
                    const isSelected = selected.includes(u._id);
                    return (
                      <TableRow key={u._id}
                        sx={{ backgroundColor: isSelected ? `${C.accent}08` : idx % 2 === 0 ? C.card : C.bgPage, "&:hover": { backgroundColor: C.accentLight }, transition: "background 0.15s" }}>
                        <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${C.border}`, pl: 2 }}>
                          <Checkbox checked={isSelected} onChange={() => toggleSelect(u._id)}
                            sx={{ color: C.textMuted, "&.Mui-checked": { color: C.accent } }} />
                        </TableCell>

                        {/* Utilisateur */}
                        <TableCell sx={{ borderBottom: `1px solid ${C.border}`, py: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ width: 36, height: 36, backgroundColor: C.accentLight, color: C.accent, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.8rem", border: `1px solid ${C.accent}30` }}>
                              {getInitials(u.name)}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: C.textPrimary, lineHeight: 1.2 }}>{u.name}</Typography>
                              {u.department && (
                                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: C.textMuted }}>{u.department}</Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Email */}
                        <TableCell sx={{ borderBottom: `1px solid ${C.border}`, fontFamily: "Inter, sans-serif", fontSize: "0.83rem", color: C.textSecondary }}>
                          {u.email}
                        </TableCell>

                        {/* Rôle */}
                        <TableCell sx={{ borderBottom: `1px solid ${C.border}` }}>
                          <Chip
                            icon={<>{ROLE_ICONS[u.role]}</>}
                            label={ROLE_LABELS[u.role]}
                            size="small"
                            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.72rem", backgroundColor: rc.bg, color: rc.text, border: `1px solid ${rc.border}`, "& .MuiChip-icon": { color: rc.text } }}
                          />
                        </TableCell>

                        {/* Équipe */}
                        <TableCell sx={{ borderBottom: `1px solid ${C.border}` }}>
                          {u.teamId ? (
                            <Chip label={u.teamId.tag} size="small"
                              sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.72rem", backgroundColor: `${u.teamId.color}18`, color: u.teamId.color, border: `1px solid ${u.teamId.color}40` }} />
                          ) : (
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.83rem", color: C.textMuted }}>—</Typography>
                          )}
                        </TableCell>

                        {/* Statut */}
                        <TableCell sx={{ borderBottom: `1px solid ${C.border}` }}>
                          <Chip
                            label={u.isActive ? "Actif" : "Inactif"}
                            size="small"
                            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.72rem",
                              backgroundColor: u.isActive ? "rgba(34,197,94,0.10)" : "rgba(148,163,184,0.12)",
                              color: u.isActive ? "#16A34A" : C.textMuted,
                              border: `1px solid ${u.isActive ? "rgba(34,197,94,0.25)" : C.border}` }}
                          />
                        </TableCell>

                        {/* Dernière connexion */}
                        <TableCell sx={{ borderBottom: `1px solid ${C.border}`, fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: C.textMuted, whiteSpace: "nowrap" }}>
                          {formatRelative(u.lastLoginAt)}
                        </TableCell>

                        {/* Membre depuis */}
                        <TableCell sx={{ borderBottom: `1px solid ${C.border}`, fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: C.textMuted, whiteSpace: "nowrap" }}>
                          {formatDate(u.createdAt)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell sx={{ borderBottom: `1px solid ${C.border}` }}>
                          <Box sx={{ display: "flex", gap: 0.25 }}>
                            <Tooltip title="Modifier">
                              <IconButton size="small" onClick={() => openEdit(u)} sx={{ color: C.textMuted, "&:hover": { color: C.accent, backgroundColor: C.accentLight } }}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Réinitialiser mot de passe">
                              <IconButton size="small" onClick={() => setResetUser(u)} sx={{ color: C.textMuted, "&:hover": { color: "#8B5CF6", backgroundColor: "rgba(139,92,246,0.10)" } }}>
                                <KeyIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={u.isActive ? "Désactiver" : "Activer"}>
                              <IconButton size="small" onClick={() => handleToggle(u)} sx={{ color: C.textMuted, "&:hover": { color: u.isActive ? C.warning : C.success, backgroundColor: u.isActive ? C.warningBg : C.successBg } }}>
                                <ToggleIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton size="small" onClick={() => { setDeleteUser(u); setDeleteError(null); setDeleteWarning(null); }} sx={{ color: C.textMuted, "&:hover": { color: C.danger, backgroundColor: C.dangerBg } }}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
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

            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="Par page :"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count} utilisateurs`}
              sx={{ borderTop: `1px solid ${C.border}`, fontFamily: "Inter, sans-serif", "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: C.textSecondary }, "& .MuiSelect-select": { fontFamily: "Inter, sans-serif" } }}
            />
          </>
        )}
      </Paper>

      {/* ═══ Dialog Create / Edit ═══════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary, pb: 1 }}>
          {editUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          <IconButton onClick={closeDialog} size="small" sx={{ color: C.textMuted, "&:hover": { color: C.danger } }}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: C.border }} />

        <DialogContent sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {formError && (
            <Alert severity="error" sx={{ backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.danger}30`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.danger } }}>
              {formError}
            </Alert>
          )}

          <TextField label="Nom complet *" fullWidth value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} sx={inputSx} />
          <TextField label="Email *" type="email" fullWidth value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} sx={inputSx} />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="Téléphone" fullWidth value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} sx={inputSx} />
            <TextField label="Département" fullWidth value={form.department} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))} sx={inputSx} />
          </Box>

          <TextField select label="Rôle *" fullWidth value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as Role }))} sx={inputSx}>
            {ROLES.filter(r => r.value !== "all").map((r) => (
              <MenuItem key={r.value} value={r.value} sx={{ fontFamily: "Inter, sans-serif", color: C.textPrimary, "&:hover": { backgroundColor: C.accentLight } }}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>

          {form.role === "tech" && (
            <TextField select label="Domaine d'expertise" fullWidth value={form.expertise} onChange={(e) => setForm(f => ({ ...f, expertise: e.target.value }))} sx={inputSx}>
              <MenuItem value="" sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Aucun</MenuItem>
              {EXPERTISE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: "Inter, sans-serif", color: C.textPrimary, "&:hover": { backgroundColor: C.accentLight } }}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* Password section */}
          {!editUser ? (
            <>
              <Box sx={{ display: "flex", gap: 1 }}>
                {(["auto", "manual"] as const).map(mode => (
                  <Box key={mode} onClick={() => setForm(f => ({ ...f, passwordMode: mode }))}
                    sx={{ flex: 1, border: `2px solid ${form.passwordMode === mode ? C.accent : C.border}`, borderRadius: "10px", p: 1.5, cursor: "pointer", backgroundColor: form.passwordMode === mode ? C.accentLight : C.bg, transition: "all 0.15s", textAlign: "center" }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: form.passwordMode === mode ? C.accent : C.textSecondary }}>
                      {mode === "auto" ? "🔐 Auto-généré" : "✏️ Manuel"}
                    </Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mt: 0.3 }}>
                      {mode === "auto" ? "Envoyé par email" : "Définir maintenant"}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {form.passwordMode === "manual" ? (
                <TextField label="Mot de passe" type={showPwd ? "text" : "password"} fullWidth value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} sx={inputSx}
                  InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPwd(v => !v)}>{showPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment> }}
                />
              ) : (
                <Alert severity="info" sx={{ backgroundColor: C.accentLight, color: C.accent, border: `1px solid ${C.accent}30`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.accent } }}>
                  Un mot de passe sécurisé sera généré et envoyé par email.
                </Alert>
              )}
            </>
          ) : (
            <>
              <TextField label="Nouveau mot de passe (laisser vide pour ne pas changer)" type={showPwd ? "text" : "password"} fullWidth value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} sx={inputSx}
                InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPwd(v => !v)}>{showPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment> }}
              />
              <FormControlLabel
                control={<Switch checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: C.success }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: C.success } }} />}
                label={<Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textSecondary }}>Compte {form.isActive ? "actif" : "inactif"}</Typography>}
              />
            </>
          )}
        </DialogContent>

        <Divider sx={{ borderColor: C.border }} />
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={closeDialog} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none", "&:hover": { backgroundColor: C.bgPage } }}>Annuler</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={16} sx={{ color: C.navy }} /> : undefined}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.accent, color: "#FFFFFF", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { backgroundColor: C.accentHover }, "&.Mui-disabled": { backgroundColor: C.slate, color: C.textMuted } }}>
            {formLoading ? "Enregistrement…" : editUser ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Dialog Generated Password ══════════════════════════════════════ */}
      <Dialog open={!!createdPwd} onClose={closeCreatedPwd} maxWidth="xs" fullWidth
        PaperProps={{ sx: { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary, display: "flex", alignItems: "center", gap: 1 }}>
          <CheckIcon sx={{ color: C.success }} /> Utilisateur créé
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-message": { fontFamily: "Inter, sans-serif" } }}>
            Ce mot de passe ne sera plus affiché après fermeture.
          </Alert>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textSecondary, mb: 1 }}>Mot de passe généré :</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, backgroundColor: C.bgPage, borderRadius: "10px", p: 1.5, border: `1px solid ${C.border}` }}>
            <Typography sx={{ fontFamily: "monospace", fontSize: "15px", fontWeight: 700, color: C.textPrimary, flex: 1, letterSpacing: "0.08em" }}>{createdPwd}</Typography>
            <Tooltip title={copiedPwd ? "Copié !" : "Copier"}>
              <IconButton size="small" onClick={() => { navigator.clipboard.writeText(createdPwd ?? ""); setCopiedPwd(true); }} sx={{ color: copiedPwd ? C.success : C.textMuted }}>
                {copiedPwd ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={closeCreatedPwd}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.accent, color: "#FFFFFF", borderRadius: "10px", textTransform: "none", "&:hover": { backgroundColor: C.accentHover } }}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Dialog Delete ═══════════════════════════════════════════════════ */}
      <Dialog open={!!deleteUser} onClose={() => { if (!deleteWarning) setDeleteUser(null); }} maxWidth="xs" fullWidth
        PaperProps={{ sx: { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
          {deleteWarning ? "Utilisateur supprimé" : "Confirmer la suppression"}
        </DialogTitle>
        <DialogContent>
          {deleteWarning ? (
            <Alert severity="warning" sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-message": { fontFamily: "Inter, sans-serif" } }}>
              {deleteWarning}
            </Alert>
          ) : deleteError ? (
            <Alert severity="error" sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-message": { fontFamily: "Inter, sans-serif" } }}>
              {deleteError}
            </Alert>
          ) : (
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, fontSize: "0.9rem", mb: 1.5 }}>
                Supprimer définitivement cet utilisateur ?
              </Typography>
              {deleteUser && (
                <Box sx={{ backgroundColor: C.bgPage, borderRadius: "10px", p: 1.5, border: `1px solid ${C.border}` }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: C.textPrimary, fontSize: "14px" }}>{deleteUser.name}</Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted, fontSize: "12px" }}>{deleteUser.email}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          {deleteWarning ? (
            <Button variant="contained" onClick={() => { setDeleteUser(null); setDeleteWarning(null); }}
              sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.accent, color: "#FFFFFF", borderRadius: "10px", textTransform: "none" }}>
              Fermer
            </Button>
          ) : (
            <>
              <Button onClick={() => setDeleteUser(null)} disabled={deleteLoading} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none" }}>Annuler</Button>
              {!deleteError && (
                <Button variant="contained" onClick={handleDelete} disabled={deleteLoading}
                  startIcon={deleteLoading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <DeleteIcon />}
                  sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.danger, color: "#fff", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { backgroundColor: C.dangerHover }, "&.Mui-disabled": { backgroundColor: C.slate, color: C.textMuted } }}>
                  {deleteLoading ? "Suppression…" : "Supprimer"}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ═══ Dialog Reset Password ══════════════════════════════════════════ */}
      <Dialog open={!!resetUser} onClose={closeResetDialog} maxWidth="xs" fullWidth
        PaperProps={{ sx: { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary, display: "flex", alignItems: "center", gap: 1 }}>
          <KeyIcon sx={{ color: "#8B5CF6" }} /> Réinitialiser le mot de passe
        </DialogTitle>
        <DialogContent>
          {resetPwd ? (
            <>
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-message": { fontFamily: "Inter, sans-serif" } }}>
                Nouveau mot de passe pour {resetUser?.name}. Ce mot de passe ne sera plus affiché.
              </Alert>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, backgroundColor: C.bgPage, borderRadius: "10px", p: 1.5, border: `1px solid ${C.border}` }}>
                <Typography sx={{ fontFamily: "monospace", fontSize: "15px", fontWeight: 700, color: C.textPrimary, flex: 1, letterSpacing: "0.08em" }}>{resetPwd}</Typography>
                <Tooltip title={copiedReset ? "Copié !" : "Copier"}>
                  <IconButton size="small" onClick={() => { navigator.clipboard.writeText(resetPwd); setCopiedReset(true); }} sx={{ color: copiedReset ? C.success : C.textMuted }}>
                    {copiedReset ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          ) : (
            <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, fontSize: "0.9rem" }}>
              Un nouveau mot de passe sera généré automatiquement et envoyé par email à <strong>{resetUser?.email}</strong>.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={closeResetDialog} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none" }}>
            {resetPwd ? "Fermer" : "Annuler"}
          </Button>
          {!resetPwd && (
            <Button variant="contained" onClick={handleResetPassword} disabled={resetLoading}
              startIcon={resetLoading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <KeyIcon />}
              sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: "#8B5CF6", color: "#fff", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { backgroundColor: "#7C3AED" }, "&.Mui-disabled": { backgroundColor: C.slate, color: C.textMuted } }}>
              {resetLoading ? "Réinitialisation…" : "Réinitialiser"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ═══ Dialog Bulk Action ═════════════════════════════════════════════ */}
      <Dialog open={!!bulkAction} onClose={() => setBulkAction(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
          Action groupée — {selected.length} utilisateur(s)
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {bulkAction === "role" && (
            <TextField select label="Nouveau rôle" fullWidth value={bulkRole} onChange={(e) => setBulkRole(e.target.value as Role)} sx={inputSx}>
              {ROLES.filter(r => r.value !== "all").map(r => (
                <MenuItem key={r.value} value={r.value} sx={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{r.label}</MenuItem>
              ))}
            </TextField>
          )}
          {bulkAction === "delete" && (
            <Alert severity="error" sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-message": { fontFamily: "Inter, sans-serif" } }}>
              Cette action est irréversible. {selected.length} utilisateur(s) seront supprimés.
            </Alert>
          )}
          {(bulkAction === "activate" || bulkAction === "deactivate") && (
            <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, fontSize: "0.9rem" }}>
              {selected.length} utilisateur(s) seront {bulkAction === "activate" ? "activés" : "désactivés"}.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setBulkAction(null)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none" }}>Annuler</Button>
          <Button variant="contained" onClick={handleBulkConfirm} disabled={bulkLoading}
            startIcon={bulkLoading ? <CircularProgress size={16} /> : undefined}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: bulkAction === "delete" ? C.danger : C.accent, color: bulkAction === "delete" ? "#fff" : "#FFFFFF", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { backgroundColor: bulkAction === "delete" ? C.dangerHover : C.accentHover } }}>
            {bulkLoading ? "En cours…" : "Confirmer"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
