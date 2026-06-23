// frontend/src/pages/AIHistory.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Tooltip, IconButton } from "@mui/material";
import { C } from "../theme";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";

interface ConversationItem {
  _id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

interface Message {
  role: "user" | "ai";
  text: string;
}

interface ConversationDetail {
  _id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

const getRelativeDate = (date: string) => {
  const diffDays = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

export default function AIHistory() {
  const navigate = useNavigate();

  const [conversations,  setConversations]  = useState<ConversationItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [detail,         setDetail]         = useState<ConversationDetail | null>(null);
  const [detailLoading,  setDetailLoading]  = useState(false);

  useEffect(() => {
    api.get<ConversationItem[]>("/api/chat-history")
      .then(data => setConversations(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (id: string) => {
    if (selectedId === id) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await api.get<ConversationDetail>(`/api/chat-history/${id}`);
      setDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/chat-history/${id}`);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch {}
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Historique IA"
        subtitle="Vos conversations avec l'assistant TuskFlow AI"
        icon="history"
        actions={[{
          label: "Nouvelle conversation",
          icon: "plus",
          onClick: () => navigate("/ai-assistant"),
        }]}
      />

      <Box sx={{ display: "flex", gap: 2.5, height: "calc(100vh - 220px)", minHeight: 400 }}>

        {/* ── Left sidebar : liste des conversations ── */}
        <Box sx={{
          width: 300, flexShrink: 0,
          bgcolor: "#fff", borderRadius: "14px",
          border: `1px solid ${C.border}`,
          overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          {/* List header */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {loading ? "Chargement…" : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`}
            </Typography>
          </Box>

          {/* Scrollable list */}
          <Box sx={{ flex: 1, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: C.border, borderRadius: 2 } }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
                <CircularProgress size={20} sx={{ color: C.accent }} />
              </Box>
            ) : conversations.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Box component="i" className="ti ti-message-off" sx={{ fontSize: 32, color: C.textMuted, display: "block", mb: 1 }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>
                  Aucune conversation
                </Typography>
              </Box>
            ) : conversations.map(conv => (
              <Box
                key={conv._id}
                onClick={() => handleSelect(conv._id)}
                sx={{
                  px: 2, py: 1.5, cursor: "pointer",
                  bgcolor: selectedId === conv._id ? C.accentLight : "transparent",
                  borderLeft: `3px solid ${selectedId === conv._id ? C.accent : "transparent"}`,
                  borderBottom: `1px solid ${C.border}`,
                  transition: "all 0.12s",
                  "&:hover": { bgcolor: selectedId === conv._id ? C.accentLight : C.bgPage },
                  "&:hover .del-btn": { opacity: 1 },
                  "&:last-child": { borderBottom: "none" },
                  display: "flex", alignItems: "flex-start", gap: 1,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontFamily: "Inter, sans-serif", fontSize: "13px",
                    fontWeight: selectedId === conv._id ? 600 : 400,
                    color: selectedId === conv._id ? C.accent : C.textPrimary,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4,
                  }}>
                    {conv.title.length > 55 ? conv.title.slice(0, 55) + "…" : conv.title}
                  </Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mt: 0.3 }}>
                    {getRelativeDate(conv.updatedAt)}
                  </Typography>
                </Box>
                <Tooltip title="Supprimer">
                  <IconButton
                    className="del-btn"
                    size="small"
                    onClick={e => handleDelete(conv._id, e)}
                    sx={{ opacity: 0, transition: "opacity 0.15s", color: C.textMuted, flexShrink: 0, mt: -0.25, "&:hover": { color: "#DC2626", bgcolor: "rgba(220,38,38,0.08)" } }}
                  >
                    <Box component="i" className="ti ti-trash" sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Right panel : détail de la conversation ── */}
        <Box sx={{
          flex: 1, bgcolor: "#fff", borderRadius: "14px",
          border: `1px solid ${C.border}`,
          overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          {!selectedId ? (
            /* Empty state */
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
              <Box sx={{ width: 52, height: 52, borderRadius: "14px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentHover})`, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3 }}>
                <Box component="i" className="ti ti-robot" sx={{ fontSize: 26, color: "#fff" }} />
              </Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: C.textMuted }}>
                Sélectionnez une conversation
              </Typography>
            </Box>
          ) : detailLoading ? (
            <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <CircularProgress size={24} sx={{ color: C.accent }} />
            </Box>
          ) : detail ? (
            <>
              {/* Detail header */}
              <Box sx={{ px: 3, py: 1.75, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {detail.title}
                  </Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mt: 0.2 }}>
                    {new Date(detail.updatedAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" · "}{detail.messages.length} message{detail.messages.length !== 1 ? "s" : ""}
                  </Typography>
                </Box>
                <Box
                  onClick={() => navigate("/ai-assistant")}
                  sx={{ display: "flex", alignItems: "center", gap: 0.8, px: 1.5, py: 0.6, borderRadius: "8px", bgcolor: C.accent, cursor: "pointer", flexShrink: 0, transition: "background 0.15s", "&:hover": { bgcolor: C.accentHover } }}
                >
                  <Box component="i" className="ti ti-player-play" sx={{ fontSize: 13, color: "#fff" }} />
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "#fff" }}>
                    Reprendre
                  </Typography>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2.5, display: "flex", flexDirection: "column", gap: 2, "&::-webkit-scrollbar": { width: 6 }, "&::-webkit-scrollbar-thumb": { bgcolor: C.border, borderRadius: 3 } }}>
                {detail.messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <Box
                      key={i}
                      sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flexDirection: isUser ? "row-reverse" : "row", alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "78%" }}
                    >
                      {!isUser && (
                        <Box sx={{ width: 30, height: 30, borderRadius: "9px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentHover})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.3 }}>
                          <Box component="i" className="ti ti-robot" sx={{ fontSize: 14, color: "#fff" }} />
                        </Box>
                      )}
                      <Box sx={{
                        px: 2, py: 1.25,
                        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        bgcolor: isUser ? C.accent : "#fff",
                        border: !isUser ? `1px solid ${C.border}` : "none",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                      }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", lineHeight: 1.65, whiteSpace: "pre-wrap", color: isUser ? "#fff" : C.textPrimary }}>
                          {msg.text}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
