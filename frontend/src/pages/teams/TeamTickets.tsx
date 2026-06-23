// frontend/src/pages/teams/TeamTickets.tsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Box, Typography, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem,
} from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { TicketTable, type TicketRow } from "../../components/TicketTable";
import { WorkloadBar } from "../../components/WorkloadBar";

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

interface WorkloadMember {
  _id: string;
  name: string;
  email: string;
  active: number;
  assigned: number;
  chargePercent: number;
  availability: "available" | "busy" | "overloaded";
}

export default function TeamTickets() {
  const location = useLocation();
  const searchFromNav = (location.state as any)?.search ?? "";
  const storedUser  = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isLeader    = currentUser?.role === "leader";

  const [tickets,    setTickets]    = useState<TicketRow[]>([]);
  const [teamId,     setTeamId]     = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [assigning,  setAssigning]  = useState<TicketRow | null>(null);
  const [workload,   setWorkload]   = useState<WorkloadMember[]>([]);
  const [techId,     setTechId]     = useState("");
  const [wlLoading,  setWlLoading]  = useState(false);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<TicketRow[]>("/api/team/my/tickets"),
      api.get<{ team: { _id: string } }>("/api/team/my"),
    ]).then(([tix, teamData]) => {
      setTickets(Array.isArray(tix) ? tix : []);
      setTeamId(teamData.team._id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (ticket: TicketRow, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/tickets/${ticket._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, status: newStatus } : t));
    } catch (err) { console.error("Erreur changement statut:", err); }
  };

  const openAssign = (ticket: TicketRow) => {
    setAssigning(ticket);
    setTechId("");
    if (!teamId) return;
    setWlLoading(true);
    api.get<{ members: WorkloadMember[] }>(`/api/team/${teamId}/workload`)
      .then(d => setWorkload(d.members))
      .catch(console.error)
      .finally(() => setWlLoading(false));
  };

  const handleAssign = async () => {
    if (!assigning || !techId) return;
    setSaving(true);
    try {
      await api.put(`/api/tickets/${assigning._id}/assign`, { assignedTo: techId });
      setTickets(prev => prev.map(t =>
        t._id === assigning._id ? { ...t, status: "assigned" } : t
      ));
      setAssigning(null);
    } catch (err: any) {
      alert(err.message ?? "Erreur lors de l'assignation");
    } finally {
      setSaving(false);
    }
  };

  const inProgress = tickets.filter(t => t.status === "in_progress").length;
  const pending    = tickets.filter(t => t.status === "assigned").length;
  const resolved   = tickets.filter(t => t.status === "resolved").length;

  const actions = isLeader
    ? [{
        icon:    "user-check",
        label:   "Assigner",
        color:   C.accent,
        hoverBg: C.accentLight,
        show:    (t: TicketRow) => t.status === "assigned",
        onClick: openAssign,
      }]
    : [];

  return (
    <Box sx={{ p: 3, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color={C.navy} fontFamily="Inter, sans-serif" sx={{ letterSpacing: "-0.3px" }}>
          Tickets de l'équipe
        </Typography>
        <Typography variant="body2" color={C.textMuted} mt={0.3} fontFamily="Inter, sans-serif">
          Tous les tickets assignés à votre équipe — {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
        {[
          { label: "Total équipe",  value: tickets.length, color: C.navy    },
          { label: "En attente",    value: pending,        color: C.info    },
          { label: "En cours",      value: inProgress,     color: C.accent  },
          { label: "Résolus",       value: resolved,       color: C.success },
        ].map(s => (
          <Box key={s.label} sx={{ bgcolor: C.card, borderRadius: "12px", border: `1px solid ${C.border}`, p: 2.5, transition: "all 0.2s", "&:hover": { transform: "translateY(-2px)", boxShadow: C.shadowMd, borderColor: C.accent } }}>
            <Typography fontSize={11} fontWeight={600} color={C.textMuted} fontFamily="Inter, sans-serif" sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: 1 }}>
              {s.label}
            </Typography>
            <Typography fontSize={28} fontWeight={700} color={s.color} fontFamily="Inter, sans-serif" sx={{ letterSpacing: "-0.5px" }}>
              {s.value}
            </Typography>
          </Box>
        ))}
      </Box>

      <TicketTable
        tickets={tickets}
        loading={loading}
        columns={["title", "status", "priority", "category", "assignedTo", "sla", "date"]}
        actions={actions}
        emptyIcon="ticket"
        emptyTitle="Aucun ticket"
        emptyDescription="Aucun ticket n'est assigné à votre équipe pour le moment."
        onStatusChange={handleStatusChange}
        currentUserId={currentUser?.id ?? currentUser?._id}
        currentUserRole={currentUser?.role}
        initialSearch={searchFromNav}
      />

      {/* ── Assign dialog ── */}
      <Dialog open={!!assigning} onClose={() => setAssigning(null)} PaperProps={{ sx: { borderRadius: "16px", minWidth: 460 } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
          Assigner à un technicien
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mb: 2 }}>
            Ticket : <b>{assigning?.title}</b>
          </Typography>

          {wlLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} sx={{ color: C.accent }} />
            </Box>
          ) : (
            <>
              <Select
                fullWidth size="small" value={techId} onChange={e => setTechId(e.target.value)}
                displayEmpty sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif", mb: 2 }}
              >
                <MenuItem value="" disabled>Sélectionner un technicien</MenuItem>
                {workload.map(m => (
                  <MenuItem key={m._id} value={m._id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", flex: 1 }}>{m.name}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>
                        {m.active} actif{m.active !== 1 ? "s" : ""}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>

              {/* Workload bars */}
              {workload.length > 0 && (
                <Box sx={{ bgcolor: C.bgPage, borderRadius: "10px", p: 1.5 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>
                    Charge de travail
                  </Typography>
                  {workload.map(m => (
                    <WorkloadBar key={m._id} name={m.name} active={m.active} assigned={m.assigned} availability={m.availability} />
                  ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAssigning(null)} sx={{ textTransform: "none", fontFamily: "Inter, sans-serif", color: C.textMuted, borderRadius: "8px" }}>
            Annuler
          </Button>
          <Button
            onClick={handleAssign} disabled={!techId || saving} variant="contained"
            sx={{ bgcolor: C.accent, textTransform: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, borderRadius: "8px", "&:hover": { bgcolor: C.accentHover } }}
          >
            {saving ? "Assignation…" : "Confirmer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
