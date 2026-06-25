// frontend/src/pages/KnowledgeBaseCreate.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Typography, TextField, Select, MenuItem, Button, CircularProgress,
  Chip, InputAdornment, FormGroup, FormControlLabel, Checkbox,
} from "@mui/material";
import { C } from "../theme";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";

const CATEGORIES = ["hardware","software","network","access","general","other"];
const CAT_LABELS: Record<string, string> = { hardware: "Matériel", software: "Logiciel", network: "Réseau", access: "Accès", general: "Général", other: "Autre" };
const ALL_ROLES = ["admin","leader","tech","user"] as const;
const ROLE_LABELS: Record<string, string> = { admin: "Administrateur", leader: "Leader", tech: "Technicien", user: "Utilisateur" };
// Mêmes catégories que team.js (backend/schemas/team.js)
const EXPERTISE_OPTIONS = [
  { value: "hardware", label: "Matériel" },
  { value: "software", label: "Logiciel" },
  { value: "network",  label: "Réseau" },
  { value: "security", label: "Sécurité" },
  { value: "support",  label: "Support" },
  { value: "other",    label: "Autre" },
];

interface Team { _id: string; name: string; tag: string }

export default function KnowledgeBaseCreate() {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();
  const isEdit    = !!id;

  const [title,       setTitle]       = useState("");
  const [content,     setContent]     = useState("");
  const [category,    setCategory]    = useState("general");
  const [subcategory, setSubcategory] = useState("");
  const [tagInput,    setTagInput]    = useState("");
  const [tags,        setTags]        = useState<string[]>([]);
  const [status,      setStatus]      = useState<"draft"|"published">("published");
  const [visRoles,    setVisRoles]    = useState<string[]>(["admin","leader","tech","user"]);
  const [visTeamIds,  setVisTeamIds]  = useState<string[]>([]);
  const [visExpertise, setVisExpertise] = useState<string[]>([]);
  const [teams,       setTeams]       = useState<Team[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(isEdit);
  const [error,       setError]       = useState("");

  // Load teams for visibility selector
  useEffect(() => {
    api.get<Team[]>("/api/team/all").then(setTeams).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get<any>(`/api/knowledge-base/${id}`)
      .then(a => {
        setTitle(a.title);
        setContent(a.content);
        setCategory(a.category);
        setSubcategory(a.subcategory ?? "");
        setTags(a.tags ?? []);
        setStatus(a.status ?? "published");
        setVisRoles(a.visibility?.roles ?? ["admin","leader","tech","user"]);
        setVisTeamIds((a.visibility?.teamIds ?? []).map((t: any) => t._id ?? t));
        setVisExpertise(a.visibility?.expertise ?? []);
      })
      .catch(() => setError("Article introuvable"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  const toggleRole = (role: string) => {
    setVisRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { setError("Titre et contenu requis"); return; }
    setSaving(true);
    setError("");
    const body = {
      title, content, category, subcategory: subcategory.trim(), tags, status,
      visibility: { roles: visRoles, teamIds: visTeamIds, expertise: visExpertise },
    };
    try {
      if (isEdit) {
        await api.put(`/api/knowledge-base/${id}`, body);
      } else {
        await api.post("/api/knowledge-base", body);
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
            fullWidth value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Comment réinitialiser un mot de passe VPN..."
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" } }}
          />
        </Box>

        {/* Category + Subcategory row */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.8 }}>Catégorie</Typography>
            <Select size="small" value={category} onChange={e => setCategory(e.target.value)} fullWidth sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{CAT_LABELS[c]}</MenuItem>)}
            </Select>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.8 }}>Sous-catégorie</Typography>
            <TextField
              fullWidth value={subcategory} onChange={e => setSubcategory(e.target.value)}
              placeholder="Ex: Authentification, VPN, Imprimante..."
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" } }}
            />
          </Box>
        </Box>

        {/* Status */}
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.8 }}>Statut</Typography>
          <Select size="small" value={status} onChange={e => setStatus(e.target.value as any)} sx={{ minWidth: 180, borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>
            <MenuItem value="published">Publié</MenuItem>
            <MenuItem value="draft">Brouillon</MenuItem>
          </Select>
        </Box>

        {/* Tags */}
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.8 }}>Tags</Typography>
          <TextField
            size="small" value={tagInput}
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

        {/* Visibility */}
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>Visibilité — Rôles</Typography>
          <FormGroup row sx={{ gap: 1 }}>
            {ALL_ROLES.map(role => (
              <FormControlLabel
                key={role}
                control={
                  <Checkbox
                    checked={visRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    size="small"
                    sx={{ color: C.textMuted, "&.Mui-checked": { color: C.accent } }}
                  />
                }
                label={<Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textSecondary }}>{ROLE_LABELS[role]}</Typography>}
              />
            ))}
          </FormGroup>
        </Box>

        {/* Visibility — Teams */}
        {teams.length > 0 && (
          <Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
              Visibilité — Équipes
            </Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mb: 1 }}>
              Laisser vide = toutes les équipes éligibles
            </Typography>
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
              {teams.map(team => {
                const selected = visTeamIds.includes(team._id);
                return (
                  <Chip
                    key={team._id}
                    label={`${team.name} [${team.tag}]`}
                    size="small"
                    onClick={() => setVisTeamIds(prev => selected ? prev.filter(t => t !== team._id) : [...prev, team._id])}
                    sx={{
                      fontFamily: "Inter, sans-serif", fontSize: "12px", cursor: "pointer",
                      bgcolor: selected ? C.accent : C.bgPage,
                      color:   selected ? "#fff"   : C.textMuted,
                      border: `1px solid ${selected ? C.accent : C.border}`,
                      "&:hover": { bgcolor: selected ? C.accentHover : C.bgHover },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Visibility — Expertise (technicien uniquement) */}
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
            Visibilité — Domaines d'expertise (technicien)
          </Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mb: 1 }}>
            Laisser vide = tous les domaines d'expertise éligibles
          </Typography>
          <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
            {EXPERTISE_OPTIONS.map(opt => {
              const selected = visExpertise.includes(opt.value);
              return (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  size="small"
                  onClick={() => setVisExpertise(prev => selected ? prev.filter(e => e !== opt.value) : [...prev, opt.value])}
                  sx={{
                    fontFamily: "Inter, sans-serif", fontSize: "12px", cursor: "pointer",
                    bgcolor: selected ? C.accent : C.bgPage,
                    color:   selected ? "#fff"   : C.textMuted,
                    border: `1px solid ${selected ? C.accent : C.border}`,
                    "&:hover": { bgcolor: selected ? C.accentHover : C.bgHover },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Content */}
        <Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.8 }}>
            Contenu * <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(Markdown supporté)</span>
          </Typography>
          <TextField
            fullWidth multiline rows={18} value={content}
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
