// frontend/src/pages/Settings.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Switch,
  Divider,
  Button,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Notifications as NotifIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  CheckCircle as CheckIcon,
  Download as DownloadIcon,
  DeleteForever as DeleteForeverIcon,
} from "@mui/icons-material";
import { C } from "../theme";

interface SettingRow {
  id: string;
  label: string;
  description: string;
  value: boolean;
}

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

const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": { color: C.accent },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: C.accent,
  },
};

function Section({
  icon,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 3, py: 2, backgroundColor: C.bgPage, borderBottom: `1px solid ${C.border}` }}>
        <Box sx={{ color: C.accent }}>{icon}</Box>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.9rem", color: C.textPrimary, textTransform: "uppercase", letterSpacing: "0.05em", flex: 1 }}>
          {title}
        </Typography>
        {badge && (
          <Chip label={badge} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", fontWeight: 600, backgroundColor: C.accentLight, color: C.accent, height: 22 }} />
        )}
      </Box>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Paper>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, py: 1.5 }}>
      <Box>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: C.textPrimary }}>
          {label}
        </Typography>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textMuted, mt: 0.2 }}>
          {description}
        </Typography>
      </Box>
      <Switch checked={checked} onChange={onChange} sx={switchSx} />
    </Box>
  );
}

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const formatLastLogin = (iso?: string | null) => {
  if (!iso) return "Première connexion";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

export default function Settings() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userId = currentUser?.id ?? currentUser?._id;

  const [notifs, setNotifs] = useState<SettingRow[]>([
    { id: "email_new",      label: "Nouveau ticket",      description: "Recevoir un email à chaque nouveau ticket créé",    value: true  },
    { id: "email_assign",   label: "Ticket assigné",      description: "Recevoir un email quand un ticket vous est assigné", value: true  },
    { id: "email_resolved", label: "Ticket résolu",       description: "Recevoir un email quand votre ticket est résolu",    value: false },
    { id: "email_comment",  label: "Nouveau commentaire", description: "Recevoir un email pour chaque commentaire",          value: true  },
  ]);

  const [appearance, setAppearance] = useState<SettingRow[]>([
    { id: "compact",    label: "Vue compacte",    description: "Afficher plus d'éléments dans les listes",   value: false },
    { id: "animations", label: "Animations",      description: "Activer les animations d'interface",          value: true  },
    { id: "sidebar",    label: "Sidebar réduite", description: "Réduire la barre latérale par défaut",        value: false },
  ]);

  const [language, setLanguage]     = useState("fr");
  const [timezone, setTimezone]     = useState("Africa/Tunis");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [prefSaved, setPrefSaved]   = useState(false);
  const [prefLoading, setPrefLoading] = useState(false);

  const [lastLoginAt, setLastLoginAt] = useState<string | null>(currentUser?.lastLoginAt ?? null);
  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState(0);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySaved, setSecuritySaved]     = useState(false);

  const [exportLoading, setExportLoading] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog]   = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountError, setDeleteAccountError]     = useState<string | null>(null);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  const toggleNotif      = (id: string) => setNotifs((p)      => p.map((n) => n.id === id ? { ...n, value: !n.value } : n));
  const toggleAppearance = (id: string) => setAppearance((p)  => p.map((a) => a.id === id ? { ...a, value: !a.value } : a));

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    fetch(`${apiUrl}/api/profile/${userId}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.settings?.notifications) {
          setNotifs(prev => prev.map(n => ({
            ...n,
            value: data.settings.notifications[n.id] ?? n.value,
          })));
        }
        if (data.settings?.appearance) {
          setAppearance(prev => prev.map(a => ({
            ...a,
            value: data.settings.appearance[a.id] ?? a.value,
          })));
        }
        if (data.settings?.preferences) {
          const p = data.settings.preferences;
          if (p.language)   setLanguage(p.language);
          if (p.timezone)   setTimezone(p.timezone);
          if (p.dateFormat) setDateFormat(p.dateFormat);
        }
        if (data.settings?.security?.autoLogoutMinutes !== undefined) {
          setAutoLogoutMinutes(data.settings.security.autoLogoutMinutes);
        }
      })
      .catch(() => {});
  }, [userId]);

  // Charge la dernière connexion si elle n'est pas déjà en mémoire (localStorage "user")
  useEffect(() => {
    if (lastLoginAt) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${apiUrl}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.lastLoginAt) setLastLoginAt(data.lastLoginAt); })
      .catch(() => {});
  }, [lastLoginAt]);

  const saveSection = async (section: string, payload: Record<string, any>) => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiUrl}/api/profile/${userId}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [section]: payload }),
    });
    if (!res.ok) throw new Error("Erreur serveur");
  };

  const handleSavePref = async () => {
    setPrefLoading(true);
    try {
      await saveSection("preferences", { language, timezone, dateFormat });
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 3000);
    } catch { /* ignore */ }
    finally { setPrefLoading(false); }
  };

  const handleSaveSecurity = async () => {
    setSecurityLoading(true);
    try {
      await saveSection("security", { autoLogoutMinutes });
      setSecuritySaved(true);
      setTimeout(() => setSecuritySaved(false), 3000);
    } catch { /* ignore */ }
    finally { setSecurityLoading(false); }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  // Déconnexion automatique après inactivité. Implémenté ici pour rester simple,
  // mais pour couvrir toute l'app (pas seulement cette page), il faudrait idéalement
  // déplacer ce timer dans un composant racine (ex: App.tsx) ou un contexte global.
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!autoLogoutMinutes || autoLogoutMinutes <= 0) return;

    const resetTimer = () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = setTimeout(handleLogout, autoLogoutMinutes * 60 * 1000);
    };

    resetTimer();
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, [autoLogoutMinutes, handleLogout]);

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/users/me/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "mes-donnees-tuskflow.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    finally { setExportLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) return;
    setDeleteAccountLoading(true);
    setDeleteAccountError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/users/me/account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deleteAccountPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur serveur.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (err: any) {
      setDeleteAccountError(err.message);
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: C.bgPage, fontFamily: "Inter, sans-serif", p: { xs: 2, md: 4 }, maxWidth: 860, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: "12px", backgroundColor: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SettingsIcon sx={{ color: C.accent, fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>
            Paramètres
          </Typography>
          <Typography variant="body2" sx={{ color: C.textMuted, fontFamily: "Inter, sans-serif" }}>
            Configurez votre expérience TuskFlow
          </Typography>
        </Box>
      </Box>

      {/* 1. Notifications */}
      <Section icon={<NotifIcon />} title="Notifications" badge="Email">
        {notifs.map((n, i) => (
          <Box key={n.id}>
            <ToggleRow label={n.label} description={n.description} checked={n.value} onChange={() => toggleNotif(n.id)} />
            {i < notifs.length - 1 && <Divider sx={{ borderColor: C.divider }} />}
          </Box>
        ))}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button variant="contained" size="small"
            onClick={async () => {
              const payload: Record<string, boolean> = {};
              notifs.forEach(n => { payload[n.id] = n.value; });
              await saveSection("notifications", payload);
            }}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.navy, color: "#fff",
              borderRadius: "10px", textTransform: "none", px: 2.5,
              "&:hover": { bgcolor: C.navyMid } }}>
            Enregistrer
          </Button>
        </Box>
      </Section>

      {/* 2. Apparence */}
      <Section icon={<PaletteIcon />} title="Apparence">
        {appearance.map((a, i) => (
          <Box key={a.id}>
            <ToggleRow label={a.label} description={a.description} checked={a.value} onChange={() => toggleAppearance(a.id)} />
            {i < appearance.length - 1 && <Divider sx={{ borderColor: C.divider }} />}
          </Box>
        ))}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button variant="contained" size="small"
            onClick={async () => {
              const payload: Record<string, boolean> = {};
              appearance.forEach(a => { payload[a.id] = a.value; });
              await saveSection("appearance", payload);
            }}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.navy, color: "#fff",
              borderRadius: "10px", textTransform: "none", px: 2.5,
              "&:hover": { bgcolor: C.navyMid } }}>
            Enregistrer
          </Button>
        </Box>
      </Section>

      {/* 3. Préférences */}
      <Section icon={<LanguageIcon />} title="Préférences régionales">
        {prefSaved && (
          <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 3, backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.success}40`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.success } }}>
            Préférences enregistrées !
          </Alert>
        )}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5, mb: 3 }}>
          <TextField select label="Langue" value={language} onChange={(e) => setLanguage(e.target.value)} sx={inputSx}>
            {[{ value: "fr", label: "Français" }, { value: "en", label: "English" }, { value: "ar", label: "العربية" }].map((o) => (
              <MenuItem key={o.value} value={o.value} sx={{ fontFamily: "Inter, sans-serif", color: C.textPrimary, "&:hover": { backgroundColor: C.accentLight } }}>{o.label}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Fuseau horaire" value={timezone} onChange={(e) => setTimezone(e.target.value)} sx={inputSx}>
            {[{ value: "Africa/Tunis", label: "Tunis (UTC+1)" }, { value: "Europe/Paris", label: "Paris (UTC+1)" }, { value: "UTC", label: "UTC (UTC+0)" }].map((o) => (
              <MenuItem key={o.value} value={o.value} sx={{ fontFamily: "Inter, sans-serif", color: C.textPrimary, "&:hover": { backgroundColor: C.accentLight } }}>{o.label}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Format de date" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} sx={inputSx}>
            {[{ value: "DD/MM/YYYY", label: "DD/MM/YYYY" }, { value: "MM/DD/YYYY", label: "MM/DD/YYYY" }, { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }].map((o) => (
              <MenuItem key={o.value} value={o.value} sx={{ fontFamily: "Inter, sans-serif", color: C.textPrimary, "&:hover": { backgroundColor: C.accentLight } }}>{o.label}</MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" onClick={handleSavePref} disabled={prefLoading}
            startIcon={prefLoading ? <CircularProgress size={16} sx={{ color: C.navy }} /> : <CheckIcon />}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.accent, color: C.navy, borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { backgroundColor: C.accentHover }, "&.Mui-disabled": { backgroundColor: C.slate, color: C.textMuted } }}>
            {prefLoading ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </Box>
      </Section>

      {/* 4. Sécurité */}
      <Section icon={<SecurityIcon />} title="Sécurité">
        {securitySaved && (
          <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 3, backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.success}40`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.success } }}>
            Préférences de sécurité enregistrées !
          </Alert>
        )}

        {/* Dernière connexion — lecture seule */}
        <Box sx={{ py: 1.5 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: C.textPrimary }}>
            Dernière connexion
          </Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textMuted, mt: 0.2 }}>
            {formatLastLogin(lastLoginAt)}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: C.divider }} />

        {/* Déconnexion automatique */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, py: 1.5, flexWrap: "wrap" }}>
          <Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: C.textPrimary }}>
              Déconnexion automatique
            </Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textMuted, mt: 0.2 }}>
              Se déconnecter automatiquement après une période d'inactivité
            </Typography>
          </Box>
          <TextField select value={autoLogoutMinutes} onChange={(e) => setAutoLogoutMinutes(Number(e.target.value))}
            sx={{ ...inputSx, minWidth: 160 }}>
            {[{ value: 0, label: "Désactivé" }, { value: 15, label: "15 min" }, { value: 30, label: "30 min" }, { value: 60, label: "60 min" }].map((o) => (
              <MenuItem key={o.value} value={o.value} sx={{ fontFamily: "Inter, sans-serif", color: C.textPrimary, "&:hover": { backgroundColor: C.accentLight } }}>{o.label}</MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button variant="contained" onClick={handleSaveSecurity} disabled={securityLoading}
            startIcon={securityLoading ? <CircularProgress size={16} sx={{ color: C.navy }} /> : <CheckIcon />}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.accent, color: C.navy, borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { backgroundColor: C.accentHover }, "&.Mui-disabled": { backgroundColor: C.slate, color: C.textMuted } }}>
            {securityLoading ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </Box>
      </Section>

      {/* 5. Données */}
      <Section icon={<StorageIcon />} title="Données & Confidentialité">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, p: 2, borderRadius: "12px", border: `1px solid ${C.border}`, backgroundColor: C.bgPage, flexWrap: "wrap" }}>
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: C.textPrimary }}>Exporter mes données</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textMuted, mt: 0.2 }}>Télécharger toutes vos données en format JSON</Typography>
            </Box>
            <Button variant="contained" size="small" onClick={handleExportData} disabled={exportLoading}
              startIcon={exportLoading ? <CircularProgress size={14} sx={{ color: C.navy }} /> : <DownloadIcon sx={{ fontSize: 16 }} />}
              sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.8rem", backgroundColor: C.accent, color: C.navy, borderRadius: "8px", textTransform: "none", px: 2, "&:hover": { backgroundColor: C.accentHover }, "&.Mui-disabled": { backgroundColor: C.slate, color: C.textMuted } }}>
              {exportLoading ? "Export…" : "Exporter"}
            </Button>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, p: 2, borderRadius: "12px", border: `1px solid ${C.border}`, backgroundColor: C.bgPage, flexWrap: "wrap" }}>
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: C.textPrimary }}>Supprimer mon compte</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textMuted, mt: 0.2 }}>Supprimer définitivement votre compte et toutes vos données</Typography>
            </Box>
            <Button variant="contained" size="small"
              onClick={() => { setDeleteAccountDialog(true); setDeleteAccountError(null); setDeleteAccountPassword(""); }}
              sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.8rem", backgroundColor: C.danger, color: "#fff", borderRadius: "8px", textTransform: "none", px: 2, "&:hover": { backgroundColor: C.dangerHover } }}>
              Supprimer
            </Button>
          </Box>
        </Box>
      </Section>

      {/* ═══ Dialog Suppression de compte ═══ */}
      <Dialog open={deleteAccountDialog} onClose={() => { if (!deleteAccountLoading) setDeleteAccountDialog(false); }} maxWidth="xs" fullWidth
        PaperProps={{ sx: { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
          Supprimer mon compte
        </DialogTitle>
        <DialogContent>
          {deleteAccountError ? (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-message": { fontFamily: "Inter, sans-serif" } }}>
              {deleteAccountError}
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-message": { fontFamily: "Inter, sans-serif" } }}>
              Cette action est irréversible. Votre compte et toutes vos données seront définitivement supprimés.
            </Alert>
          )}
          <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, fontSize: "0.9rem", mb: 1.5 }}>
            Saisissez votre mot de passe actuel pour confirmer.
          </Typography>
          <TextField label="Mot de passe" type="password" fullWidth value={deleteAccountPassword}
            onChange={(e) => setDeleteAccountPassword(e.target.value)} sx={inputSx} />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteAccountDialog(false)} disabled={deleteAccountLoading}
            sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, borderRadius: "10px", textTransform: "none" }}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleDeleteAccount} disabled={deleteAccountLoading || !deleteAccountPassword}
            startIcon={deleteAccountLoading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <DeleteForeverIcon />}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, backgroundColor: C.danger, color: "#fff", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { backgroundColor: C.dangerHover }, "&.Mui-disabled": { backgroundColor: C.slate, color: C.textMuted } }}>
            {deleteAccountLoading ? "Suppression…" : "Supprimer définitivement"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}