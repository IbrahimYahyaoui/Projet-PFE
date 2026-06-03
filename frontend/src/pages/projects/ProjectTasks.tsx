// frontend/src/pages/projects/ProjectTasks.tsx
import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Select, MenuItem, Grid } from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { PriorityChip } from "../../components/chips/PriorityChip";
import { EmptyState } from "../../components/EmptyState";

interface Project { _id: string; name: string }
interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo: { name: string } | null;
  projectId: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  todo:        { bg: "rgba(148,163,184,0.1)", text: "#64748B" },
  in_progress: { bg: "rgba(249,115,22,0.1)",  text: "#EA580C" },
  review:      { bg: "rgba(59,130,246,0.1)",   text: "#2563EB" },
  done:        { bg: "rgba(34,197,94,0.1)",     text: "#16A34A" },
};
const STATUS_LABELS: Record<string, string> = { todo: "À faire", in_progress: "En cours", review: "Révision", done: "Terminé" };

export default function ProjectTasks() {
  const [projects,  setProjects]   = useState<Project[]>([]);
  const [tasks,     setTasks]      = useState<Task[]>([]);
  const [projectId, setProjectId]  = useState<string>("");
  const [loading,   setLoading]    = useState(false);

  useEffect(() => {
    api.get<{ projects: Project[] }>("/api/projects")
      .then(r => {
        const list = Array.isArray(r) ? r : (r as any).projects ?? r;
        setProjects(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length) setProjectId(list[0]._id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api.get<Task[]>(`/api/projects/${projectId}/tasks`)
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  const byStatus = (s: string) => tasks.filter(t => t.status === s);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <PageHeader title="Tâches" subtitle="Gestion des tâches par projet" icon="checkbox" />
        <Select size="small" value={projectId} onChange={e => setProjectId(e.target.value)} sx={{ minWidth: 200, borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>
          {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
        </Select>
      </Box>

      {loading
        ? <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}><CircularProgress sx={{ color: C.accent }} /></Box>
        : (
          <Grid container spacing={2}>
            {["todo","in_progress","review","done"].map(status => {
              const cols  = byStatus(status);
              const sc    = STATUS_COLORS[status] ?? { bg: "#f1f5f9", text: "#64748b" };
              return (
                <Grid item xs={12} sm={6} lg={3} key={status}>
                  <Box sx={{ bgcolor: C.bgPage, borderRadius: "14px", p: 2, minHeight: 300 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Box sx={{ px: 1.2, py: 0.4, borderRadius: "20px", bgcolor: sc.bg }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: sc.text }}>{STATUS_LABELS[status]}</Typography>
                      </Box>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 700, color: C.textMuted }}>{cols.length}</Typography>
                    </Box>
                    {cols.map(task => (
                      <Box key={task._id} sx={{ bgcolor: "#fff", borderRadius: "10px", border: `1px solid ${C.border}`, p: 1.8, mb: 1.2, "&:hover": { boxShadow: C.shadow } }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, mb: 0.8 }}>{task.title}</Typography>
                        {task.description && <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, mb: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{task.description}</Typography>}
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <PriorityChip priority={task.priority} size="sm" />
                          {task.assignedTo && <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{task.assignedTo.name}</Typography>}
                        </Box>
                        {task.dueDate && (
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: new Date(task.dueDate) < new Date() ? C.danger : C.textMuted, mt: 0.8 }}>
                            Échéance : {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                          </Typography>
                        )}
                      </Box>
                    ))}
                    {cols.length === 0 && <EmptyState icon="checkbox" title="Aucune tâche" />}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )
      }
    </Box>
  );
}
