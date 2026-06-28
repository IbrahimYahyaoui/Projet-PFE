// frontend/src/pages/Profile.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  ConfirmationNumber as TicketIcon,
  AdminPanelSettings as AdminIcon,
  Engineering as TechIcon,
  PhotoCamera as PhotoCameraIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Groups as TeamIcon,
  AccessTime as LastLoginIcon,
} from "@mui/icons-material";
import { C, roleColors } from "../theme";
import { UserAvatar } from "../components/UserAvatar";

type Role = "admin" | "tech" | "user";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  ticketsCount?: number;
  avatar?: string | null;
  phone?: string | null;
  department?: string | null;
  teamId?: { _id: string; name: string } | null;
  lastLoginAt?: string | null;
}

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  tech: "Technicien",
  user: "Utilisateur",
};

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  admin: <AdminIcon sx={{ fontSize: 14 }} />,
  tech: <TechIcon sx={{ fontSize: 14 }} />,
  user: <PersonIcon sx={{ fontSize: 14 }} />,
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

const formatLastLogin = (iso?: string | null) => {
  if (!iso) return "Jamais";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

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
};

const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileStats, setProfileStats] = useState<any>(null);

  const [editInfo, setEditInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: "", email: "", phone: "", department: "" });
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoSuccess, setInfoSuccess] = useState(false);

  const [editPwd, setEditPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      let resolvedId: string | null = null;
      try {
        const token = localStorage.getItem("token");
        // ✅ Correct endpoint avec apiUrl
        const res = await fetch(`${apiUrl}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setInfoForm({ name: data.name, email: data.email, phone: data.phone ?? "", department: data.department ?? "" });
          resolvedId = data._id ?? data.id;
        } else {
          throw new Error("Failed to fetch");
        }
      } catch {
        // Fallback JWT
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            // ✅ Récupérer aussi depuis localStorage user
            const storedUser = localStorage.getItem("user");
            const storedUserData = storedUser ? JSON.parse(storedUser) : null;
            resolvedId = payload.id ?? payload._id ?? storedUserData?.id ?? storedUserData?._id ?? null;
            if (!resolvedId) {
              setLoadError("Impossible de charger votre profil. Veuillez vous reconnecter.");
            } else {
              setProfile({
                _id: resolvedId,
                name: payload.name ?? "Utilisateur",
                email: storedUserData?.email ?? payload.email ?? "",
                role: payload.role ?? "user",
                createdAt: new Date().toISOString(),
              });
              setInfoForm({
                name: payload.name ?? "",
                email: storedUserData?.email ?? payload.email ?? "",
                phone: "",
                department: "",
              });
            }
          } catch {
            setLoadError("Impossible de charger votre profil. Veuillez vous reconnecter.");
          }
        } else {
          setLoadError("Impossible de charger votre profil. Veuillez vous reconnecter.");
        }
      }
      if (resolvedId) {
        try {
          const token = localStorage.getItem("token");
          const statsRes = await fetch(`${apiUrl}/api/profile/${resolvedId}/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setProfileStats(statsData.stats);
          }
        } catch {}
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSaveInfo = async () => {
    if (!infoForm.name.trim()) { setInfoError("Le nom est obligatoire."); return; }
    if (!infoForm.email.trim()) { setInfoError("L'email est obligatoire."); return; }
    setInfoLoading(true);
    setInfoError(null);
    try {
      const token = localStorage.getItem("token");
      // CORRECTION 6 — /api/profile/:id au lieu de /api/users/:id (admin-only)
      const res = await fetch(`${apiUrl}/api/profile/${profile?._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: infoForm.name, email: infoForm.email, phone: infoForm.phone, department: infoForm.department }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erreur serveur.");
      }
      const updated = await res.json();
      // La réponse est { message, user: { id, name, email, role, avatar, phone, department } }
      const newName       = updated.user?.name       ?? updated.name;
      const newEmail      = updated.user?.email      ?? updated.email;
      const newPhone      = updated.user?.phone      ?? infoForm.phone;
      const newDepartment = updated.user?.department ?? infoForm.department;
      setProfile((p) => p ? { ...p, name: newName, email: newEmail, phone: newPhone, department: newDepartment } : p);
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        localStorage.setItem("user", JSON.stringify({ ...userData, name: newName, email: newEmail }));
      }
      setInfoSuccess(true);
      setEditInfo(false);
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch (err: any) {
      setInfoError(err.message);
    } finally {
      setInfoLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAvatarError("Le fichier doit être une image."); return; }
    if (file.size > 2 * 1024 * 1024) { setAvatarError("L'image ne doit pas dépasser 2 Mo."); return; }
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const base64String: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/profile/${profile?._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: base64String }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erreur serveur.");
      }
      const updated = await res.json();
      const newAvatar = updated.user?.avatar ?? updated.avatar ?? base64String;
      setProfile((p) => p ? { ...p, avatar: newAvatar } : p);
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        localStorage.setItem("user", JSON.stringify({ ...userData, avatar: newAvatar }));
      }
    } catch (err: any) {
      setAvatarError(err.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSavePwd = async () => {
    if (!pwdForm.current) { setPwdError("Mot de passe actuel requis."); return; }
    if (!pwdForm.next) { setPwdError("Nouveau mot de passe requis."); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError("Les mots de passe ne correspondent pas."); return; }
    if (pwdForm.next.length < 6) { setPwdError("Minimum 6 caractères."); return; }
    setPwdLoading(true);
    setPwdError(null);
    try {
      const token = localStorage.getItem("token");
      // ✅ Correct endpoint : /api/profile/:id/password
      const res = await fetch(`${apiUrl}/api/profile/${profile?._id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: pwdForm.current,
          newPassword: pwdForm.next,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erreur serveur.");
      }
      setPwdSuccess(true);
      setEditPwd(false);
      setPwdForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err: any) {
      setPwdError(err.message);
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: C.accent }} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.danger ?? "#DC2626", fontSize: "0.9rem" }}>
          {loadError ?? "Impossible de charger votre profil. Veuillez vous reconnecter."}
        </Typography>
      </Box>
    );
  }

  const role = roleColors[profile.role] ?? roleColors["user"];

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: C.bgPage, fontFamily: "Inter, sans-serif", p: { xs: 2, md: 4 }, maxWidth: 860, mx: "auto" }}>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: "12px", backgroundColor: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PersonIcon sx={{ color: C.accent, fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>
            Mon Profil
          </Typography>
          <Typography variant="body2" sx={{ color: C.textMuted, fontFamily: "Inter, sans-serif" }}>
            Gérez vos informations personnelles
          </Typography>
        </Box>
      </Box>

      {infoSuccess && (
        <Alert severity="success" sx={{ mb: 3, backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.success}40`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.success } }}>
          Informations mises à jour avec succès !
        </Alert>
      )}
      {pwdSuccess && (
        <Alert severity="success" sx={{ mb: 3, backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.success}40`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.success } }}>
          Mot de passe modifié avec succès !
        </Alert>
      )}

      {/* Card 1 */}
      <Paper sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3, flexWrap: "wrap" }}>
          <Box sx={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
            <UserAvatar name={profile.name} avatar={profile.avatar} sx={{ width: 72, height: 72, backgroundColor: C.accentLight, color: C.accent, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.5rem", border: `2px solid ${C.accent}40` }} />
            <IconButton component="label" size="small"
              sx={{
                position: "absolute", bottom: -4, right: -4,
                width: 26, height: 26,
                backgroundColor: C.accent, color: "#fff",
                border: `2px solid ${C.card}`,
                "&:hover": { backgroundColor: C.accentHover },
              }}>
              {avatarUploading ? (
                <CircularProgress size={16} sx={{ color: "#fff" }} />
              ) : (
                <PhotoCameraIcon sx={{ fontSize: 14 }} />
              )}
              <input type="file" hidden accept="image/*" onChange={handleAvatarChange} disabled={avatarUploading} />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.2rem", color: C.textPrimary }}>
              {profile.name}
            </Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.875rem", color: C.textMuted, mb: 1 }}>
              {profile.email}
            </Typography>
            <Chip
              icon={<>{ROLE_ICONS[profile.role]}</>}
              label={ROLE_LABELS[profile.role]}
              size="small"
              sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.75rem", backgroundColor: role.bg, color: role.text, border: `1px solid ${role.border}`, "& .MuiChip-icon": { color: role.text } }}
            />
            {profile.createdAt && (
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mt: 0.5 }}>
                Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            )}
          </Box>
          {!editInfo && (
            <Tooltip title="Modifier">
              <IconButton
                onClick={() => { setEditInfo(true); setInfoError(null); }}
                sx={{ border: `1px solid ${C.border}`, color: C.textSecondary, "&:hover": { backgroundColor: C.accentLight, color: C.accent, borderColor: C.accent } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {avatarError && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.danger}30`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.danger } }}>
            {avatarError}
          </Alert>
        )}

        <Divider sx={{ borderColor: C.border, mb: 3 }} />

        {editInfo ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {infoError && (
              <Alert severity="error" sx={{ backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.danger}30`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.danger } }}>
                {infoError}
              </Alert>
            )}
            <TextField label="Nom complet" fullWidth value={infoForm.name} onChange={(e) => setInfoForm((f) => ({ ...f, name: e.target.value }))} sx={inputSx} />
            <TextField label="Email" type="email" fullWidth value={infoForm.email} onChange={(e) => setInfoForm((f) => ({ ...f, email: e.target.value }))} sx={inputSx} />
            <TextField label="Téléphone" fullWidth value={infoForm.phone} onChange={(e) => setInfoForm((f) => ({ ...f, phone: e.target.value }))} sx={inputSx} />
            <TextField label="Département" fullWidth value={infoForm.department} onChange={(e) => setInfoForm((f) => ({ ...f, department: e.target.value }))} sx={inputSx} />
            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
              <Button onClick={() => { setEditInfo(false); setInfoError(null); }} startIcon={<CloseIcon />} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none", "&:hover": { backgroundColor: C.bgPage } }}>
                Annuler
              </Button>
              <Button variant="contained" onClick={handleSaveInfo} disabled={infoLoading}
                startIcon={infoLoading ? <CircularProgress size={16} sx={{ color: C.navy }} /> : <SaveIcon />}
                sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.accent, color: C.navy, borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { backgroundColor: C.accentHover }, "&.Mui-disabled": { backgroundColor: C.slate, color: C.textMuted } }}>
                {infoLoading ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
            {[
              { icon: <PersonIcon sx={{ fontSize: 18 }} />,    label: "Nom complet",       value: profile.name },
              { icon: <EmailIcon sx={{ fontSize: 18 }} />,     label: "Email",             value: profile.email },
              { icon: <PhoneIcon sx={{ fontSize: 18 }} />,     label: "Téléphone",         value: profile.phone || "—" },
              { icon: <BusinessIcon sx={{ fontSize: 18 }} />,  label: "Département",       value: profile.department || "—" },
              { icon: <TeamIcon sx={{ fontSize: 18 }} />,      label: "Équipe",            value: profile.teamId?.name ?? "Aucune équipe" },
              { icon: <CalendarIcon sx={{ fontSize: 18 }} />,  label: "Membre depuis",     value: formatDate(profile.createdAt) },
              { icon: <LastLoginIcon sx={{ fontSize: 18 }} />, label: "Dernière connexion", value: formatLastLogin(profile.lastLoginAt) },
              ...(profile.role === "user"
                ? [{ icon: <TicketIcon sx={{ fontSize: 18 }} />, label: "Tickets créés", value: String(profileStats?.total ?? "—") }]
                : []),
            ].map((row) => (
              <Box key={row.label} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 2, borderRadius: "12px", backgroundColor: C.bgPage, border: `1px solid ${C.border}` }}>
                <Box sx={{ color: C.accent, mt: 0.2, flexShrink: 0 }}>{row.icon}</Box>
                <Box>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.3 }}>
                    {row.label}
                  </Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.9rem", color: C.textPrimary, wordBreak: "break-all" }}>
                    {row.value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Card Stats */}
      <Paper sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", p: 3, mb: 3 }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "14px", color: C.textPrimary, mb: 2.5 }}>
          {profileStats?.label === "Plateforme" ? "Statistiques — Plateforme" : "Mon activité"}
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 2 }}>
          {profileStats && Object.entries(profileStats)
            .filter(([k]) => k !== 'label')
            .map(([key, val]) => {
              const labels: Record<string, { label: string; color: string; bg: string; icon: string }> = {
                total:       { label: "Total tickets",  color: C.accent,  bg: C.accentLight, icon: "ticket" },
                resolved:    { label: "Résolus",        color: "#16A34A", bg: "#f0fdf4",     icon: "check" },
                open:        { label: "Ouverts",        color: "#F97316", bg: "#fff7ed",     icon: "inbox" },
                inProgress:  { label: "En cours",       color: "#F59E0B", bg: "#fffbeb",     icon: "rotate-clockwise" },
                slaBreached: { label: "SLA dépassés",   color: "#DC2626", bg: "#fef2f2",     icon: "alert" },
              };
              const cfg = labels[key] ?? { label: key, color: C.accent, bg: C.accentLight, icon: "chart-bar" };
              return (
                <Box key={key} sx={{ bgcolor: cfg.bg, borderRadius: "12px", p: 2, textAlign: "center" }}>
                  <Box component="i" className={`ti ti-${cfg.icon}`} sx={{ fontSize: 22, color: cfg.color, mb: 0.5 }} />
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "24px", color: cfg.color, lineHeight: 1.2 }}>
                    {String(val)}
                  </Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mt: 0.3 }}>
                    {cfg.label}
                  </Typography>
                </Box>
              );
            })}
        </Box>
      </Paper>

      {/* Card 2 — Mot de passe */}
      <Paper sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: editPwd ? 3 : 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: "10px", backgroundColor: C.dangerBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LockIcon sx={{ color: C.danger, fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: C.textPrimary, fontSize: "0.95rem" }}>
                Mot de passe
              </Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textMuted }}>
                Modifiez votre mot de passe de connexion
              </Typography>
            </Box>
          </Box>
          {!editPwd ? (
            <Button variant="outlined" onClick={() => { setEditPwd(true); setPwdError(null); }}
              sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, borderColor: C.border, color: C.textSecondary, borderRadius: "10px", textTransform: "none", "&:hover": { borderColor: C.accent, color: C.accent, backgroundColor: C.accentLight } }}>
              Modifier
            </Button>
          ) : (
            <IconButton onClick={() => { setEditPwd(false); setPwdError(null); setPwdForm({ current: "", next: "", confirm: "" }); }} size="small" sx={{ color: C.textMuted, "&:hover": { color: C.danger } }}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        {editPwd && (
          <>
            <Divider sx={{ borderColor: C.border, mb: 3 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {pwdError && (
                <Alert severity="error" sx={{ backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.danger}30`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.danger } }}>
                  {pwdError}
                </Alert>
              )}
              <TextField label="Mot de passe actuel" type="password" fullWidth value={pwdForm.current} onChange={(e) => setPwdForm((f) => ({ ...f, current: e.target.value }))} sx={inputSx} />
              <TextField label="Nouveau mot de passe" type="password" fullWidth value={pwdForm.next} onChange={(e) => setPwdForm((f) => ({ ...f, next: e.target.value }))} sx={inputSx} />
              <TextField label="Confirmer le nouveau mot de passe" type="password" fullWidth value={pwdForm.confirm} onChange={(e) => setPwdForm((f) => ({ ...f, confirm: e.target.value }))} sx={inputSx} />
              <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                <Button onClick={() => { setEditPwd(false); setPwdError(null); setPwdForm({ current: "", next: "", confirm: "" }); }}
                  sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none", "&:hover": { backgroundColor: C.bgPage } }}>
                  Annuler
                </Button>
                <Button variant="contained" onClick={handleSavePwd} disabled={pwdLoading}
                  startIcon={pwdLoading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <SaveIcon />}
                  sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.danger, color: "#fff", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { backgroundColor: C.dangerHover }, "&.Mui-disabled": { backgroundColor: C.slate, color: C.textMuted } }}>
                  {pwdLoading ? "Enregistrement…" : "Changer le mot de passe"}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}