// frontend/src/pages/Settings.tsx
import React, { useState } from "react";
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
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Notifications as NotifIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  CheckCircle as CheckIcon,
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

export default function Settings() {
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

  const [security, setSecurity] = useState<SettingRow[]>([
    { id: "2fa",         label: "Double authentification", description: "Ajouter une couche de sécurité supplémentaire", value: false },
    { id: "session_log", label: "Journal des sessions",    description: "Enregistrer les connexions et déconnexions",    value: true  },
    { id: "auto_logout", label: "Déconnexion automatique", description: "Se déconnecter après 30 min d'inactivité",     value: false },
  ]);

  const toggleNotif      = (id: string) => setNotifs((p)      => p.map((n) => n.id === id ? { ...n, value: !n.value } : n));
  const toggleAppearance = (id: string) => setAppearance((p)  => p.map((a) => a.id === id ? { ...a, value: !a.value } : a));
  const toggleSecurity   = (id: string) => setSecurity((p)    => p.map((s) => s.id === id ? { ...s, value: !s.value } : s));

  const handleSavePref = async () => {
    setPrefLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setPrefLoading(false);
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 3000);
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
      </Section>

      {/* 2. Apparence */}
      <Section icon={<PaletteIcon />} title="Apparence">
        {appearance.map((a, i) => (
          <Box key={a.id}>
            <ToggleRow label={a.label} description={a.description} checked={a.value} onChange={() => toggleAppearance(a.id)} />
            {i < appearance.length - 1 && <Divider sx={{ borderColor: C.divider }} />}
          </Box>
        ))}
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
        {security.map((s, i) => (
          <Box key={s.id}>
            <ToggleRow label={s.label} description={s.description} checked={s.value} onChange={() => toggleSecurity(s.id)} />
            {i < security.length - 1 && <Divider sx={{ borderColor: C.divider }} />}
          </Box>
        ))}
      </Section>

      {/* 5. Données */}
      <Section icon={<StorageIcon />} title="Données & Confidentialité">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { label: "Exporter mes données",   description: "Télécharger toutes vos données en format JSON",                          btnLabel: "Exporter",  btnColor: C.accent,  btnHover: C.accentHover, textColor: C.navy  },
            { label: "Supprimer mon compte",   description: "Supprimer définitivement votre compte et toutes vos données",            btnLabel: "Supprimer", btnColor: C.danger,  btnHover: C.dangerHover, textColor: "#fff"  },
          ].map((row) => (
            <Box key={row.label} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, p: 2, borderRadius: "12px", border: `1px solid ${C.border}`, backgroundColor: C.bgPage, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: C.textPrimary }}>{row.label}</Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textMuted, mt: 0.2 }}>{row.description}</Typography>
              </Box>
              <Button variant="contained" size="small"
                sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.8rem", backgroundColor: row.btnColor, color: row.textColor, borderRadius: "8px", textTransform: "none", px: 2, "&:hover": { backgroundColor: row.btnHover } }}>
                {row.btnLabel}
              </Button>
            </Box>
          ))}
        </Box>
      </Section>
    </Box>
  );
}