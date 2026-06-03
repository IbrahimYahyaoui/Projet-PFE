// frontend/src/pages/teams/TeamTickets.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, TextField, MenuItem, Select, InputAdornment } from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/chips/StatusChip";
import { PriorityChip } from "../../components/chips/PriorityChip";
import { SLABadge } from "../../components/SLABadge";
import { EmptyState } from "../../components/EmptyState";

interface Ticket {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  slaDeadline: string | null;
  slaBreached: boolean;
  escalationLevel: number;
  createdAt: string;
  createdBy: { name: string };
  assignedTo: { name: string } | null;
}

export default function TeamTickets() {
  const navigate = useNavigate();
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [statusF,  setStatusF]  = useState("all");
  const [priorityF,setPriorityF]= useState("all");

  useEffect(() => {
    api.get<Ticket[]>("/api/team/my/tickets")
      .then(setTickets)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => {
    const matchSearch   = !search   || t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = statusF   === "all" || t.status   === statusF;
    const matchPriority = priorityF === "all" || t.priority === priorityF;
    return matchSearch && matchStatus && matchPriority;
  });

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <PageHeader title="Tickets de l'équipe" subtitle={`${filtered.length} ticket(s)`} icon="ticket" />

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
        <TextField
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Box component="i" className="ti ti-search" sx={{ color: C.textMuted }} /></InputAdornment> }}
        />
        <Select size="small" value={statusF}   onChange={e => setStatusF(e.target.value)}   sx={{ borderRadius: "10px", minWidth: 140, fontFamily: "Inter, sans-serif" }}>
          <MenuItem value="all">Tous statuts</MenuItem>
          {["open","assigned","in_progress","waiting","resolved","closed"].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
        <Select size="small" value={priorityF} onChange={e => setPriorityF(e.target.value)} sx={{ borderRadius: "10px", minWidth: 140, fontFamily: "Inter, sans-serif" }}>
          <MenuItem value="all">Toutes priorités</MenuItem>
          {["low","medium","high","critical"].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </Select>
      </Box>

      {/* Table */}
      <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {/* Header */}
        <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 1, px: 2, py: 1.2, bgcolor: C.bgPage, borderBottom: `1px solid ${C.border}` }}>
          {["Titre","Statut","Priorité","Assigné à","SLA",""].map(h => (
            <Typography key={h} sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</Typography>
          ))}
        </Box>

        {filtered.length === 0
          ? <EmptyState icon="ticket" title="Aucun ticket" description="Aucun ticket ne correspond aux filtres." />
          : filtered.map(t => (
            <Box
              key={t._id}
              onClick={() => navigate(`/tickets/${t._id}`)}
              sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 1, px: 2, py: 1.5, borderBottom: `1px solid ${C.divider}`, cursor: "pointer", transition: "bgcolor 0.15s", "&:hover": { bgcolor: C.bgPage }, alignItems: "center" }}
            >
              <Box>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{t.createdBy?.name} · {new Date(t.createdAt).toLocaleDateString("fr-FR")}</Typography>
              </Box>
              <StatusChip status={t.status} size="sm" />
              <PriorityChip priority={t.priority} size="sm" />
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textSecondary }}>{t.assignedTo?.name ?? "—"}</Typography>
              <SLABadge slaDeadline={t.slaDeadline} slaBreached={t.slaBreached} status={t.status} />
              {t.escalationLevel > 0 && (
                <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: C.dangerBg }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: C.danger }}>ESC {t.escalationLevel}</Typography>
                </Box>
              )}
              {t.escalationLevel === 0 && <Box />}
            </Box>
          ))
        }
      </Box>
    </Box>
  );
}
