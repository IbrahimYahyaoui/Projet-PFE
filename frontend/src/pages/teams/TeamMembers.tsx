// frontend/src/pages/teams/TeamMembers.tsx
import { useState, useEffect } from "react";
import {
  Box, Typography, CircularProgress, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem,
} from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { RoleBadge } from "../../components/chips/RoleBadge";
import { WorkloadBar } from "../../components/WorkloadBar";
import { EmptyState } from "../../components/EmptyState";

interface Member {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: number;
  assigned: number;
  resolved: number;
  chargePercent: number;
  availability: "available" | "busy" | "overloaded";
}

interface AvailableTech {
  _id: string;
  name: string;
  email: string;
}

interface TeamData {
  team: { _id: string; name: string; tag: string; leaderId?: { _id: string } | null };
  members: Member[];
}

const AVAIL_COLOR = { available: C.success, busy: C.warning, overloaded: C.danger };
const AVAIL_LABEL = { available: "Disponible", busy: "Occupé", overloaded: "Surchargé" };

const getInitials = (n: string) => n.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

export default function TeamMembers() {
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const [data,         setData]         = useState<TeamData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [addOpen,      setAddOpen]      = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [availTechs,   setAvailTechs]   = useState<AvailableTech[]>([]);
  const [selectedTech, setSelectedTech] = useState("");
  const [saving,       setSaving]       = useState(false);

  const isLeader = currentUser?.role === "leader";

  const loadData = () => {
    setLoading(true);
    api.get<TeamData>("/api/team/my")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const openAdd = () => {
    setSelectedTech("");
    api.get<AvailableTech[]>("/api/users/available-techs")
      .then(setAvailTechs)
      .catch(console.error);
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!data || !selectedTech) return;
    setSaving(true);
    try {
      await api.post(`/api/team/${data.team._id}/members`, { userId: selectedTech });
      setAddOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message ?? "Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!data || !removeTarget) return;
    setSaving(true);
    try {
      await api.delete(`/api/team/${data.team._id}/members/${removeTarget._id}`);
      setRemoveTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message ?? "Erreur lors du retrait");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;
  if (!data)   return <EmptyState icon="users" title="Aucune équipe" />;

  const { team, members } = data;
  const leaderId = team.leaderId?._id ?? (data as any).team?.leaderId;

  const actions = isLeader
    ? [{ label: "Ajouter un technicien", icon: "user-plus", onClick: openAdd, variant: "contained" as const }]
    : [];

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <PageHeader
        title="Membres de l'équipe"
        subtitle={`${team.name} · ${members.length} membre(s)`}
        icon="users"
        actions={actions}
      />

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 2.5 }}>
        {members.map((m) => {
          const aColor   = AVAIL_COLOR[m.availability] ?? C.info;
          const aLabel   = AVAIL_LABEL[m.availability] ?? m.availability;
          const isLeaderMember = m._id === leaderId || m._id === (leaderId as any)?._id;
          const canRemove = isLeader && !isLeaderMember;
          return (
            <Box key={m._id} sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "20px 22px", transition: "box-shadow 0.2s", "&:hover": { boxShadow: C.shadowMd } }}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ bgcolor: C.accent, width: 42, height: 42, fontSize: "14px", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                    {getInitials(m.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.name}
                    </Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.email}
                    </Typography>
                  </Box>
                  <RoleBadge role={m.role} size="sm" />
                </Box>

                {/* Stats */}
                <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                  {[
                    { label: "Assignés",  value: m.assigned },
                    { label: "Actifs",    value: m.active   },
                    { label: "Résolus",   value: m.resolved },
                  ].map((s) => (
                    <Box key={s.label} sx={{ flex: 1, textAlign: "center", py: 1.5, borderRadius: "10px", bgcolor: C.bgPage }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 700, color: C.textPrimary }}>{s.value}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, textTransform: "uppercase" }}>{s.label}</Typography>
                    </Box>
                  ))}
                </Box>

                {/* Workload bar */}
                <WorkloadBar name="" active={m.active} assigned={m.assigned} availability={m.availability} />

                {/* Status badge + remove button */}
                <Box sx={{ mt: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box sx={{ px: 1.2, py: 0.3, borderRadius: "20px", bgcolor: aColor + "18", border: `1px solid ${aColor}44` }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: aColor }}>{aLabel}</Typography>
                  </Box>
                  {canRemove && (
                    <Button
                      size="small" onClick={() => setRemoveTarget(m)}
                      sx={{ textTransform: "none", fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.danger, borderRadius: "8px", "&:hover": { bgcolor: C.dangerBg } }}
                    >
                      Retirer
                    </Button>
                  )}
                </Box>
              </Box>
          );
        })}
      </Box>

      {members.length === 0 && <EmptyState icon="users" title="Aucun membre" description="Cette équipe n'a pas encore de membres." />}

      {/* ── Add dialog ── */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} PaperProps={{ sx: { borderRadius: "16px", minWidth: 400 } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
          Ajouter un technicien
        </DialogTitle>
        <DialogContent>
          <Select
            fullWidth size="small" value={selectedTech} onChange={e => setSelectedTech(e.target.value)}
            displayEmpty sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif", mt: 1 }}
          >
            <MenuItem value="" disabled>Sélectionner un technicien</MenuItem>
            {availTechs.map(t => (
              <MenuItem key={t._id} value={t._id}>
                <Typography sx={{ fontFamily: "Inter, sans-serif" }}>{t.name}</Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, ml: 1 }}>{t.email}</Typography>
              </MenuItem>
            ))}
          </Select>
          {availTechs.length === 0 && (
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, mt: 1.5, textAlign: "center" }}>
              Aucun technicien disponible
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAddOpen(false)} sx={{ textTransform: "none", fontFamily: "Inter, sans-serif", color: C.textMuted, borderRadius: "8px" }}>
            Annuler
          </Button>
          <Button
            onClick={handleAdd} disabled={!selectedTech || saving} variant="contained"
            sx={{ bgcolor: C.accent, textTransform: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, borderRadius: "8px", "&:hover": { bgcolor: C.accentHover } }}
          >
            {saving ? "Ajout…" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Remove confirm dialog ── */}
      <Dialog open={!!removeTarget} onClose={() => setRemoveTarget(null)} PaperProps={{ sx: { borderRadius: "16px", minWidth: 380 } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
          Retirer le membre
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: C.textSecondary }}>
            Voulez-vous retirer <b>{removeTarget?.name}</b> de l'équipe ?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setRemoveTarget(null)} sx={{ textTransform: "none", fontFamily: "Inter, sans-serif", color: C.textMuted, borderRadius: "8px" }}>
            Annuler
          </Button>
          <Button
            onClick={handleRemove} disabled={saving} variant="contained"
            sx={{ bgcolor: C.danger, textTransform: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, borderRadius: "8px", "&:hover": { bgcolor: C.dangerHover } }}
          >
            {saving ? "Retrait…" : "Retirer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
