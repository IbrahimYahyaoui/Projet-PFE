// frontend/src/pages/KnowledgeBaseArticle.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, CircularProgress, Chip, Button } from "@mui/material";
import { C } from "../theme";
import { api } from "../api";
import { getCurrentUser } from "../hooks/useAuth";
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
  updatedBy?: { name: string };
  sourceTicket?: { _id: string; title: string };
  createdAt: string;
  updatedAt: string;
}

const CAT_COLORS: Record<string, string> = { hardware: "#EA580C", software: "#2563EB", network: "#16A34A", access: "#7C3AED", general: C.accent, other: "#64748B" };
const CAT_LABELS: Record<string, string> = { hardware: "Matériel", software: "Logiciel", network: "Réseau", access: "Accès", general: "Général", other: "Autre" };

// Simple markdown to HTML (bold, italic, headers, lists, code)
const renderMarkdown = (md: string) =>
  md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;margin:16px 0 6px;color:#0B162C">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:16px;font-weight:700;margin:20px 0 8px;color:#0B162C">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:18px;font-weight:700;margin:24px 0 10px;color:#0B162C">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code style="background:#F4F6FA;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>')
    .replace(/^(\d+\.) (.+)$/gm,'<li style="margin:4px 0;padding-left:4px">$2</li>')
    .replace(/^- (.+)$/gm,     '<li style="margin:4px 0;padding-left:4px">$2</li>')
    .replace(/\n/g,             '<br/>');

export default function KnowledgeBaseArticle() {
  const navigate   = useNavigate();
  const { id }     = useParams<{ id: string }>();
  const user       = getCurrentUser();
  const canManage  = ["admin","leader"].includes(user?.role ?? "");

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted,   setVoted]   = useState(false);

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

  const handleHelpful = async () => {
    if (voted || !id) return;
    try {
      const r = await api.put<{ helpful: number }>(`/api/knowledge-base/${id}/helpful`, {});
      setArticle(prev => prev ? { ...prev, helpful: r.helpful } : prev);
      setVoted(true);
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box sx={{ px: 1.2, py: 0.4, borderRadius: "20px", bgcolor: catColor + "15", border: `1px solid ${catColor}33` }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: catColor }}>{catLabel}</Typography>
            </Box>
            <Box sx={{ ml: "auto", display: "flex", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box component="i" className="ti ti-eye" sx={{ fontSize: 14, color: C.textMuted }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>{article.views} vues</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box component="i" className="ti ti-thumb-up" sx={{ fontSize: 14, color: C.textMuted }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>{article.helpful} utile</Typography>
              </Box>
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

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
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

        {/* Footer */}
        <Box sx={{ px: 4, py: 3, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={handleHelpful}
              disabled={voted}
              variant="outlined"
              startIcon={<Box component="i" className="ti ti-thumb-up" sx={{ fontSize: 16 }} />}
              sx={{ textTransform: "none", fontFamily: "Inter, sans-serif", borderColor: voted ? C.success : C.border, color: voted ? C.success : C.textMuted, borderRadius: "10px", "&:hover": { borderColor: C.success, color: C.success, bgcolor: C.successBg } }}
            >
              {voted ? "Merci !" : "Utile"} ({article.helpful})
            </Button>
          </Box>
          {canManage && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                onClick={() => navigate(`/knowledge-base/${article._id}/edit`)}
                variant="outlined"
                startIcon={<Box component="i" className="ti ti-edit" sx={{ fontSize: 15 }} />}
                sx={{ textTransform: "none", fontFamily: "Inter, sans-serif", borderColor: C.border, color: C.textMuted, borderRadius: "10px" }}
              >
                Modifier
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
