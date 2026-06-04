// frontend/src/pages/tickets/AdminQueue.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, CircularProgress, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { PriorityChip } from "../../components/chips/PriorityChip";
import { SLABadge } from "../../components/SLABadge";
import { EmptyState } from "../../components/EmptyState";

interface Ticket {
  _id: string;
  title: string;
  priority: string;
  category: string;
  slaDeadline: string | null;
  slaBreached: boolean;
  createdAt: string;
  createdBy: { name: string; email: string };
}

interface TeamWithLoad {
  _id: string;
  name: string;
  category: string;
  tag: string;
  color: string;
  leader?: { _id: string; name: string; email: string } | null;
  memberCount: number;
  activeTickets: number;
}

const getLoadConf = (count: number) => {
  if (count < 3)  return { text: C.success, bg: C.successBg, label: "Faible" };
  if (count < 6)  return { text: C.warning, bg: C.warningBg, label: "Moyen" };
  return            { text: C.danger,  bg: C.dangerBg,  label: "Élevé" };
};

export default function AdminQueue() {
  const navigate = useNavigate();
  const [tickets,   setTickets]   = useState<Ticket[]>([]);
  const [teams,     setTeams]     = useState<TeamWithLoad[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [assigning, setAssigning] = useState<Ticket | null>(null);
  const [teamId,    setTeamId]    = useState<string>("");
  const [saving,    setSaving]    = useState(false);

  const load = () => {
    setLoading(true);
    api.get<{ tickets: Ticket[]; teams: TeamWithLoad[] }>("/api/tickets/admin-queue")
      .then(({ tickets: t, teams: te }) => { setTickets(t); setTeams(te); })
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
      setTeams(prev => prev.map(te =>
        te._id === teamId ? { ...te, activeTickets: te.activeTickets + 1 } : te
      ));
      setAssigning(null);
      setTeamId("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const suggestTeam = (category: string) => teams.find(t => t.category === category);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
      <CircularProgress sx={{ color: C.accent }} />
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="File d'attente Admin"
        subtitle={`${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} en attente d'assignation d'équipe`}
        icon="inbox"
        actions={[{ label: "Actualiser", icon: "refresh", onClick: load, variant: "outlined" }]}
      />

      {/* ── 2-column layout ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 2.5, alignItems: "start" }}>

        {/* ── Left: tickets queue ── */}
        <Box>
          {tickets.length === 0 ? (
            <EmptyState icon="inbox" title="File vide" description="Tous les tickets ont été attribués à une équipe." />
          ) : (
            <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {/* Table header */}
              <Box sx={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr auto", gap: 1, px: 2, py: 1.2, bgcolor: C.bgPage, borderBottom: `1px solid ${C.border}` }}>
                {["Ticket", "Priorité", "Catégorie", "SLA", "Action"].map(h => (
                  <Typography key={h} sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {h}
                  </Typography>
                ))}
              </Box>

              {tickets.map((t, i) => {
                const suggested = suggestTeam(t.category);
                return (
                  <Box
                    key={t._id}
                    sx={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr auto", gap: 1, px: 2, py: 1.5, borderBottom: i < tickets.length - 1 ? `1px solid ${C.divider}` : "none", alignItems: "center", "&:hover": { bgcolor: C.bgPage } }}
                  >
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
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.accent }}>
                            Suggestion : {suggested.name}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <PriorityChip priority={t.priority} size="sm" />
                    <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: C.bgPage, display: "inline-block" }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textSecondary, textTransform: "capitalize" }}>
                        {t.category}
                      </Typography>
                    </Box>
                    <SLABadge slaDeadline={t.slaDeadline} slaBreached={t.slaBreached} status="open" />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => { setAssigning(t); setTeamId(suggested?._id ?? ""); }}
                      sx={{ bgcolor: C.accent, borderRadius: "8px", textTransform: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "12px", "&:hover": { bgcolor: C.accentHover }, whiteSpace: "nowrap" }}
                    >
                      Assigner
                    </Button>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* ── Right: team workload panel ── */}
        <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: 2, position: "sticky", top: 24 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, pb: 1.5, borderBottom: `1px solid ${C.divider}` }}>
            <Box component="i" className="ti ti-users" sx={{ fontSize: 16, color: C.accent }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 700, color: C.textPrimary }}>
              Charge des équipes
            </Typography>
          </Box>

          {teams.length === 0 ? (
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, textAlign: "center", py: 3 }}>
              Aucune équipe disponible
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {teams.map(te => {
                const load = getLoadConf(te.activeTickets);
                const pct  = Math.min((te.activeTickets / 10) * 100, 100);
                return (
                  <Box
                    key={te._id}
                    sx={{ p: 1.5, borderRadius: "10px", border: `1px solid ${C.border}`, transition: "all 0.15s", "&:hover": { borderColor: te.color, bgcolor: `${te.color}08` } }}
                  >
                    {/* Team name + count */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: te.color, flexShrink: 0 }} />
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {te.name}
                      </Typography>
                      <Box sx={{ px: 0.8, py: 0.2, borderRadius: "6px", bgcolor: load.bg, flexShrink: 0 }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: load.text }}>
                          {te.activeTickets} actif{te.activeTickets !== 1 ? "s" : ""}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Leader */}
                    {te.leader && (
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mb: 0.8 }}>
                        Leader : {te.leader.name}
                      </Typography>
                    )}

                    {/* Tag + member count */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
                      <Box sx={{ px: 0.6, py: 0.1, borderRadius: "4px", bgcolor: `${te.color}18`, border: `1px solid ${te.color}40` }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: te.color }}>
                          {te.tag}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>
                        {te.memberCount} membre{te.memberCount !== 1 ? "s" : ""}
                      </Typography>
                      <Box sx={{ ml: "auto" }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 600, color: load.text }}>
                          {load.label}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Progress bar */}
                    <Box sx={{ height: 4, borderRadius: "4px", bgcolor: C.border, overflow: "hidden" }}>
                      <Box sx={{ height: "100%", width: `${pct}%`, borderRadius: "4px", bgcolor: load.text, transition: "width 0.4s ease" }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Assign dialog ── */}
      <Dialog open={!!assigning} onClose={() => setAssigning(null)} PaperProps={{ sx: { borderRadius: "16px", minWidth: 440 } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
          Assigner à une équipe
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mb: 2 }}>
            Ticket : <b>{assigning?.title}</b>
          </Typography>
          <Select
            fullWidth size="small" value={teamId} onChange={e => setTeamId(e.target.value)}
            displayEmpty sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif" }}
          >
            <MenuItem value="" disabled>Sélectionner une équipe</MenuItem>
            {teams.map(te => {
              const load = getLoadConf(te.activeTickets);
              return (
                <MenuItem key={te._id} value={te._id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: te.color, flexShrink: 0 }} />
                    <Typography sx={{ fontFamily: "Inter, sans-serif", flex: 1 }}>{te.name}</Typography>
                    <Box sx={{ display: "flex", gap: 0.8, alignItems: "center", ml: "auto" }}>
                      <Box sx={{ px: 0.8, py: 0.2, borderRadius: "4px", bgcolor: load.bg }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: load.text }}>
                          {te.activeTickets}
                        </Typography>
                      </Box>
                      <Box sx={{ px: 0.8, py: 0.2, borderRadius: "4px", bgcolor: C.bgPage }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: C.textMuted }}>
                          {te.tag}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAssigning(null)} sx={{ textTransform: "none", fontFamily: "Inter, sans-serif", color: C.textMuted, borderRadius: "8px" }}>
            Annuler
          </Button>
          <Button
            onClick={handleAssign} disabled={!teamId || saving} variant="contained"
            sx={{ bgcolor: C.accent, textTransform: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, borderRadius: "8px", "&:hover": { bgcolor: C.accentHover } }}
          >
            {saving ? "Assignation…" : "Confirmer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
