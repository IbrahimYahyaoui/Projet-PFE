// frontend/src/pages/tickets/TicketHistory.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, TextField, InputAdornment } from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";

interface HistoryEntry {
  _id: string;
  ticketId: { _id: string; title: string } | null;
  userId: { name: string; role: string };
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  created:         { label: "Ticket créé",       icon: "plus",           color: C.success },
  assigned:        { label: "Assigné",            icon: "user-check",     color: C.info },
  status_changed:  { label: "Statut modifié",     icon: "refresh",        color: C.warning },
  priority_changed:{ label: "Priorité modifiée",  icon: "arrow-up",       color: C.danger },
  commented:       { label: "Commentaire",         icon: "message",        color: "#8B5CF6" },
};

export default function TicketHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    // Get all tickets then load history for recent tickets
    api.get<{ tickets: any[] }>("/api/tickets/all")
      .then(async (res) => {
        const tickets = Array.isArray(res) ? res : (res as any).tickets ?? [];
        const recent  = tickets.slice(0, 20);
        const entries = await Promise.all(
          recent.map((t: any) =>
            api.get<HistoryEntry[]>(`/api/history/${t._id}`).catch(() => [])
          )
        );
        setHistory(entries.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(h => {
    if (!search) return true;
    return h.ticketId?.title?.toLowerCase().includes(search.toLowerCase()) ||
           h.userId?.name?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      <PageHeader title="Historique des tickets" subtitle={`${filtered.length} entrée(s)`} icon="history" />

      <TextField
        placeholder="Rechercher dans l'historique..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" } }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Box component="i" className="ti ti-search" sx={{ color: C.textMuted }} /></InputAdornment> }}
      />

      <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {filtered.length === 0
          ? <EmptyState icon="history" title="Aucun historique" />
          : filtered.map((h, i) => {
            const meta = ACTION_LABELS[h.action] ?? { label: h.action, icon: "dots", color: C.textMuted };
            return (
              <Box key={h._id} sx={{ display: "flex", alignItems: "flex-start", gap: 2, px: 2.5, py: 1.8, borderBottom: i < filtered.length - 1 ? `1px solid ${C.divider}` : "none" }}>
                {/* Icon */}
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: meta.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.3 }}>
                  <Box component="i" className={`ti ti-${meta.icon}`} sx={{ fontSize: 15, color: meta.color }} />
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>{h.userId?.name ?? "Système"}</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>{meta.label}</Typography>
                    {h.ticketId && (
                      <Typography
                        onClick={() => navigate(`/tickets/${h.ticketId?._id}`)}
                        sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.accent, cursor: "pointer", fontWeight: 500, "&:hover": { textDecoration: "underline" } }}
                      >
                        {h.ticketId.title}
                      </Typography>
                    )}
                  </Box>
                  {(h.oldValue || h.newValue) && (
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, mt: 0.3 }}>
                      {h.oldValue && <span style={{ textDecoration: "line-through" }}>{h.oldValue}</span>}
                      {h.oldValue && h.newValue && " → "}
                      {h.newValue && <b>{h.newValue}</b>}
                    </Typography>
                  )}
                </Box>

                {/* Time */}
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, flexShrink: 0 }}>
                  {new Date(h.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </Typography>
              </Box>
            );
          })
        }
      </Box>
    </Box>
  );
}
