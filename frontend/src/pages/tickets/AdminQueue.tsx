// frontend/src/pages/tickets/AdminQueue.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { PriorityChip } from "../../components/chips/PriorityChip";
import { SLABadge } from "../../components/SLABadge";
import { EmptyState } from "../../components/EmptyState";

interface Ticket {
  _id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  slaDeadline: string | null;
  slaBreached: boolean;
  createdAt: string;
  createdBy: { name: string; email: string };
}

interface Team {
  _id: string;
  name: string;
  category: string;
  tag: string;
  color: string;
}

export default function AdminQueue() {
  const navigate = useNavigate();
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [teams,    setTeams]    = useState<Team[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [assigning, setAssigning] = useState<Ticket | null>(null);
  const [teamId,   setTeamId]   = useState<string>("");
  const [saving,   setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Ticket[]>("/api/tickets/admin-queue"),
      api.get<Team[]>("/api/team/all"),
    ])
      .then(([t, te]) => { setTickets(t); setTeams(te); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAssign = async () => {
    if (!assigning || !teamId) return;
    setSaving(true);
    try {
      await api.put(`/api/tickets/${assigning._id}/assign-team`, { teamId });
      setTickets(prev => prev.filter(t => t._id !== assigning._id));
      setAssigning(null);
      setTeamId("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const suggestTeam = (category: string) => teams.find(t => t.category === category);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <PageHeader
        title="File d'attente Admin"
        subtitle={`${tickets.length} ticket(s) en attente d'assignation d'équipe`}
        icon="inbox"
        actions={[{ label: "Actualiser", icon: "refresh", onClick: load, variant: "outlined" }]}
      />

      {tickets.length === 0
        ? <EmptyState icon="inbox" title="File vide" description="Tous les tickets ont été attribués à une équipe." />
        : (
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {/* Header */}
            <Box sx={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr auto", gap: 1, px: 2, py: 1.2, bgcolor: C.bgPage, borderBottom: `1px solid ${C.border}` }}>
              {["Ticket","Priorité","Catégorie","SLA","Action"].map(h => (
                <Typography key={h} sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</Typography>
              ))}
            </Box>

            {tickets.map((t, i) => {
              const suggested = suggestTeam(t.category);
              return (
                <Box key={t._id} sx={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr auto", gap: 1, px: 2, py: 1.5, borderBottom: i < tickets.length - 1 ? `1px solid ${C.divider}` : "none", alignItems: "center", "&:hover": { bgcolor: C.bgPage } }}>
                  <Box>
                    <Typography
                      onClick={() => navigate(`/tickets/${t._id}`)}
                      sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, cursor: "pointer", "&:hover": { color: C.accent }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {t.title}
                    </Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>
                      {t.createdBy?.name} · {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                    </Typography>
                    {suggested && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.4 }}>
                        <Box component="i" className="ti ti-sparkles" sx={{ fontSize: 12, color: C.accent }} />
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.accent }}>Suggestion : {suggested.name}</Typography>
                      </Box>
                    )}
                  </Box>
                  <PriorityChip priority={t.priority} size="sm" />
                  <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: C.bgPage, display: "inline-block" }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textSecondary }}>{t.category}</Typography>
                  </Box>
                  <SLABadge slaDeadline={t.slaDeadline} slaBreached={t.slaBreached} status="open" />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => { setAssigning(t); setTeamId(suggested?._id ?? ""); }}
                    sx={{ bgcolor: C.accent, borderRadius: "8px", textTransform: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, "&:hover": { bgcolor: C.accentHover }, whiteSpace: "nowrap" }}
                  >
                    Assigner
                  </Button>
                </Box>
              );
            })}
          </Box>
        )
      }

      {/* Assign dialog */}
      <Dialog open={!!assigning} onClose={() => setAssigning(null)} PaperProps={{ sx: { borderRadius: "16px", minWidth: 420 } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
          Assigner à une équipe
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mb: 2 }}>
            Ticket : <b>{assigning?.title}</b>
          </Typography>
          <Select
            fullWidth
            size="small"
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            displayEmpty
            sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif" }}
          >
            <MenuItem value="" disabled>Sélectionner une équipe</MenuItem>
            {teams.map(te => (
              <MenuItem key={te._id} value={te._id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: te.color }} />
                  <span>{te.name}</span>
                  <Box sx={{ ml: "auto", px: 1, py: 0.2, borderRadius: "4px", bgcolor: C.bgPage }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: C.textMuted }}>{te.tag}</Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssigning(null)} sx={{ textTransform: "none", fontFamily: "Inter, sans-serif", color: C.textMuted }}>Annuler</Button>
          <Button onClick={handleAssign} disabled={!teamId || saving} variant="contained"
            sx={{ bgcolor: C.accent, textTransform: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, borderRadius: "8px", "&:hover": { bgcolor: C.accentHover } }}>
            {saving ? "Assignation…" : "Confirmer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
