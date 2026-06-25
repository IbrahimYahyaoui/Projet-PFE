// frontend/src/pages/projects/ProjectKanban.tsx
import { useState, useEffect, useRef } from "react";
import { Box, Typography, CircularProgress, Select, MenuItem, Button } from "@mui/material";
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
  assignedTo: { _id: string; name: string } | null;
}

const COLUMNS = [
  { id: "todo",        label: "À faire",    color: "#64748B", bg: "rgba(148,163,184,0.08)" },
  { id: "in_progress", label: "En cours",   color: "#EA580C", bg: "rgba(249,115,22,0.08)"  },
  { id: "review",      label: "Révision",   color: "#2563EB", bg: "rgba(59,130,246,0.08)"   },
  { id: "done",        label: "Terminé",    color: "#16A34A", bg: "rgba(34,197,94,0.08)"    },
];

export default function ProjectKanban() {
  const storedUser  = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isTech      = currentUser?.role === "tech";
  const techId      = currentUser?.id ?? currentUser?._id ?? "";

  const [projects,  setProjects]   = useState<Project[]>([]);
  const [tasks,     setTasks]      = useState<Task[]>([]);
  const [projectId, setProjectId]  = useState<string>("");
  const [loading,   setLoading]    = useState(false);
  const [dragging,  setDragging]   = useState<string | null>(null);
  const [dropError, setDropError]  = useState<string | null>(null);
  const dragOver                   = useRef<string | null>(null);

  useEffect(() => {
    if (!dropError) return;
    const t = setTimeout(() => setDropError(null), 4000);
    return () => clearTimeout(t);
  }, [dropError]);

  useEffect(() => {
    api.get<any>("/api/projects")
      .then(r => {
        const list = Array.isArray(r) ? r : [];
        setProjects(list);
        if (list.length) setProjectId(list[0]._id);
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

  const handleDrop = async (targetStatus: string) => {
    if (!isTech) return; // Seul le tech peut changer le statut via drag & drop
    if (!dragging || !dragOver.current) return;
    const task = tasks.find(t => t._id === dragging);
    if (!task || task.status === targetStatus) return;

    if (task.assignedTo?._id !== techId) {
      setDropError("Vous ne pouvez déplacer que vos propres tâches");
      setDragging(null);
      return;
    }

    // Optimistic update
    setTasks(prev => prev.map(t => t._id === dragging ? { ...t, status: targetStatus } : t));
    try {
      await api.put(`/api/projects/${projectId}/tasks/${dragging}`, { status: targetStatus });
    } catch (err: any) {
      // Revert on failure
      setTasks(prev => prev.map(t => t._id === dragging ? { ...t, status: task.status } : t));
      setDropError(err?.message ?? "Impossible de déplacer cette tâche");
    }
    setDragging(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <PageHeader title="Kanban" subtitle="Tableau de gestion des tâches" icon="layout-kanban" />
        <Select size="small" value={projectId} onChange={e => setProjectId(e.target.value)} sx={{ minWidth: 200, borderRadius: "10px", fontFamily: "Inter, sans-serif" }}>
          {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
        </Select>
      </Box>

      {dropError && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "10px 14px", bgcolor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", mb: 2 }}>
          <Box component="i" className="ti ti-alert-triangle" sx={{ fontSize: 15, color: "#DC2626" }} />
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#DC2626", fontWeight: 500 }}>
            {dropError}
          </Typography>
        </Box>
      )}

      {loading
        ? <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}><CircularProgress sx={{ color: C.accent }} /></Box>
        : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, overflowX: "auto" }}>
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);
              return (
                <Box
                  key={col.id}
                  onDragOver={e => { e.preventDefault(); dragOver.current = col.id; }}
                  onDrop={() => handleDrop(col.id)}
                  sx={{ bgcolor: col.bg, borderRadius: "14px", p: 2, minHeight: 500, border: `2px dashed transparent`, transition: "border-color 0.2s", "&:hover": { borderColor: col.color + "44" } }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: col.color }} />
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 700, color: col.color }}>{col.label}</Typography>
                    </Box>
                    <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: col.color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: col.color }}>{colTasks.length}</Typography>
                    </Box>
                  </Box>

                  {colTasks.map(task => {
                    const isOverdue = task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date();
                    const canDrag = isTech && task.assignedTo?._id === techId;
                    const dragDisabled = isTech && !canDrag;
                    return (
                    <Box
                      key={task._id}
                      draggable={canDrag}
                      onDragStart={canDrag ? () => setDragging(task._id) : undefined}
                      onDragEnd={() => setDragging(null)}
                      sx={{
                        bgcolor: "#fff", borderRadius: "10px",
                        border: `1px solid ${isOverdue ? "#DC2626" : C.border}`,
                        p: 1.8, mb: 1.2, cursor: dragDisabled ? "not-allowed" : "grab",
                        opacity: dragDisabled ? 0.6 : dragging === task._id ? 0.5 : 1,
                        transition: "box-shadow 0.15s, opacity 0.15s",
                        "&:hover": { boxShadow: C.shadowMd },
                        "&:active": { cursor: dragDisabled ? "not-allowed" : "grabbing" },
                      }}
                    >
                      {isOverdue && (
                        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, bgcolor: "rgba(239,68,68,0.1)", borderRadius: "4px", px: 0.8, py: 0.2, mb: 0.5 }}>
                          <Box component="i" className="ti ti-alert" sx={{ fontSize: 10, color: "#DC2626" }} />
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: "#DC2626" }}>En retard</Typography>
                        </Box>
                      )}
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary, mb: 1 }}>{task.title}</Typography>
                      {task.description && (
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, mb: 1.2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {task.description}
                        </Typography>
                      )}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <PriorityChip priority={task.priority} size="sm" />
                        {task.assignedTo && (
                          <Box sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: C.accent }}>{task.assignedTo.name.slice(0,2).toUpperCase()}</Typography>
                          </Box>
                        )}
                      </Box>
                      {task.dueDate && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                          <Box component="i" className="ti ti-calendar" sx={{ fontSize: 12, color: new Date(task.dueDate) < new Date() ? C.danger : C.textMuted }} />
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: new Date(task.dueDate) < new Date() ? C.danger : C.textMuted }}>
                            {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                  })}
                  {colTasks.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 4, opacity: 0.4 }}>
                      <Box component="i" className="ti ti-inbox" sx={{ fontSize: 28, color: col.color }} />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )
      }
    </Box>
  );
}
