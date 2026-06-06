// frontend/src/pages/teams/AdminAllMembers.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Avatar, LinearProgress, CircularProgress,
  Select, MenuItem, TextField, InputAdornment,
} from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { RoleBadge } from "../../components/chips/RoleBadge";
import { EmptyState } from "../../components/EmptyState";

// ─── Types ───────────────────────────────────────────────────────────────────
interface MemberWithTeam {
  _id: string;
  name: string;
  email: string;
  role: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  assigned: number;
  active: number;
  resolved: number;
  chargePercent: number;
  availability: "available" | "busy" | "overloaded";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (n: string) => n.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

const AVAIL = {
  available: { color: C.success, bg: C.successBg,  label: "Disponible" },
  busy:      { color: C.warning, bg: C.warningBg,  label: "Occupé"     },
  overloaded:{ color: C.danger,  bg: C.dangerBg,   label: "Surchargé"  },
};

const ROLE_AVATAR_COLOR: Record<string, string> = {
  leader: "#3B82F6", tech: "#F97316", user: "#8B5CF6", admin: "#EF4444",
};

const CATEGORY_COLORS: Record<string, string> = {
  hardware: "#EA580C", software: "#7C3AED", network: "#2563EB",
  security: "#EF4444", support: "#0E9188", other: "#6B7280",
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminAllMembers() {
  const [members,  setMembers]  = useState<MemberWithTeam[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [teamFilter,   setTeamFilter]   = useState("all");
  const [roleFilter,   setRoleFilter]   = useState("all");
  const [availFilter,  setAvailFilter]  = useState("all");
  const [search,       setSearch]       = useState("");
  const [teams,        setTeams]        = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const allTeams: any[] = await api.get<any[]>("/api/team/all");
        if (!Array.isArray(allTeams)) { setLoading(false); return; }

        setTeams(allTeams.map(t => ({ _id: t._id, name: t.name })));

        // Load full details (with workload) for each team in parallel
        const detailsArr = await Promise.all(
          allTeams.map(t => api.get<any>(`/api/team/${t._id}`).catch(() => null))
        );

        const aggregated: MemberWithTeam[] = [];
        detailsArr.forEach((det, idx) => {
          if (!det || !Array.isArray(det.members)) return;
          const team = allTeams[idx];
          det.members.forEach((m: any) => {
            aggregated.push({
              _id:          m._id,
              name:         m.name,
              email:        m.email,
              role:         m.role,
              teamId:       team._id,
              teamName:     team.name,
              teamColor:    team.color || CATEGORY_COLORS[team.category] || "#6B7280",
              assigned:     m.assigned    ?? 0,
              active:       m.active      ?? 0,
              resolved:     m.resolved    ?? 0,
              chargePercent:m.chargePercent ?? 0,
              availability: m.availability ?? "available",
            });
          });
        });

        // Deduplicate by _id (a user can be in multiple teams — keep all entries)
        setMembers(aggregated);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return members.filter(m => {
      if (teamFilter  !== "all" && m.teamId       !== teamFilter)  return false;
      if (roleFilter  !== "all" && m.role         !== roleFilter)  return false;
      if (availFilter !== "all" && m.availability !== availFilter) return false;
      if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [members, teamFilter, roleFilter, availFilter, search]);

  const totalCount    = filtered.length;
  const availCount    = filtered.filter(m => m.availability === "available").length;
  const overloadCount = filtered.filter(m => m.availability === "overloaded").length;

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      <PageHeader title="Tous les membres" icon="users" />

      {/* Filtres */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <Select size="small" value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
          sx={{ fontFamily: "Inter, sans-serif", borderRadius: "10px", minWidth: 180, fontSize: "13px" }}>
          <MenuItem value="all" sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>Toutes les équipes</MenuItem>
          {teams.map(t => (
            <MenuItem key={t._id} value={t._id} sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>{t.name}</MenuItem>
          ))}
        </Select>

        <Select size="small" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          sx={{ fontFamily: "Inter, sans-serif", borderRadius: "10px", minWidth: 140, fontSize: "13px" }}>
          <MenuItem value="all"    sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>Tous les rôles</MenuItem>
          <MenuItem value="leader" sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>Leader</MenuItem>
          <MenuItem value="tech"   sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>Technicien</MenuItem>
        </Select>

        <Select size="small" value={availFilter} onChange={e => setAvailFilter(e.target.value)}
          sx={{ fontFamily: "Inter, sans-serif", borderRadius: "10px", minWidth: 150, fontSize: "13px" }}>
          <MenuItem value="all"        sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>Disponibilité</MenuItem>
          <MenuItem value="available"  sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>Disponible</MenuItem>
          <MenuItem value="busy"       sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>Occupé</MenuItem>
          <MenuItem value="overloaded" sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>Surchargé</MenuItem>
        </Select>

        <TextField
          size="small"
          placeholder="Rechercher par nom…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box component="i" className="ti ti-search" sx={{ fontSize: 15, color: C.textMuted }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1, minWidth: 200,
            "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px", fontFamily: "Inter, sans-serif" },
          }}
        />
      </Box>

      {/* KPIs */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
        {[
          { label: "Total membres",  value: totalCount,    icon: "users",   color: C.accent,  bg: C.accentLight },
          { label: "Disponibles",    value: availCount,    icon: "check",   color: C.success, bg: C.successBg  },
          { label: "Surchargés",     value: overloadCount, icon: "alert",   color: C.danger,  bg: C.dangerBg   },
        ].map(k => (
          <Box key={k.label} sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "18px 20px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {k.label}
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box component="i" className={`ti ti-${k.icon}`} sx={{ fontSize: 18, color: k.color }} />
              </Box>
            </Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "28px", fontWeight: 700, color: k.color, lineHeight: 1 }}>
              {k.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Member cards */}
      {filtered.length === 0 ? (
        <EmptyState icon="users" title="Aucun membre trouvé" description="Ajustez vos filtres ou créez des équipes." />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 2.5 }}>
          {filtered.map((m, idx) => {
            const av = AVAIL[m.availability] ?? AVAIL.available;
            const avatarBg = ROLE_AVATAR_COLOR[m.role] ?? C.accent;
            return (
              <Box key={`${m._id}-${idx}`} sx={{ bgcolor: "#fff", borderRadius: "14px", border: `1px solid ${C.border}`, p: "20px 22px", display: "flex", flexDirection: "column", gap: 1.5, transition: "box-shadow 0.2s", "&:hover": { boxShadow: C.shadowMd } }}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar sx={{ width: 42, height: 42, fontSize: "14px", fontWeight: 700, bgcolor: avatarBg + "22", color: avatarBg, fontFamily: "Inter, sans-serif" }}>
                    {getInitials(m.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.name}
                    </Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.email}
                    </Typography>
                  </Box>
                  <RoleBadge role={m.role} size="sm" />
                </Box>

                {/* Team chip */}
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.7, px: 1.2, py: 0.4, borderRadius: "20px", bgcolor: m.teamColor + "18", border: `1px solid ${m.teamColor}44`, alignSelf: "flex-start" }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: m.teamColor }} />
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: m.teamColor }}>{m.teamName}</Typography>
                </Box>

                {/* Stats */}
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                  {[{ label: "Assignés", v: m.assigned, c: C.info }, { label: "Actifs", v: m.active, c: C.warning }, { label: "Résolus", v: m.resolved, c: C.success }].map(s => (
                    <Box key={s.label} sx={{ textAlign: "center", py: 1, borderRadius: "8px", bgcolor: C.bgPage }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: 700, color: s.c }}>{s.v}</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, textTransform: "uppercase" }}>{s.label}</Typography>
                    </Box>
                  ))}
                </Box>

                {/* Availability + bar */}
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Box sx={{ px: 1, py: 0.2, borderRadius: "20px", bgcolor: av.bg }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: av.color }}>{av.label}</Typography>
                    </Box>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: av.color }}>{m.chargePercent}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={m.chargePercent} sx={{ height: 4, borderRadius: 2, bgcolor: C.border, "& .MuiLinearProgress-bar": { bgcolor: av.color, borderRadius: 2 } }} />
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
