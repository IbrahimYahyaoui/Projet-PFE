// frontend/src/pages/KnowledgeBase.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, CircularProgress, TextField, Select, MenuItem,
  Grid, InputAdornment, Chip, Paper, IconButton, Tooltip,
} from "@mui/material";
import { C } from "../theme";
import { api } from "../api";
import { getCurrentUser } from "../hooks/useAuth";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";

interface Reaction { type: string }
interface RatingInfo { average: number; count: number }

interface Article {
  _id: string;
  title: string;
  content: string;
  category: string;
  subcategory?: string;
  status?: "draft" | "published";
  tags: string[];
  views: number;
  helpful: number;
  createdBy: { name: string };
  createdAt: string;
  isFavorited?: boolean;
  userReaction?: string | null;
  reactionCounts?: { like: number; helpful: number; outdated: number };
  rating?: RatingInfo;
}

interface Suggestion { _id: string; title: string; category: string; subcategory?: string }

const CAT_COLORS: Record<string, string> = { hardware: "#EA580C", software: "#2563EB", network: "#16A34A", access: "#7C3AED", general: C.accent, other: "#64748B" };
const CAT_LABELS: Record<string, string> = { hardware: "Matériel", software: "Logiciel", network: "Réseau", access: "Accès", general: "Général", other: "Autre" };
const CAT_ICONS: Record<string, string>  = { hardware: "cpu", software: "code", network: "wifi", access: "lock", general: "books", other: "folder" };

const StarRow = ({ avg, count }: { avg: number; count: number }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
    {[1,2,3,4,5].map(s => (
      <Box key={s} component="i" className={`ti ti-star${avg >= s ? "-filled" : ""}`} sx={{ fontSize: 11, color: avg >= s ? "#F59E0B" : C.border }} />
    ))}
    {count > 0 && <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, ml: 0.3 }}>{avg}</Typography>}
  </Box>
);

export default function KnowledgeBase() {
  const navigate   = useNavigate();
  const user       = getCurrentUser();
  const canManage  = ["admin", "leader"].includes(user?.role ?? "");

  const [articles,    setArticles]    = useState<Article[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState("all");
  const [subcategory, setSubcategory] = useState("");
  const [activeTag,   setActiveTag]   = useState("");
  const [statusFilter,setStatusFilter]= useState("all");
  const [showFavorites,setShowFavorites] = useState(false);
  const [searching,   setSearching]   = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSug,     setShowSug]     = useState(false);

  const searchRef   = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subcatRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // All tags collected from loaded articles (client-side)
  const allTags = Array.from(new Set(articles.flatMap(a => a.tags)));

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (subcategory.trim()) params.set("subcategory", subcategory.trim());
    if (activeTag) params.set("tag", activeTag);
    if (canManage && statusFilter !== "all") params.set("status", statusFilter);
    return params.toString();
  }, [category, subcategory, activeTag, statusFilter, canManage]);

  const load = useCallback(() => {
    setLoading(true);
    const endpoint = showFavorites ? "/api/knowledge-base/favorites" : `/api/knowledge-base?${buildQuery()}`;
    api.get<{ articles: Article[]; total: number }>(endpoint)
      .then(r => { setArticles(r.articles ?? []); setTotal(r.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [showFavorites, buildQuery]);

  useEffect(() => { if (!search.trim()) load(); }, [load, search]);

  // Suggestion debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.trim().length < 3) { setSuggestions([]); setShowSug(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.get<Suggestion[]>(`/api/knowledge-base/suggestions?q=${encodeURIComponent(search)}`);
        setSuggestions(data ?? []);
        setShowSug((data ?? []).length > 0);
      } catch { setSuggestions([]); setShowSug(false); }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Subcategory debounce
  const handleSubcatChange = (val: string) => {
    setSubcategory(val);
    if (subcatRef.current) clearTimeout(subcatRef.current);
    subcatRef.current = setTimeout(() => load(), 500);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSug(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = async () => {
    setShowSug(false);
    if (!search.trim()) { load(); return; }
    setSearching(true);
    try {
      const r = await api.get<{ articles: Article[] }>(`/api/knowledge-base/search?q=${encodeURIComponent(search)}&category=${category}`);
      setArticles(r.articles ?? []);
      setTotal(r.articles?.length ?? 0);
    } finally { setSearching(false); }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    try {
      const r = await api.put<{ isFavorited: boolean }>(`/api/knowledge-base/${article._id}/favorite`, {});
      setArticles(prev => prev.map(a => a._id === article._id ? { ...a, isFavorited: r.isFavorited } : a));
      if (showFavorites && !r.isFavorited) setArticles(prev => prev.filter(a => a._id !== article._id));
    } catch {}
  };

  const excerpt = (content: string, max = 110) =>
    content.replace(/#+ /g, "").slice(0, max) + (content.length > max ? "…" : "");

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <PageHeader
        title="Base de connaissances"
        subtitle={`${total} article(s)`}
        icon="books"
        actions={canManage ? [{ label: "Nouvel article", icon: "plus", onClick: () => navigate("/knowledge-base/create") }] : []}
      />

      {/* Search + filters row 1 */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search with suggestion dropdown */}
        <Box ref={searchRef} sx={{ flex: 1, minWidth: 260, position: "relative" }}>
          <TextField
            fullWidth
            placeholder="Rechercher des solutions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            onFocus={() => suggestions.length > 0 && setShowSug(true)}
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box component="i" className="ti ti-search" sx={{ color: C.textMuted }} />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <Box onClick={handleSearch} sx={{ cursor: "pointer", px: 1.5, py: 0.4, bgcolor: C.accent, borderRadius: "7px" }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "#fff" }}>Chercher</Typography>
                  </Box>
                </InputAdornment>
              ),
            }}
          />
          {/* Suggestion dropdown */}
          {showSug && (
            <Paper elevation={4} sx={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 99, borderRadius: "10px", mt: 0.5, overflow: "hidden", border: `1px solid ${C.border}` }}>
              {suggestions.map(s => (
                <Box
                  key={s._id}
                  onClick={() => { setShowSug(false); navigate(`/knowledge-base/${s._id}`); }}
                  sx={{ px: 2, py: 1.2, cursor: "pointer", display: "flex", alignItems: "center", gap: 1, "&:hover": { bgcolor: C.bgPage }, borderBottom: `1px solid ${C.divider}`, "&:last-child": { borderBottom: "none" } }}
                >
                  <Box component="i" className={`ti ti-${CAT_ICONS[s.category] ?? "file"}`} sx={{ fontSize: 13, color: CAT_COLORS[s.category] ?? C.accent, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</Typography>
                    {s.subcategory && <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{s.subcategory}</Typography>}
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        {/* Category filter */}
        <Select size="small" value={category} onChange={e => { setSearch(""); setCategory(e.target.value); }} sx={{ minWidth: 160, borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>
          <MenuItem value="all">Toutes catégories</MenuItem>
          {Object.entries(CAT_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </Select>

        {/* Status filter — admin/leader only */}
        {canManage && (
          <Select size="small" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={{ minWidth: 140, borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>
            <MenuItem value="all">Tous statuts</MenuItem>
            <MenuItem value="published">Publiés</MenuItem>
            <MenuItem value="draft">Brouillons</MenuItem>
          </Select>
        )}

        {/* Favorites toggle */}
        <Tooltip title={showFavorites ? "Tous les articles" : "Mes favoris"}>
          <IconButton
            onClick={() => { setShowFavorites(f => !f); setSearch(""); }}
            sx={{ border: `1px solid ${showFavorites ? C.accent : C.border}`, borderRadius: "10px", color: showFavorites ? C.accent : C.textMuted, bgcolor: showFavorites ? C.accentLight : "transparent", "&:hover": { bgcolor: C.accentLight, borderColor: C.accent, color: C.accent } }}
          >
            <Box component="i" className={`ti ti-heart${showFavorites ? "-filled" : ""}`} sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Row 2 — subcategory + tag chips */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          placeholder="Sous-catégorie..."
          value={subcategory}
          onChange={e => handleSubcatChange(e.target.value)}
          size="small"
          sx={{ width: 200, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif", fontSize: "13px" } }}
        />
        {allTags.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
            {allTags.slice(0, 12).map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onClick={() => setActiveTag(t => t === tag ? "" : tag)}
                sx={{
                  fontFamily: "Inter, sans-serif", fontSize: "11px", cursor: "pointer",
                  bgcolor: activeTag === tag ? C.accent : C.bgPage,
                  color:   activeTag === tag ? "#fff"   : C.textMuted,
                  border: `1px solid ${activeTag === tag ? C.accent : C.border}`,
                  "&:hover": { bgcolor: activeTag === tag ? C.accentHover : C.bgHover },
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {loading || searching
        ? <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}><CircularProgress sx={{ color: C.accent }} /></Box>
        : articles.length === 0
          ? <EmptyState icon={showFavorites ? "heart" : "books"} title={showFavorites ? "Aucun favori" : "Aucun article"} description={showFavorites ? "Ajoutez des articles à vos favoris depuis la vue article." : "Aucune solution dans la base de connaissances pour le moment."} actionLabel={canManage && !showFavorites ? "Créer le premier article" : undefined} onAction={canManage && !showFavorites ? () => navigate("/knowledge-base/create") : undefined} />
          : (
            <Grid container spacing={2}>
              {articles.map(article => {
                const catColor = CAT_COLORS[article.category] ?? C.accent;
                const catLabel = CAT_LABELS[article.category] ?? article.category;
                const catIcon  = CAT_ICONS[article.category]  ?? "folder";
                const isDraft  = article.status === "draft";
                return (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={article._id}>
                    <Box
                      onClick={() => navigate(`/knowledge-base/${article._id}`)}
                      sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${isDraft ? C.warning + "55" : C.border}`, p: 2.5, cursor: "pointer", height: "100%", display: "flex", flexDirection: "column", transition: "all 0.2s", "&:hover": { boxShadow: C.shadowMd, borderColor: catColor + "66", transform: "translateY(-2px)" } }}
                    >
                      {/* Top row — category + status + heart + views */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, gap: 0.8 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, flexWrap: "wrap" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1.2, py: 0.4, borderRadius: "20px", bgcolor: catColor + "15", border: `1px solid ${catColor}33` }}>
                            <Box component="i" className={`ti ti-${catIcon}`} sx={{ fontSize: 12, color: catColor }} />
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: catColor }}>{catLabel}</Typography>
                          </Box>
                          {isDraft && (
                            <Box sx={{ px: 1, py: 0.3, borderRadius: "20px", bgcolor: C.warningBg, border: `1px solid ${C.warning}44` }}>
                              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: C.warning }}>Brouillon</Typography>
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                            <Box component="i" className="ti ti-eye" sx={{ fontSize: 12, color: C.textMuted }} />
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{article.views}</Typography>
                          </Box>
                          {/* Heart button */}
                          <Box
                            onClick={e => handleToggleFavorite(e, article)}
                            sx={{ display: "flex", alignItems: "center", cursor: "pointer", p: 0.3, borderRadius: "6px", "&:hover": { bgcolor: C.bgPage } }}
                          >
                            <Box component="i" className={`ti ti-heart${article.isFavorited ? "-filled" : ""}`} sx={{ fontSize: 14, color: article.isFavorited ? C.danger : C.textMuted }} />
                          </Box>
                        </Box>
                      </Box>

                      {/* Subcategory chip */}
                      {article.subcategory && (
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, mb: 0.5, fontStyle: "italic" }}>
                          {article.subcategory}
                        </Typography>
                      )}

                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, mb: 0.8, lineHeight: 1.4 }}>
                        {article.title}
                      </Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, flex: 1, lineHeight: 1.6, mb: 1.2 }}>
                        {excerpt(article.content)}
                      </Typography>

                      {/* Tags */}
                      {article.tags.length > 0 && (
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1 }}>
                          {article.tags.slice(0, 3).map(tag => (
                            <Chip key={tag} label={tag} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", height: 18, bgcolor: C.bgPage, color: C.textMuted }} />
                          ))}
                        </Box>
                      )}

                      {/* Reactions + rating */}
                      {(article.reactionCounts || article.rating) && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
                          {article.reactionCounts && (
                            <>
                              {article.reactionCounts.like > 0 && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                                  <Box component="i" className="ti ti-thumb-up" sx={{ fontSize: 11, color: C.accent }} />
                                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>{article.reactionCounts.like}</Typography>
                                </Box>
                              )}
                              {article.reactionCounts.helpful > 0 && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                                  <Box component="i" className="ti ti-check" sx={{ fontSize: 11, color: C.success }} />
                                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>{article.reactionCounts.helpful}</Typography>
                                </Box>
                              )}
                            </>
                          )}
                          {article.rating && article.rating.count > 0 && (
                            <StarRow avg={article.rating.average} count={article.rating.count} />
                          )}
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
