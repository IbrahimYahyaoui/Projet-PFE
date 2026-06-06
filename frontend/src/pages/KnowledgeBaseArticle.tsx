// frontend/src/pages/KnowledgeBaseArticle.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, CircularProgress, Chip, Button, TextField, Tooltip, IconButton } from "@mui/material";
import { C } from "../theme";
import { api } from "../api";
import { getCurrentUser } from "../hooks/useAuth";
import { EmptyState } from "../components/EmptyState";

interface Comment {
  _id: string;
  content: string;
  userId: { _id: string; name: string; role?: string };
  createdAt: string;
}

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
  updatedBy?: { name: string };
  sourceTicket?: { _id: string; title: string };
  createdAt: string;
  updatedAt: string;
  isFavorited?: boolean;
  userReaction?: string | null;
  reactionCounts?: { like: number; helpful: number; outdated: number };
  rating?: { average: number; count: number };
  comments?: Comment[];
}

const CAT_COLORS: Record<string, string> = { hardware: "#EA580C", software: "#2563EB", network: "#16A34A", access: "#7C3AED", general: C.accent, other: "#64748B" };
const CAT_LABELS: Record<string, string> = { hardware: "Matériel", software: "Logiciel", network: "Réseau", access: "Accès", general: "Général", other: "Autre" };

const renderMarkdown = (md: string) =>
  md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;margin:16px 0 6px;color:#0B162C">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:16px;font-weight:700;margin:20px 0 8px;color:#0B162C">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:18px;font-weight:700;margin:24px 0 10px;color:#0B162C">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code style="background:#F4F6FA;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>')
    .replace(/^(\d+\.) (.+)$/gm,'<li style="margin:4px 0;padding-left:4px">$2</li>')
    .replace(/^- (.+)$/gm,     '<li style="margin:4px 0;padding-left:4px">$1</li>')
    .replace(/\n/g,             '<br/>');

const REACTION_CONFIG = [
  { type: "like",     icon: "thumb-up",   label: "J'aime",  activeColor: C.accent },
  { type: "helpful",  icon: "check",      label: "Utile",   activeColor: C.success },
  { type: "outdated", icon: "clock-off",  label: "Obsolète",activeColor: C.warning },
] as const;

const StarRating = ({ current, onRate }: { current: number; onRate: (s: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      {[1,2,3,4,5].map(s => (
        <Box
          key={s}
          component="i"
          className={`ti ti-star${(hover || current) >= s ? "-filled" : ""}`}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onRate(s)}
          sx={{ fontSize: 22, cursor: "pointer", color: (hover || current) >= s ? "#F59E0B" : C.border, transition: "color 0.15s" }}
        />
      ))}
    </Box>
  );
};

export default function KnowledgeBaseArticle() {
  const navigate   = useNavigate();
  const { id }     = useParams<{ id: string }>();
  const user       = getCurrentUser();
  const canManage  = ["admin", "leader"].includes(user?.role ?? "");
  const isAdmin    = user?.role === "admin";

  const [article,     setArticle]     = useState<Article | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [userRating,  setUserRating]  = useState(0);
  const [ratingDone,  setRatingDone]  = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commenting,  setCommenting]  = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<Article>(`/api/knowledge-base/${id}`),
      api.put(`/api/knowledge-base/${id}/view`, {}),
    ])
      .then(([a]) => setArticle(a))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!id) return;
    try {
      const r = await api.put<{ isFavorited: boolean }>(`/api/knowledge-base/${id}/favorite`, {});
      setArticle(prev => prev ? { ...prev, isFavorited: r.isFavorited } : prev);
    } catch {}
  };

  const handleReact = async (type: string) => {
    if (!id) return;
    try {
      const r = await api.put<Article>(`/api/knowledge-base/${id}/react`, { type });
      setArticle(prev => prev ? { ...prev, userReaction: r.userReaction, reactionCounts: r.reactionCounts } : prev);
    } catch {}
  };

  const handleRate = async (score: number) => {
    if (!id || ratingDone) return;
    try {
      const r = await api.post<{ average: number; count: number; userScore: number }>(`/api/knowledge-base/${id}/rate`, { score });
      setUserRating(r.userScore);
      setRatingDone(true);
      setArticle(prev => prev ? { ...prev, rating: { average: r.average, count: r.count } } : prev);
    } catch {}
  };

  const handleAddComment = async () => {
    if (!id || !commentText.trim()) return;
    setCommenting(true);
    try {
      const c = await api.post<Comment>(`/api/knowledge-base/${id}/comments`, { content: commentText.trim() });
      setArticle(prev => prev ? { ...prev, comments: [...(prev.comments ?? []), c] } : prev);
      setCommentText("");
    } catch {} finally { setCommenting(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    try {
      await api.delete(`/api/knowledge-base/${id}/comments/${commentId}`);
      setArticle(prev => prev ? { ...prev, comments: (prev.comments ?? []).filter(c => c._id !== commentId) } : prev);
    } catch {}
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;
  if (!article) return <EmptyState icon="books" title="Article introuvable" />;

  const catColor = CAT_COLORS[article.category] ?? C.accent;
  const catLabel = CAT_LABELS[article.category] ?? article.category;

  return (
    <Box sx={{ p: 3, maxWidth: 860, mx: "auto" }}>
      {/* Breadcrumb */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
        <Typography onClick={() => navigate("/knowledge-base")} sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.accent, cursor: "pointer", fontWeight: 500 }}>
          Base de connaissances
        </Typography>
        <Box component="i" className="ti ti-chevron-right" sx={{ fontSize: 12, color: C.textMuted }} />
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>
          {article.title}
        </Typography>
      </Box>

      <Box sx={{ bgcolor: "#fff", borderRadius: "16px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {/* Header */}
        <Box sx={{ px: 4, pt: 4, pb: 3, borderBottom: `1px solid ${C.border}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
            {/* Category badge */}
            <Box sx={{ px: 1.2, py: 0.4, borderRadius: "20px", bgcolor: catColor + "15", border: `1px solid ${catColor}33` }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: catColor }}>{catLabel}</Typography>
            </Box>
            {/* Subcategory chip */}
            {article.subcategory && (
              <Chip label={article.subcategory} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", bgcolor: C.bgPage, color: C.textMuted }} />
            )}
            {/* Draft badge */}
            {article.status === "draft" && (
              <Box sx={{ px: 1.2, py: 0.4, borderRadius: "20px", bgcolor: C.warningBg, border: `1px solid ${C.warning}44` }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.warning }}>Brouillon</Typography>
              </Box>
            )}

            {/* Right: views + favorite */}
            <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box component="i" className="ti ti-eye" sx={{ fontSize: 14, color: C.textMuted }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>{article.views} vues</Typography>
              </Box>
              {/* Favorite button */}
              <Tooltip title={article.isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}>
                <IconButton onClick={handleToggleFavorite} size="small" sx={{ color: article.isFavorited ? C.danger : C.textMuted, "&:hover": { color: C.danger, bgcolor: "rgba(239,68,68,0.08)" } }}>
                  <Box component="i" className={`ti ti-heart${article.isFavorited ? "-filled" : ""}`} sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "22px", fontWeight: 800, color: C.textPrimary, lineHeight: 1.3, mb: 2 }}>
            {article.title}
          </Typography>

          {article.tags.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mb: 2 }}>
              {article.tags.map(tag => (
                <Chip key={tag} label={tag} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", bgcolor: C.bgPage, color: C.textMuted }} />
              ))}
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>
              Par <b>{article.createdBy?.name}</b> · {new Date(article.createdAt).toLocaleDateString("fr-FR")}
            </Typography>
            {article.updatedBy && (
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>
                · Mis à jour par <b>{article.updatedBy.name}</b>
              </Typography>
            )}
            {article.sourceTicket && (
              <Box onClick={() => navigate(`/tickets/${article.sourceTicket?._id}`)} sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", "&:hover": { color: C.accent } }}>
                <Box component="i" className="ti ti-ticket" sx={{ fontSize: 13, color: C.accent }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.accent }}>Ticket source</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Content */}
        <Box
          sx={{ px: 4, py: 3, fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.8, color: C.textSecondary, "& h1,& h2,& h3": { fontFamily: "Inter, sans-serif" } }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
        />

        {/* ── Rating section ── */}
        <Box sx={{ px: 4, py: 3, borderTop: `1px solid ${C.border}` }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 700, color: C.textPrimary, mb: 1.5 }}>
            Évaluer cet article
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <StarRating current={userRating} onRate={handleRate} />
            {article.rating && article.rating.count > 0 && (
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>
                {article.rating.average} / 5 · {article.rating.count} avis
              </Typography>
            )}
            {ratingDone && (
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.success }}>
                Merci pour votre avis !
              </Typography>
            )}
          </Box>
        </Box>

        {/* ── Reactions section ── */}
        <Box sx={{ px: 4, py: 3, borderTop: `1px solid ${C.border}` }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 700, color: C.textPrimary, mb: 1.5 }}>
            Réactions
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            {REACTION_CONFIG.map(({ type, icon, label, activeColor }) => {
              const isActive = article.userReaction === type;
              const count    = article.reactionCounts?.[type as keyof typeof article.reactionCounts] ?? 0;
              return (
                <Button
                  key={type}
                  onClick={() => handleReact(type)}
                  variant="outlined"
                  startIcon={<Box component="i" className={`ti ti-${icon}`} sx={{ fontSize: 15 }} />}
                  sx={{
                    textTransform: "none", fontFamily: "Inter, sans-serif", fontSize: "13px", borderRadius: "10px",
                    borderColor: isActive ? activeColor : C.border,
                    color:       isActive ? activeColor : C.textMuted,
                    bgcolor:     isActive ? activeColor + "12" : "transparent",
                    "&:hover": { borderColor: activeColor, color: activeColor, bgcolor: activeColor + "12" },
                  }}
                >
                  {label}{count > 0 ? ` (${count})` : ""}
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* ── Comments section ── */}
        <Box sx={{ px: 4, py: 3, borderTop: `1px solid ${C.border}` }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 700, color: C.textPrimary, mb: 2 }}>
            Commentaires ({article.comments?.length ?? 0})
          </Typography>

          {/* Comment list */}
          {(article.comments ?? []).length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2.5 }}>
              {(article.comments ?? []).map(comment => {
                const isOwn = comment.userId?._id === user?.id || (comment.userId as any)?.toString?.() === user?.id;
                const canDelete = isAdmin || isOwn;
                return (
                  <Box key={comment._id} sx={{ bgcolor: C.bgPage, borderRadius: "10px", px: 2, py: 1.5, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: C.accentLight, border: `1px solid ${C.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.accent }}>
                        {comment.userId?.name?.[0]?.toUpperCase() ?? "?"}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textPrimary }}>{comment.userId?.name ?? "Utilisateur"}</Typography>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{new Date(comment.createdAt).toLocaleDateString("fr-FR")}</Typography>
                      </Box>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textSecondary, lineHeight: 1.5 }}>{comment.content}</Typography>
                    </Box>
                    {canDelete && (
                      <Tooltip title="Supprimer">
                        <IconButton size="small" onClick={() => handleDeleteComment(comment._id)} sx={{ color: C.textMuted, "&:hover": { color: C.danger, bgcolor: C.dangerBg } }}>
                          <Box component="i" className="ti ti-trash" sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Add comment */}
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Ajouter un commentaire..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif", fontSize: "13px" } }}
            />
            <Button
              onClick={handleAddComment}
              disabled={commenting || !commentText.trim()}
              variant="contained"
              sx={{ bgcolor: C.accent, textTransform: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, borderRadius: "10px", px: 2.5, alignSelf: "flex-end", flexShrink: 0, "&:hover": { bgcolor: C.accentHover } }}
            >
              {commenting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Envoyer"}
            </Button>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ px: 4, py: 2.5, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          {canManage && (
            <Button
              onClick={() => navigate(`/knowledge-base/${article._id}/edit`)}
              variant="outlined"
              startIcon={<Box component="i" className="ti ti-edit" sx={{ fontSize: 15 }} />}
              sx={{ textTransform: "none", fontFamily: "Inter, sans-serif", borderColor: C.border, color: C.textMuted, borderRadius: "10px" }}
            >
              Modifier
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
