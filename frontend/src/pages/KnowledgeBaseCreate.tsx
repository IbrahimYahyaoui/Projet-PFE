// frontend/src/pages/KnowledgeBaseCreate.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, TextField, Select, MenuItem, Button, CircularProgress, Chip, InputAdornment } from "@mui/material";
import { C } from "../theme";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";

const CATEGORIES = ["hardware","software","network","access","general","other"];
const CAT_LABELS: Record<string, string> = { hardware: "Matériel", software: "Logiciel", network: "Réseau", access: "Accès", general: "Général", other: "Autre" };

export default function KnowledgeBaseCreate() {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();
  const isEdit    = !!id;

  const [title,    setTitle]    = useState("");
  const [content,  setContent]  = useState("");
  const [category, setCategory] = useState("general");
  const [tagInput, setTagInput] = useState("");
  const [tags,     setTags]     = useState<string[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(isEdit);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!isEdit) return;
    api.get<any>(`/api/knowledge-base/${id}`)
      .then(a => { setTitle(a.title); setContent(a.content); setCategory(a.category); setTags(a.tags ?? []); })
      .catch(() => setError("Article introuvable"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); }
    setTagInput("");
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { setError("Titre et contenu requis"); return; }
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await api.put(`/api/knowledge-base/${id}`, { title, content, category, tags });
      } else {
        await api.post("/api/knowledge-base", { title, content, category, tags });
      }
      navigate("/knowledge-base");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <PageHeader
        title={isEdit ? "Modifier l'article" : "Nouvel article"}
        subtitle="Base de connaissances"
        icon="edit"
        actions={[
          { label: "Annuler",   icon: "x",    onClick: () => navigate("/knowledge-base"), variant: "outlined" },
          { label: isEdit ? "Enregistrer" : "Publier", icon: "check", onClick: handleSubmit },
        ]}
      />

      {error && (
        <Box sx={{ bgcolor: C.dangerBg, border: `1px solid ${C.danger}33`, borderRadius: "10px", px: 2, py: 1.2, mb: 2 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.danger }}>{error}</Typography>
        </Box>
      )}

      <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Title */}
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.8 }}>Titre *</Typography>
          <TextField
            fullWidth
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Comment réinitialiser un mot de passe VPN..."
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" } }}
          />
        </Box>

        {/* Category */}
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.8 }}>Catégorie</Typography>
          <Select size="small" value={category} onChange={e => setCategory(e.target.value)} fullWidth sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>
            {CATEGORIES.map(c => <MenuItem key={c} value={c}>{CAT_LABELS[c]}</MenuItem>)}
          </Select>
        </Box>

        {/* Tags */}
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.8 }}>Tags</Typography>
          <TextField
            size="small"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
            placeholder="Ajouter un tag et appuyer Entrée..."
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" }, mb: 1 }}
            InputProps={{ endAdornment: <InputAdornment position="end"><Box onClick={addTag} sx={{ cursor: "pointer", px: 1, py: 0.3, bgcolor: C.accentLight, borderRadius: "6px" }}><Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.accent, fontWeight: 600 }}>+</Typography></Box></InputAdornment> }}
          />
          <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
            {tags.map(tag => (
              <Chip key={tag} label={tag} size="small" onDelete={() => setTags(prev => prev.filter(t => t !== tag))} sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", bgcolor: C.accentLight, color: C.accent, "& .MuiChip-deleteIcon": { color: C.accent } }} />
            ))}
          </Box>
        </Box>

        {/* Content */}
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.8 }}>
            Contenu * <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(Markdown supporté)</span>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={18}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`## Problème\nDécrivez le problème...\n\n## Solution\n1. Première étape\n2. Deuxième étape\n\n## Notes\nInformations complémentaires...`}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "monospace", fontSize: "13px" } }}
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            variant="contained"
            sx={{ bgcolor: C.accent, textTransform: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, borderRadius: "10px", px: 3, "&:hover": { bgcolor: C.accentHover } }}
          >
            {saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : (isEdit ? "Enregistrer" : "Publier l'article")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
