import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, TextField, Button,
  Alert, CircularProgress, Divider,
} from "@mui/material";
import {
  Business as BusinessIcon, Save as SaveIcon,
  CheckCircle as CheckIcon, SmartToy as AIIcon,
} from "@mui/icons-material";
import { C } from "../theme";

const API = "http://localhost:3000/api";

interface CompanyData {
  name: string;
  industry: string;
  description: string;
  services: string;
  supportPolicies: string;
  commonIssues: string;
  escalationProcess: string;
  additionalInstructions: string;
}

const EMPTY: CompanyData = {
  name: "", industry: "", description: "", services: "",
  supportPolicies: "", commonIssues: "", escalationProcess: "", additionalInstructions: "",
};

// Exported so ChatBot can use same formatting for the live preview
export const buildAIContext = (data: Partial<CompanyData>): string => {
  const parts: string[] = [];
  if (data.name)                   parts.push(`Company: ${data.name}`);
  if (data.industry)               parts.push(`Industry: ${data.industry}`);
  if (data.description)            parts.push(`About: ${data.description}`);
  if (data.services)               parts.push(`Products/Services: ${data.services}`);
  if (data.supportPolicies)        parts.push(`Support policies: ${data.supportPolicies}`);
  if (data.commonIssues)           parts.push(`Common issues & resolutions: ${data.commonIssues}`);
  if (data.escalationProcess)      parts.push(`Escalation process: ${data.escalationProcess}`);
  if (data.additionalInstructions) parts.push(`Additional instructions: ${data.additionalInstructions}`);
  return parts.join("\n");
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    fontFamily: "Inter, sans-serif", backgroundColor: C.bg, borderRadius: "10px",
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.accent },
    "&.Mui-focused fieldset": { borderColor: C.accent, borderWidth: "2px" },
  },
  "& .MuiInputLabel-root": { fontFamily: "Inter, sans-serif", color: C.textMuted, "&.Mui-focused": { color: C.accent } },
  "& .MuiInputBase-input, & .MuiInputBase-inputMultiline": { color: C.textPrimary },
};

export default function CompanyContext() {
  const [data,    setData]    = useState<CompanyData>(EMPTY);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/ai/company-context`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.fields) setData({ ...EMPTY, ...d.fields }); })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const set = (field: keyof CompanyData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API}/ai/company-context`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Save failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const preview = buildAIContext(data);

  if (fetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: C.accent }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: C.bgPage, p: { xs: 2, md: 4 }, maxWidth: 860, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BusinessIcon sx={{ color: C.accent, fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>
            Contexte IA de l'entreprise
          </Typography>
          <Typography variant="body2" sx={{ color: C.textMuted, fontFamily: "Inter, sans-serif" }}>
            Sauvegardé — le chatbot IA utilise ces informations pour chaque session
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>{error}</Alert>
      )}
      {saved && (
        <Alert severity="success" icon={<CheckIcon />}
          sx={{ mb: 3, bgcolor: C.successBg, color: C.success, border: `1px solid ${C.success}40`, borderRadius: "10px", fontFamily: "Inter, sans-serif", "& .MuiAlert-icon": { color: C.success } }}>
          Sauvegardé — tous les utilisateurs bénéficient de ce contexte dans leurs sessions IA
        </Alert>
      )}

      {/* Form */}
      <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 3, py: 2, bgcolor: C.bgPage, borderBottom: `1px solid ${C.border}` }}>
          <BusinessIcon sx={{ color: C.accent, fontSize: 18 }} />
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.85rem", color: C.textPrimary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Informations de l'entreprise
          </Typography>
        </Box>

        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
            <TextField label="Nom de l'entreprise" value={data.name}     onChange={set("name")}     sx={inputSx} />
            <TextField label="Secteur d'activité"  value={data.industry} onChange={set("industry")} sx={inputSx} />
          </Box>

          <TextField label="Description de l'entreprise" multiline rows={3} value={data.description}
            onChange={set("description")} placeholder="Courte description de l'entreprise, sa taille, sa localisation, etc." sx={inputSx} />

          <Divider sx={{ borderColor: C.divider }} />

          <TextField label="Produits / Services" multiline rows={3} value={data.services}
            onChange={set("services")} placeholder="Listez les principaux produits ou services gérés par le support." sx={inputSx} />

          <TextField label="Politiques de support" multiline rows={3} value={data.supportPolicies}
            onChange={set("supportPolicies")} placeholder="Objectifs SLA, heures de travail, définitions de priorité, types de tickets, etc." sx={inputSx} />

          <TextField label="Problèmes fréquents & Résolutions" multiline rows={4} value={data.commonIssues}
            onChange={set("commonIssues")} placeholder="Problèmes récurrents et leurs étapes de résolution standard. L'IA les utilise pour suggérer des solutions." sx={inputSx} />

          <TextField label="Processus d'escalade" multiline rows={2} value={data.escalationProcess}
            onChange={set("escalationProcess")} placeholder="Quand et comment escalader les tickets — qui contacter, seuils, etc." sx={inputSx} />

          <TextField label="Instructions supplémentaires pour l'IA" multiline rows={3} value={data.additionalInstructions}
            onChange={set("additionalInstructions")} placeholder="Ton, langue, ce que l'IA doit ou ne doit pas faire." sx={inputSx} />
        </Box>
      </Paper>

      {/* Preview */}
      {preview && (
        <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 3, py: 2, bgcolor: C.bgPage, borderBottom: `1px solid ${C.border}` }}>
            <AIIcon sx={{ color: C.accent, fontSize: 18 }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.85rem", color: C.textPrimary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Ce que l'IA reçoit
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: C.textSecondary, whiteSpace: "pre-wrap", lineHeight: 1.7, bgcolor: C.bgPage, border: `1px solid ${C.border}`, borderRadius: "10px", p: 2 }}>
              {preview}
            </Typography>
          </Box>
        </Paper>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={handleSave} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} sx={{ color: C.navy }} /> : <SaveIcon />}
          sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.accent, color: "#fff", borderRadius: "10px", textTransform: "none", px: 4, py: 1.2, "&:hover": { bgcolor: C.accentHover }, "&.Mui-disabled": { bgcolor: C.slate, color: C.textMuted } }}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </Box>
    </Box>
  );
}
