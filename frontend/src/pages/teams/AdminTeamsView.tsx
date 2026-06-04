// frontend/src/pages/teams/AdminTeamsView.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, CircularProgress, Grid, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";

interface Leader {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface TeamCard {
  _id: string;
  name: string;
  description: string;
  category: string;
  tag: string;
  color: string;
  leaderId: Leader | null;
  members: { _id: string }[];
  stats: {
    total: number;
    active: number;
    members: number;
    slaBreached: number;
  };
}

const CATEGORY_MAP: Record<string, { tag: string; color: string }> = {
  hardware: { tag: "HARD", color: "#EA580C" },
  software: { tag: "SOFT", color: "#7C3AED" },
  network:  { tag: "NET",  color: "#2563EB" },
  security: { tag: "SEC",  color: "#EF4444" },
  support:  { tag: "SUP",  color: "#0E9188" },
  other:    { tag: "OTHER", color: "#6B7280" },
};

const CATEGORIES = Object.keys(CATEGORY_MAP);

const getLoadConf = (count: number) => {
  if (count < 3) return { text: C.success, bg: C.successBg, label: "Faible" };
  if (count < 6) return { text: C.warning, bg: C.warningBg, label: "Moyen" };
  return           { text: C.danger,  bg: C.dangerBg,  label: "Élevé" };
};

const getInitials = (n: string) => n.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

const EMPTY_FORM = { name: "", description: "", category: "", tag: "", color: "", leaderId: "" };

export default function AdminTeamsView() {
  const [teams,   setTeams]   = useState<TeamCard[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam,   setEditTeam]   = useState<TeamCard | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<TeamCard | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [deleteErr,  setDeleteErr]  = useState("");

  const loadTeams = useCallback(() => {
    setLoading(true);
    api.get<TeamCard[]>("/api/team/all")
      .then(setTeams)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTeams();
    api.get<Leader[]>("/api/users").then(users =>
      setLeaders((users as any[]).filter((u: any) => u.role === "leader"))
    ).catch(console.error);
  }, [loadTeams]);

  const handleCategoryChange = (cat: string) => {
    const mapped = CATEGORY_MAP[cat] ?? { tag: "OTHER", color: "#6B7280" };
    setForm(f => ({ ...f, category: cat, tag: mapped.tag, color: mapped.color }));
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreateOpen(true);
  };

  const openEdit = (team: TeamCard) => {
    setForm({
      name:        team.name,
      description: team.description,
      category:    team.category,
      tag:         team.tag,
      color:       team.color,
      leaderId:    team.leaderId?._id ?? "",
    });
    setEditTeam(team);
  };

  const handleCreate = async () => {
    if (!form.name || !form.category || !form.leaderId) return;
    setSaving(true);
    try {
      await api.post("/api/team", form);
      setCreateOpen(false);
      loadTeams();
    } catch (err: any) {
      alert(err.message ?? "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTeam) return;
    setSaving(true);
    try {
      await api.put(`/api/team/${editTeam._id}`, form);
      setEditTeam(null);
      loadTeams();
    } catch (err: any) {
      alert(err.message ?? "Erreur lors de la modification");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTeam) return;
    setSaving(true);
    setDeleteErr("");
    try {
      await api.delete(`/api/team/${deleteTeam._id}`);
      setDeleteTeam(null);
      loadTeams();
    } catch (err: any) {
      setDeleteErr(err.message ?? "Erreur lors de la suppression");
    } finally {
      setSaving(false);
    }
  };

  const totalMembers       = teams.reduce((s, t) => s + (t.stats?.members ?? 0), 0);
  const totalActiveTickets = teams.reduce((s, t) => s + (t.stats?.active ?? 0), 0);
  const totalSlaBreached   = teams.reduce((s, t) => s + (t.stats?.slaBreached ?? 0), 0);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
      <CircularProgress sx={{ color: C.accent }} />
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Gestion des équipes"
        subtitle={`${teams.length} équipe${teams.length !== 1 ? "s" : ""}`}
        icon="settings"
        actions={[{ label: "Créer une équipe", icon: "plus", onClick: openCreate, variant: "contained" }]}
      />

      {/* Stats row */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
        {[
          { label: "Équipes",          value: teams.length,       color: C.accent   },
          { label: "Membres total",    value: totalMembers,       color: C.info     },
          { label: "Tickets actifs",   value: totalActiveTickets, color: C.warning  },
          { label: "SLA non respectés",value: totalSlaBreached,   color: C.danger   },
        ].map(s => (
          <Box key={s.label} sx={{ bgcolor: "#fff", borderRadius: "12px", border: `1px solid ${C.border}`, p: 2.5 }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", mb: 1 }}>
              {s.label}
            </Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "28px", fontWeight: 700, color: s.color, letterSpacing: "-0.5px" }}>
              {s.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Team cards grid */}
      {teams.length === 0 ? (
        <EmptyState icon="users-group" title="Aucune équipe" description="Créez votre première équipe pour commencer." />
      ) : (
        <Grid container spacing={2}>
          {teams.map(team => {
            const load = getLoadConf(team.stats?.active ?? 0);
            const pct  = Math.min(((team.stats?.active ?? 0) / 10) * 100, 100);
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={team._id}>
                <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: 2.5, transition: "box-shadow 0.2s", "&:hover": { boxShadow: C.shadowMd } }}>
                  {/* Tag + actions row */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                    <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: `${team.color}18`, border: `1px solid ${team.color}40` }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: team.color }}>
                        {team.tag}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Box
                        onClick={() => openEdit(team)}
                        sx={{ width: 28, height: 28, borderRadius: "7px", bgcolor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", "&:hover": { bgcolor: C.accentLight } }}
                      >
                        <Box component="i" className="ti ti-edit" sx={{ fontSize: 14, color: C.textMuted }} />
                      </Box>
                      <Box
                        onClick={() => { setDeleteErr(""); setDeleteTeam(team); }}
                        sx={{ width: 28, height: 28, borderRadius: "7px", bgcolor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", "&:hover": { bgcolor: C.dangerBg } }}
                      >
                        <Box component="i" className="ti ti-trash" sx={{ fontSize: 14, color: C.danger }} />
                      </Box>
                    </Box>
                  </Box>

                  {/* Team name */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: team.color, flexShrink: 0 }} />
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "15px", fontWeight: 700, color: C.textPrimary }}>
                      {team.name}
                    </Typography>
                  </Box>

                  {/* Leader */}
                  {team.leaderId && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: C.info, fontSize: "10px", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                        {getInitials(team.leaderId.name)}
                      </Avatar>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary }}>
                        {team.leaderId.name}
                      </Typography>
                    </Box>
                  )}

                  {/* Stats row */}
                  <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                    <Box sx={{ flex: 1, textAlign: "center", py: 0.8, borderRadius: "8px", bgcolor: C.bgPage }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: 700, color: C.textPrimary }}>{team.stats?.members ?? 0}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>Membres</Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: "center", py: 0.8, borderRadius: "8px", bgcolor: C.bgPage }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: 700, color: C.textPrimary }}>{team.stats?.active ?? 0}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>Actifs</Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: "center", py: 0.8, borderRadius: "8px", bgcolor: C.bgPage }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: 700, color: C.textPrimary }}>{team.stats?.total ?? 0}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>Total</Typography>
                    </Box>
                  </Box>

                  {/* Load indicator */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.6 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>Charge</Typography>
                    <Box sx={{ px: 0.8, py: 0.2, borderRadius: "6px", bgcolor: load.bg }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: load.text }}>
                        {load.label}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ height: 4, borderRadius: "4px", bgcolor: C.border, overflow: "hidden" }}>
                    <Box sx={{ height: "100%", width: `${pct}%`, borderRadius: "4px", bgcolor: load.text, transition: "width 0.4s ease" }} />
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Create Dialog ── */}
      <TeamFormDialog
        open={createOpen}
        title="Créer une équipe"
        form={form}
        leaders={leaders}
        saving={saving}
        onClose={() => setCreateOpen(false)}
        onChange={setForm}
        onCategoryChange={handleCategoryChange}
        onConfirm={handleCreate}
      />

      {/* ── Edit Dialog ── */}
      <TeamFormDialog
        open={!!editTeam}
        title="Modifier l'équipe"
        form={form}
        leaders={leaders}
        saving={saving}
        onClose={() => setEditTeam(null)}
        onChange={setForm}
        onCategoryChange={handleCategoryChange}
        onConfirm={handleEdit}
      />

      {/* ── Delete Dialog ── */}
      <Dialog open={!!deleteTeam} onClose={() => setDeleteTeam(null)} PaperProps={{ sx: { borderRadius: "16px", minWidth: 400 } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
          Supprimer l'équipe
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: C.textSecondary }}>
            Voulez-vous supprimer l'équipe <b>{deleteTeam?.name}</b> ? Cette action est irréversible.
          </Typography>
          {deleteErr && (
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "8px", bgcolor: C.dangerBg, border: `1px solid ${C.danger}30` }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.danger }}>{deleteErr}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteTeam(null)} sx={{ textTransform: "none", fontFamily: "Inter, sans-serif", color: C.textMuted, borderRadius: "8px" }}>
            Annuler
          </Button>
          <Button
            onClick={handleDelete} disabled={saving} variant="contained"
            sx={{ bgcolor: C.danger, textTransform: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, borderRadius: "8px", "&:hover": { bgcolor: C.dangerHover } }}
          >
            {saving ? "Suppression…" : "Supprimer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Form Dialog ──────────────────────────────────────────────────────────────
interface FormDialogProps {
  open: boolean;
  title: string;
  form: typeof EMPTY_FORM;
  leaders: Leader[];
  saving: boolean;
  onClose: () => void;
  onChange: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  onCategoryChange: (cat: string) => void;
  onConfirm: () => void;
}

function TeamFormDialog({ open, title, form, leaders, saving, onClose, onChange, onCategoryChange, onConfirm }: FormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: "16px", minWidth: 480 } }}>
      <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.textPrimary }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        <TextField
          label="Nom de l'équipe" size="small" fullWidth required
          value={form.name}
          onChange={e => onChange(f => ({ ...f, name: e.target.value }))}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" } }}
        />
        <TextField
          label="Description" size="small" fullWidth multiline rows={2}
          value={form.description}
          onChange={e => onChange(f => ({ ...f, description: e.target.value }))}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif" } }}
        />
        <FormControl size="small" fullWidth required>
          <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Catégorie</InputLabel>
          <Select
            label="Catégorie" value={form.category}
            onChange={e => onCategoryChange(e.target.value)}
            sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif" }}
          >
            {CATEGORIES.map(cat => (
              <MenuItem key={cat} value={cat}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: CATEGORY_MAP[cat].color, flexShrink: 0 }} />
                  <Typography sx={{ fontFamily: "Inter, sans-serif", textTransform: "capitalize" }}>{cat}</Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: CATEGORY_MAP[cat].color, ml: 0.5 }}>
                    ({CATEGORY_MAP[cat].tag})
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth required>
          <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Team Leader</InputLabel>
          <Select
            label="Team Leader" value={form.leaderId}
            onChange={e => onChange(f => ({ ...f, leaderId: e.target.value }))}
            sx={{ borderRadius: "10px", fontFamily: "Inter, sans-serif" }}
          >
            {leaders.map(l => (
              <MenuItem key={l._id} value={l._id}>
                <Typography sx={{ fontFamily: "Inter, sans-serif" }}>{l.name}</Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, ml: 1 }}>{l.email}</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontFamily: "Inter, sans-serif", color: C.textMuted, borderRadius: "8px" }}>
          Annuler
        </Button>
        <Button
          onClick={onConfirm}
          disabled={saving || !form.name || !form.category || !form.leaderId}
          variant="contained"
          sx={{ bgcolor: C.accent, textTransform: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, borderRadius: "8px", "&:hover": { bgcolor: C.accentHover } }}
        >
          {saving ? "Enregistrement…" : "Confirmer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
