// frontend/src/pages/Profile.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
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
} from "@mui/icons-material";
import { C, roleColors } from "../theme";

type Role = "admin" | "tech" | "user";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  ticketsCount?: number;
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

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
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
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [editInfo, setEditInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: "", email: "" });
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoSuccess, setInfoSuccess] = useState(false);

  const [editPwd, setEditPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProfile(data);
        setInfoForm({ name: data.name, email: data.email });
      } catch {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setProfile({
              _id: payload.id ?? payload._id ?? "",
              name: payload.name ?? "Utilisateur",
              email: payload.email ?? "",
              role: payload.role ?? "user",
              createdAt: new Date().toISOString(),
            });
            setInfoForm({ name: payload.name ?? "", email: payload.email ?? "" });
          } catch {}
        }
      } finally {
        setLoading(false);
      }
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
      const res = await fetch(`/api/users/${profile?._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: infoForm.name, email: infoForm.email }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erreur serveur.");
      }
      const updated = await res.json();
      setProfile((p) => p ? { ...p, name: updated.name, email: updated.email } : p);
      setInfoSuccess(true);
      setEditInfo(false);
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch (err: any) {
      setInfoError(err.message);
    } finally {
      setInfoLoading(false);
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
      const res = await fetch("/api/users/change-password", {
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

  if (!profile) return null;

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
          <Avatar sx={{ width: 72, height: 72, backgroundColor: C.accentLight, color: C.accent, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.5rem", border: `2px solid ${C.accent}40` }}>
            {getInitials(profile.name)}
          </Avatar>
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
              { icon: <PersonIcon sx={{ fontSize: 18 }} />,   label: "Nom complet",   value: profile.name },
              { icon: <EmailIcon sx={{ fontSize: 18 }} />,    label: "Email",          value: profile.email },
              { icon: <CalendarIcon sx={{ fontSize: 18 }} />, label: "Membre depuis",  value: formatDate(profile.createdAt) },
              { icon: <TicketIcon sx={{ fontSize: 18 }} />,   label: "Tickets créés",  value: String(profile.ticketsCount ?? "—") },
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