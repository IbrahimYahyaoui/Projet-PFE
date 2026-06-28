// frontend/src/pages/CreateTicket.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  Grid,
  Chip,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ConfirmationNumber as TicketIcon,
  AttachFile as AttachIcon,
  ArrowBack as BackIcon,
  PriorityHigh as UrgentIcon,
  KeyboardArrowUp as HighIcon,
  Remove as MediumIcon,
  KeyboardArrowDown as LowIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { C, priorityColors } from "../theme";

type Priority = "low" | "medium" | "high" | "critical";

// ✅ Catégories qui matchent exactement le schema MongoDB
type Category = "hardware" | "software" | "network" | "access" | "other";

interface FormData {
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  attachments: File[];
}

const PRIORITIES: { value: Priority; label: string; icon: React.ReactNode }[] = [
  { value: "low",      label: "Faible",   icon: <LowIcon fontSize="small" /> },
  { value: "medium",   label: "Moyenne",  icon: <MediumIcon fontSize="small" /> },
  { value: "high",     label: "Haute",    icon: <HighIcon fontSize="small" /> },
  { value: "critical", label: "Critique", icon: <UrgentIcon fontSize="small" /> },
];

// ✅ Catégories corrigées
const CATEGORIES: { value: Category; label: string }[] = [
  { value: "hardware", label: "Matériel" },
  { value: "software", label: "Logiciel" },
  { value: "network",  label: "Réseau" },
  { value: "access",   label: "Accès / Permissions" },
  { value: "other",    label: "Autre" },
];

// ✅ apiUrl correct
const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

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

export default function CreateTicket() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    priority: "medium",
    category: "hardware",
    attachments: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof FormData) => (e: any) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const handlePrioritySelect = (p: Priority) => {
    setForm((prev) => ({ ...prev, priority: p }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles].slice(0, 5),
    }));
  };

  const removeFile = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Le titre est obligatoire."); return; }
    if (!form.description.trim()) { setError("La description est obligatoire."); return; }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        category: form.category,
      };

      // ✅ apiUrl correct
      const res = await fetch(`${apiUrl}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur lors de la création.");
      }

      setSuccess(true);
      setTimeout(() => navigate("/my-tickets"), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedPriority = priorityColors[form.priority];

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: C.bgPage, fontFamily: "Inter, sans-serif", p: { xs: 2, md: 4 } }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Tooltip title="Retour">
          <IconButton onClick={() => navigate(-1)} sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.textSecondary, "&:hover": { backgroundColor: C.accentLight, color: C.accent } }}>
            <BackIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ width: 44, height: 44, borderRadius: "12px", backgroundColor: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TicketIcon sx={{ color: C.accent, fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>
            Nouveau Ticket
          </Typography>
          <Typography variant="body2" sx={{ color: C.textMuted, fontFamily: "Inter, sans-serif" }}>
            Décrivez votre problème pour qu'un agent vous assiste
          </Typography>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.danger}30`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.danger } }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.success}40`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.success } }}>
          Ticket créé avec succès ! Redirection en cours…
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* LEFT */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", p: 3 }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: C.textPrimary, mb: 3, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Informations du ticket
            </Typography>

            <TextField
              label="Titre du ticket" fullWidth value={form.title}
              onChange={handleChange("title")}
              placeholder="Ex: Impossible de se connecter au VPN"
              sx={{ ...inputSx, mb: 3 }} inputProps={{ maxLength: 120 }}
            />

            <TextField
              label="Description détaillée" fullWidth multiline rows={6}
              value={form.description} onChange={handleChange("description")}
              placeholder="Décrivez le problème en détail…"
              sx={{ ...inputSx, mb: 3 }}
            />

            <TextField select label="Catégorie" fullWidth value={form.category} onChange={handleChange("category")} sx={{ ...inputSx, mb: 3 }}>
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}
                  sx={{ fontFamily: "Inter, sans-serif", color: C.textPrimary, "&:hover": { backgroundColor: C.accentLight }, "&.Mui-selected": { backgroundColor: C.accentLight } }}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>

            <Divider sx={{ borderColor: C.border, my: 3 }} />

            {/* Attachments */}
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: C.textPrimary, mb: 1.5, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Pièces jointes <span style={{ color: C.textMuted, fontWeight: 400 }}>(optionnel · max 5)</span>
              </Typography>
              <Button component="label" variant="outlined" size="medium" startIcon={<AttachIcon />} disabled={form.attachments.length >= 5}
                sx={{ fontFamily: "Inter, sans-serif", borderColor: C.border, color: C.textSecondary, borderRadius: "10px", textTransform: "none", mb: 2, py: "10px", px: "14px", "&:hover": { borderColor: C.accent, color: C.accent, backgroundColor: C.accentLight } }}>
                Ajouter un fichier
                <input type="file" hidden multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileChange} />
              </Button>
              {form.attachments.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {form.attachments.map((file, i) => (
                    <Chip key={i} label={file.name} onDelete={() => removeFile(i)} deleteIcon={<CloseIcon />}
                      sx={{ fontFamily: "Inter, sans-serif", backgroundColor: C.accentLight, color: C.accent, border: `1px solid ${C.accent}40`, "& .MuiChip-deleteIcon": { color: C.accent, fontSize: 16, "&:hover": { color: C.danger } } }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* RIGHT */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Priority Card */}
          <Paper sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", p: 3, mb: 3 }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: C.textPrimary, mb: 2, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Priorité
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {PRIORITIES.map((p) => {
                const colors = priorityColors[p.value];
                const isSelected = form.priority === p.value;
                return (
                  <Box key={p.value} onClick={() => handlePrioritySelect(p.value)}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "10px 14px", borderRadius: "10px", border: `1.5px solid ${isSelected ? colors.border : C.border}`, backgroundColor: isSelected ? colors.bg : "transparent", cursor: "pointer", transition: "all 0.2s", "&:hover": { borderColor: colors.border, backgroundColor: colors.bg } }}>
                    <Box sx={{ display: "flex", alignItems: "center", color: colors.text }}>{p.icon}</Box>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: isSelected ? 600 : 400, fontSize: "0.875rem", color: isSelected ? colors.text : C.textSecondary, flex: 1 }}>
                      {p.label}
                    </Typography>
                    {isSelected && <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: colors.text }} />}
                  </Box>
                );
              })}
            </Box>
          </Paper>

          {/* Summary Card */}
          <Paper sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", p: 3, mb: 1 }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: C.textPrimary, mb: 2, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Résumé
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {[
                { label: "Statut initial", value: "Ouvert",                                                             color: C.accent,                                  bg: C.accentLight },
                { label: "Priorité",       value: PRIORITIES.find((p) => p.value === form.priority)?.label ?? "—",     color: selectedPriority?.text ?? C.textSecondary, bg: selectedPriority?.bg ?? C.bg },
                { label: "Catégorie",      value: CATEGORIES.find((c) => c.value === form.category)?.label ?? "—",     color: C.textSecondary,                           bg: C.bg },
              ].map((row) => (
                <Box key={row.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: C.textMuted }}>{row.label}</Typography>
                  <Chip label={row.value} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", fontWeight: 600, backgroundColor: row.bg, color: row.color, height: 24 }} />
                </Box>
              ))}
              <Divider sx={{ borderColor: C.border }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: C.textMuted }}>Pièces jointes</Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", fontWeight: 600, color: C.textSecondary }}>{form.attachments.length} / 5</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Submit */}
          <Button fullWidth variant="contained" size="large" onClick={handleSubmit} disabled={loading || success}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.95rem", backgroundColor: C.accent, color: "#FFFFFF", borderRadius: "12px", py: 1.6, mt: 0, textTransform: "none", boxShadow: `0 4px 20px ${C.accent}40`, "&:hover": { backgroundColor: C.accentHover, boxShadow: `0 6px 24px ${C.accent}60` }, "&.Mui-disabled": { backgroundColor: C.slate, color: C.textMuted, boxShadow: "none" } }}>
            Créer le ticket
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}