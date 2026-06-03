// frontend/src/pages/KnowledgeBase.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, TextField, Select, MenuItem, Grid, InputAdornment, Chip } from "@mui/material";
import { C } from "../theme";
import { api } from "../api";
import { getCurrentUser } from "../hooks/useAuth";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";

interface Article {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  createdBy: { name: string };
  createdAt: string;
}

const CAT_COLORS: Record<string, string> = { hardware: "#EA580C", software: "#2563EB", network: "#16A34A", access: "#7C3AED", general: C.accent, other: "#64748B" };
const CAT_LABELS: Record<string, string> = { hardware: "Matériel", software: "Logiciel", network: "Réseau", access: "Accès", general: "Général", other: "Autre" };
const CAT_ICONS: Record<string, string>  = { hardware: "cpu", software: "code", network: "wifi", access: "lock", general: "books", other: "folder" };

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const user     = getCurrentUser();
  const canManage = ["admin","leader"].includes(user?.role ?? "");

  const [articles, setArticles] = useState<Article[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("all");
  const [searching, setSearching] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get<{ articles: Article[]; total: number }>(`/api/knowledge-base?category=${category}`)
      .then(r => { setArticles(r.articles ?? []); setTotal(r.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = async () => {
    if (!search.trim()) { load(); return; }
    setSearching(true);
    try {
      const r = await api.get<{ articles: Article[] }>(`/api/knowledge-base/search?q=${encodeURIComponent(search)}&category=${category}`);
      setArticles(r.articles ?? []);
      setTotal(r.articles?.length ?? 0);
    } finally {
      setSearching(false);
    }
  };

  const excerpt = (content: string, max = 120) =>
    content.replace(/#+ /g, "").slice(0, max) + (content.length > max ? "…" : "");

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <PageHeader
        title="Base de connaissances"
        subtitle={`${total} article(s)`}
        icon="books"
        actions={canManage ? [{ label: "Nouvel article", icon: "plus", onClick: () => navigate("/knowledge-base/create") }] : []}
      />

      {/* Search + filter */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Rechercher des solutions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          size="small"
          sx={{ flex: 1, minWidth: 260, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Box component="i" className="ti ti-search" sx={{ color: C.textMuted }} /></InputAdornment>,
            endAdornment: search && (
              <InputAdornment position="end">
                <Box onClick={handleSearch} sx={{ cursor: "pointer", px: 1.5, py: 0.4, bgcolor: C.accent, borderRadius: "7px" }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "#fff" }}>Chercher</Typography>
                </Box>
              </InputAdornment>
            ),
          }}
        />
        <Select size="small" value={category} onChange={e => { setSearch(""); setCategory(e.target.value); }} sx={{ minWidth: 160, borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>
          <MenuItem value="all">Toutes catégories</MenuItem>
          {Object.entries(CAT_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </Select>
      </Box>

      {loading || searching
        ? <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}><CircularProgress sx={{ color: C.accent }} /></Box>
        : articles.length === 0
          ? <EmptyState icon="books" title="Aucun article" description="Aucune solution dans la base de connaissances pour le moment." actionLabel={canManage ? "Créer le premier article" : undefined} onAction={canManage ? () => navigate("/knowledge-base/create") : undefined} />
          : (
            <Grid container spacing={2}>
              {articles.map(article => {
                const catColor = CAT_COLORS[article.category] ?? C.accent;
                const catLabel = CAT_LABELS[article.category] ?? article.category;
                const catIcon  = CAT_ICONS[article.category]  ?? "folder";
                return (
                  <Grid item xs={12} sm={6} lg={4} key={article._id}>
                    <Box
                      onClick={() => navigate(`/knowledge-base/${article._id}`)}
                      sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: 2.5, cursor: "pointer", height: "100%", display: "flex", flexDirection: "column", transition: "all 0.2s", "&:hover": { boxShadow: C.shadowMd, borderColor: catColor + "66", transform: "translateY(-2px)" } }}
                    >
                      {/* Category badge */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, px: 1.2, py: 0.4, borderRadius: "20px", bgcolor: catColor + "15", border: `1px solid ${catColor}33` }}>
                          <Box component="i" className={`ti ti-${catIcon}`} sx={{ fontSize: 13, color: catColor }} />
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: catColor }}>{catLabel}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                            <Box component="i" className="ti ti-eye" sx={{ fontSize: 12, color: C.textMuted }} />
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{article.views}</Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                            <Box component="i" className="ti ti-thumb-up" sx={{ fontSize: 12, color: C.textMuted }} />
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{article.helpful}</Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, mb: 1, lineHeight: 1.4 }}>
                        {article.title}
                      </Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, flex: 1, lineHeight: 1.6, mb: 1.5 }}>
                        {excerpt(article.content)}
                      </Typography>

                      {/* Tags */}
                      {article.tags.length > 0 && (
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1.5 }}>
                          {article.tags.slice(0, 3).map(tag => (
                            <Chip key={tag} label={tag} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", height: 20, bgcolor: C.bgPage, color: C.textMuted }} />
                          ))}
                        </Box>
                      )}

                      {/* Footer */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.divider}`, pt: 1.2 }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{article.createdBy?.name}</Typography>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{new Date(article.createdAt).toLocaleDateString("fr-FR")}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )
      }
    </Box>
  );
}
