// frontend/src/pages/projects/ProjectDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Avatar, Chip, CircularProgress,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Select, FormControl, InputLabel,
  IconButton, Tooltip, Divider, Drawer,
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import { C } from "../../theme";

// ─── Types ───────────────────────────────────────────────────
interface Member { _id: string; name: string; email: string; role: string }
interface Project {
  _id: string; name: string; description: string; status: string;
  priority: string; startDate: string; endDate: string; color: string;
  createdBy: Member; managerId: Member; members: Member[];
  progress: number; totalTasks: number; doneTasks: number; createdAt: string;
}
interface Comment { _id: string; content: string; author: Member; createdAt: string }
interface Task {
  _id: string; title: string; description: string; status: string;
  priority: string; assignedTo: Member | null; createdBy: Member;
  dueDate: string; projectId: string; createdAt: string;
  comments?: Comment[];
}

// ─── Shared constants (mirrored from Projects.tsx) ───────────
const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planning:    { label: "Planning",    color: "#2563EB", bg: "rgba(37,99,235,0.1)"  },
  in_progress: { label: "In Progress", color: "#0E9188", bg: "rgba(95,194,186,0.1)" },
  at_risk:     { label: "At Risk",     color: "#DC2626", bg: "rgba(239,68,68,0.08)" },
  completed:   { label: "Completed",   color: "#16A34A", bg: "rgba(22,163,74,0.1)"  },
  on_hold:     { label: "On Hold",     color: "#94A3B8", bg: "rgba(148,163,184,0.1)"},
};

const TASK_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  todo:        { label: "Todo",        color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  in_progress: { label: "In Progress", color: "#2563EB", bg: "rgba(37,99,235,0.1)"   },
  review:      { label: "Review",      color: "#EA580C", bg: "rgba(234,88,12,0.1)"   },
  done:        { label: "Done",        color: "#16A34A", bg: "rgba(22,163,74,0.1)"   },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: "Low",      color: "#16A34A", bg: "rgba(22,163,74,0.1)"   },
  medium:   { label: "Medium",   color: "#2563EB", bg: "rgba(37,99,235,0.1)"   },
  high:     { label: "High",     color: "#EA580C", bg: "rgba(234,88,12,0.1)"   },
  critical: { label: "Critical", color: "#DC2626", bg: "rgba(239,68,68,0.08)"  },
};

const PROJECT_STATUSES = ["planning", "in_progress", "at_risk", "completed", "on_hold"];
const PROJECT_COLORS   = ["#5FC2BA", "#2563EB", "#7C3AED", "#EA580C", "#16A34A", "#DC2626", "#F59E0B"];

const avatarColors = [
  { bg: C.accentLight,              color: "#0E9188" },
  { bg: "rgba(59,130,246,0.12)",    color: "#2563EB" },
  { bg: "rgba(124,58,237,0.12)",    color: "#7C3AED" },
  { bg: "rgba(249,115,22,0.12)",    color: "#EA580C" },
  { bg: "rgba(239,68,68,0.08)",     color: "#DC2626" },
];

const inputSx = {
  "& .MuiOutlinedInput-root": {
    fontFamily: "Inter, sans-serif", bgcolor: C.bgPage, borderRadius: "10px", fontSize: 13,
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.accent },
    "&.Mui-focused fieldset": { borderColor: C.accent, borderWidth: "2px" },
  },
  "& .MuiInputLabel-root": { fontFamily: "Inter, sans-serif", color: C.textMuted, "&.Mui-focused": { color: C.accent } },
  "& .MuiInputBase-input": { color: C.textPrimary },
};

// ─── TaskCard ────────────────────────────────────────────────
function TaskCard({ task, index, onDragStart, onClick, dragDisabled }: {
  task: Task; index: number; onDragStart: () => void; onClick: () => void; dragDisabled?: boolean;
}) {
  const tp = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const av = avatarColors[index % avatarColors.length];
  const isOverdue = task.dueDate && !["done"].includes(task.status) && new Date(task.dueDate) < new Date();

  return (
    <Paper draggable={!dragDisabled} onDragStart={dragDisabled ? undefined : onDragStart} onClick={onClick}
      sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", p: 1.75, cursor: dragDisabled ? "not-allowed" : "pointer", opacity: dragDisabled ? 0.6 : 1, transition: "all 0.15s", "&:hover": { borderColor: C.accent, boxShadow: C.shadowMd, transform: "translateY(-1px)" }, "&:active": { cursor: dragDisabled ? "not-allowed" : "grabbing" } }}>
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", color: C.navy, mb: 1.2, lineHeight: 1.4 }}>
        {task.title}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 1 }}>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: 0.8, py: 0.3, borderRadius: "5px", bgcolor: tp.bg }}>
          <Box component="i" className="ti ti-flag" sx={{ fontSize: 10, color: tp.color }} />
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: tp.color }}>{tp.label}</Typography>
        </Box>
        {isOverdue && (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: 0.8, py: 0.3, borderRadius: "5px", bgcolor: "rgba(239,68,68,0.08)" }}>
            <Box component="i" className="ti ti-clock-x" sx={{ fontSize: 10, color: "#DC2626" }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: "#DC2626" }}>En retard</Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {task.dueDate ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, color: isOverdue ? "#DC2626" : C.textMuted }}>
            <Box component="i" className="ti ti-calendar" sx={{ fontSize: 12 }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: isOverdue ? 600 : 400 }}>
              {formatDate(task.dueDate)}
            </Typography>
          </Box>
        ) : <Box />}
        {task.assignedTo ? (
          <Avatar sx={{ width: 22, height: 22, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "9px", ml: "auto" }}>
            {getInitials(task.assignedTo.name)}
          </Avatar>
        ) : (
          <Box sx={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px dashed ${C.border}`, ml: "auto" }} />
        )}
      </Box>
    </Paper>
  );
}

// ════════════════════════════════════════════════════════════
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const storedUser  = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const currentRole     = currentUser?.role ?? "user";
  const currentId       = currentUser?.id ?? currentUser?._id ?? "";
  const isAdmin         = currentRole === "admin";
  const isLeader        = currentRole === "leader";
  const isTech          = currentRole === "tech";
  const canManage       = isLeader; // legacy — leader only now

  const [project,    setProject]    = useState<Project | null>(null);
  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [allUsers,   setAllUsers]   = useState<Member[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("board");
  const [dragTask,   setDragTask]   = useState<Task | null>(null);
  const [dropError,  setDropError]  = useState<string | null>(null);

  // Task detail drawer
  const [selectedTask,  setSelectedTask]  = useState<Task | null>(null);
  const [commentInput,  setCommentInput]  = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");

  // Create task dialog
  const [createTaskDialog, setCreateTaskDialog] = useState(false);
  const [newTaskStatus,    setNewTaskStatus]    = useState("todo");
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", assignedTo: "", dueDate: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);

  // Edit project dialog
  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", status: "", priority: "", endDate: "", color: "" });

  // Add member dialog
  const [addMemberDialog, setAddMemberDialog] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${apiUrl}/api/projects/${id}`, { headers }).then(r => r.json()),
      fetch(`${apiUrl}/api/projects/${id}/tasks`, { headers }).then(r => r.json()),
      fetch(`${apiUrl}/api/users`, { headers }).then(r => r.json()),
    ]).then(([proj, taskData, users]) => {
      setProject(proj);
      setEditForm({ name: proj.name, description: proj.description, status: proj.status, priority: proj.priority, endDate: proj.endDate?.slice(0,10) ?? "", color: proj.color });
      setTasks(Array.isArray(taskData) ? taskData : []);
      setAllUsers(Array.isArray(users) ? users : []);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!dropError) return;
    const t = setTimeout(() => setDropError(null), 4000);
    return () => clearTimeout(t);
  }, [dropError]);

  // ── Kanban drop ────────────────────────────────────────────
  const handleDrop = async (status: string) => {
    if (!isTech) return; // Seul le tech peut changer le statut via drag & drop
    if (!dragTask || dragTask.status === status) return;

    if (dragTask.assignedTo?._id !== currentId) {
      setDropError("Vous ne pouvez déplacer que vos propres tâches");
      setDragTask(null);
      return;
    }

    const token = localStorage.getItem("token");
    const res = await fetch(`${apiUrl}/api/projects/${id}/tasks/${dragTask._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDropError(data.message ?? "Impossible de déplacer cette tâche");
      setDragTask(null);
      return;
    }
    setTasks(prev => prev.map(t => t._id === dragTask._id ? { ...t, status } : t));
    setDragTask(null);
  };

  // ── Create Task ────────────────────────────────────────────
  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) { setFormError("Le titre est obligatoire"); return; }
    setFormLoading(true); setFormError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/projects/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...taskForm, status: newTaskStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTasks(prev => [...prev, data]);
      setCreateTaskDialog(false);
      setTaskForm({ title: "", description: "", priority: "medium", assignedTo: "", dueDate: "" });
    } catch (err: any) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  // ── Update Task (drawer) ───────────────────────────────────
  const handleUpdateTask = async (field: string, value: string) => {
    if (!selectedTask) return;
    const token = localStorage.getItem("token");
    await fetch(`${apiUrl}/api/projects/${id}/tasks/${selectedTask._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [field]: value }),
    });
    const updated = { ...selectedTask, [field]: value };
    setTasks(prev => prev.map(t => t._id === selectedTask._id ? { ...t, [field]: value } : t));
    setSelectedTask(updated);
  };

  // ── Delete Task ────────────────────────────────────────────
  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    const token = localStorage.getItem("token");
    await fetch(`${apiUrl}/api/projects/${id}/tasks/${selectedTask._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setTasks(prev => prev.filter(t => t._id !== selectedTask._id));
    setSelectedTask(null);
  };

  // ── Add Comment ────────────────────────────────────────────
  const handleAddComment = async () => {
    if (!selectedTask || !commentInput.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiUrl}/api/projects/${id}/tasks/${selectedTask._id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: commentInput }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks(prev => prev.map(t => t._id === selectedTask._id ? updated : t));
      setSelectedTask(updated);
      setCommentInput("");
    }
  };

  // ── Update Project ─────────────────────────────────────────
  const handleUpdateProject = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiUrl}/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (res.ok) { setProject(data); setEditDialog(false); }
  };

  // ── Add Member ─────────────────────────────────────────────
  const handleAddMember = async (userId: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiUrl}/api/projects/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const data = await res.json();
      setProject(data);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiUrl}/api/projects/${id}/members/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setProject(data);
    }
  };

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: C.accent }} />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Projet introuvable.</Typography>
        <Button onClick={() => navigate("/projects")} sx={{ mt: 2, fontFamily: "Inter, sans-serif", color: C.accent }}>← Retour</Button>
      </Box>
    );
  }

  const isProjectLeader  = project.managerId?._id === currentId || (project.managerId as any) === currentId;
  const canEditProject   = isAdmin;
  const canManageMembers = isLeader && isProjectLeader;
  const canManageTasks   = isLeader && isProjectLeader;
  const canChangeStatus  = isTech;
  const myTasks          = tasks.filter(t => t.assignedTo?._id === currentId);

  const sc = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planning;
  const deadlineDays = project.endDate ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000) : null;
  const isDeadlineSoon = deadlineDays !== null && deadlineDays <= 7 && deadlineDays >= 0;
  const isOverDeadline  = deadlineDays !== null && deadlineDays < 0;
  const deadlineColor   = isOverDeadline ? "#DC2626" : isDeadlineSoon ? "#EA580C" : C.textMuted;

  const doneTasks    = tasks.filter(t => t.status === "done").length;
  const overdueTasks = tasks.filter(t => t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date()).length;

  const tabs = [
    { id: "board",    label: "Board",   icon: "ti-layout-kanban" },
    { id: "tasks",    label: "Tâches",  icon: "ti-list-check" },
    { id: "members",  label: "Membres", icon: "ti-users" },
    { id: "overview", label: "Aperçu",  icon: "ti-chart-bar" },
  ];

  const filteredTasks = activeTab === "tasks" && taskStatusFilter !== "all"
    ? tasks.filter(t => t.status === taskStatusFilter)
    : tasks;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: C.bgPage, fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ══ PROJECT HEADER ══ */}
      <Box sx={{ bgcolor: "#fff", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {/* Color band */}
        <Box sx={{ height: 5, bgcolor: project.color }} />
        <Box sx={{ px: 4, py: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          {/* Back */}
          <Box onClick={() => navigate("/projects")}
            sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", color: C.textMuted, "&:hover": { color: C.accent }, mr: 1, flexShrink: 0 }}>
            <Box component="i" className="ti ti-arrow-left" sx={{ fontSize: 16 }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>Projets</Typography>
          </Box>

          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: project.color, flexShrink: 0 }} />
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "18px", fontWeight: 700, color: C.navy }}>
            {project.name}
          </Typography>

          {/* Status badge */}
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, bgcolor: sc.bg, px: 1.5, py: 0.5, borderRadius: "20px", flexShrink: 0 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: sc.color }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: sc.color }}>{sc.label}</Typography>
          </Box>

          {/* Progress */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 180, flexShrink: 0 }}>
            <LinearProgress variant="determinate" value={project.progress}
              sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: C.border, "& .MuiLinearProgress-bar": { bgcolor: project.color, borderRadius: 3 } }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.navy, flexShrink: 0 }}>{project.progress}%</Typography>
          </Box>

          {/* Deadline */}
          {project.endDate && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: deadlineColor, flexShrink: 0 }}>
              <Box component="i" className="ti ti-calendar-event" sx={{ fontSize: 14 }} />
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500 }}>
                {formatDate(project.endDate)}{isDeadlineSoon && " · Bientôt"}{isOverDeadline && " · En retard"}
              </Typography>
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
            {canManageTasks && (
              <Button onClick={() => { setNewTaskStatus("todo"); setCreateTaskDialog(true); }}
                startIcon={<Box component="i" className="ti ti-plus" sx={{ fontSize: 14 }} />}
                sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.navy, color: "#fff", borderRadius: "9px", textTransform: "none", fontSize: "13px", px: 2, "&:hover": { bgcolor: C.navyMid } }}>
                Nouvelle tâche
              </Button>
            )}
            {canEditProject && (
              <Tooltip title="Paramètres du projet">
                <IconButton onClick={() => setEditDialog(true)}
                  sx={{ border: `1px solid ${C.border}`, borderRadius: "9px", color: C.textMuted, "&:hover": { color: C.accent, borderColor: C.accent } }}>
                  <Box component="i" className="ti ti-settings" sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ px: 4, display: "flex", gap: 0 }}>
          {tabs.map(tab => (
            <Box key={tab.id} onClick={() => setActiveTab(tab.id)}
              sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 2, py: 1.25, cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: activeTab === tab.id ? C.accent : C.textMuted, borderBottom: `2px solid ${activeTab === tab.id ? C.accent : "transparent"}`, transition: "all 0.15s", "&:hover": { color: C.navy } }}>
              <Box component="i" className={`ti ${tab.icon}`} sx={{ fontSize: 14 }} />
              {tab.label}
            </Box>
          ))}
        </Box>
      </Box>

      {/* ══ CONTENT ══ */}
      <Box sx={{ flex: 1, p: 3, overflowY: "auto" }}>

        {/* ════ BOARD TAB ════ */}
        {activeTab === "board" && (
          <Box>
          {isAdmin && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "10px 14px", bgcolor: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "10px", mb: 2 }}>
              <Box component="i" className="ti ti-eye" sx={{ fontSize: 15, color: "#3B82F6" }} />
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#3B82F6", fontWeight: 500 }}>
                Mode supervision — vous consultez ce projet sans intervenir sur les tâches
              </Typography>
            </Box>
          )}
          {dropError && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "10px 14px", bgcolor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", mb: 2 }}>
              <Box component="i" className="ti ti-alert-triangle" sx={{ fontSize: 15, color: "#DC2626" }} />
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#DC2626", fontWeight: 500 }}>
                {dropError}
              </Typography>
            </Box>
          )}
          {isTech && myTasks.length === 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "10px 14px", bgcolor: C.warningBg, border: `1px solid ${C.warning}40`, borderRadius: "10px", mb: 2 }}>
              <Box component="i" className="ti ti-info-circle" sx={{ fontSize: 15, color: C.warning }} />
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.warning, fontWeight: 500 }}>
                Aucune tâche ne vous est encore assignée dans ce projet
              </Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 2 }}>
            {Object.entries(TASK_STATUS).map(([status, config]) => {
              const colTasks = tasks.filter(t => t.status === status);
              return (
                <Box key={status} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(status)}
                  sx={{ flex: 1, minWidth: 240, maxWidth: 320 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, px: 0.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: config.color }} />
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "12px", color: config.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {config.label}
                      </Typography>
                      <Box sx={{ px: 0.8, py: 0.1, bgcolor: config.bg, borderRadius: "4px" }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "11px", color: config.color }}>{colTasks.length}</Typography>
                      </Box>
                    </Box>
                    {canManageTasks && (
                      <Tooltip title="Ajouter une tâche">
                        <IconButton size="small" onClick={() => { setNewTaskStatus(status); setCreateTaskDialog(true); }}
                          sx={{ color: C.textMuted, "&:hover": { color: C.accent } }}>
                          <Box component="i" className="ti ti-plus" sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minHeight: 80 }}>
                    {colTasks.map((task, i) => (
                      <TaskCard key={task._id} task={task} index={i}
                        dragDisabled={isTech && task.assignedTo?._id !== currentId}
                        onDragStart={() => setDragTask(task)}
                        onClick={() => setSelectedTask(task)} />
                    ))}
                    {colTasks.length === 0 && (
                      <Box onDrop={() => handleDrop(status)} onDragOver={e => e.preventDefault()}
                        sx={{ border: `2px dashed ${C.border}`, borderRadius: "12px", p: 3, textAlign: "center" }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Glisser ici</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
          </Box>
        )}

        {/* ════ TASKS TAB ════ */}
        {activeTab === "tasks" && (
          <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden" }}>
            {/* Filter chips */}
            <Box sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${C.border}`, bgcolor: C.bgPage, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              {["all", ...Object.keys(TASK_STATUS)].map(s => {
                const cfg = s === "all" ? null : TASK_STATUS[s];
                return (
                  <Chip key={s} label={cfg ? cfg.label : "Toutes"} size="small" onClick={() => setTaskStatusFilter(s)}
                    sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer",
                      bgcolor: taskStatusFilter === s ? (cfg?.bg ?? C.accentLight) : "transparent",
                      color: taskStatusFilter === s ? (cfg?.color ?? C.accent) : C.textMuted,
                      border: `1px solid ${taskStatusFilter === s ? (cfg?.color ?? C.accent) : C.border}` }} />
                );
              })}
              {canManageTasks && (
                <Button size="small" startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                  onClick={() => { setNewTaskStatus("todo"); setCreateTaskDialog(true); }}
                  sx={{ ml: "auto", fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.navy, color: "#fff", borderRadius: "8px", textTransform: "none", fontSize: "0.75rem", "&:hover": { bgcolor: C.navyMid } }}>
                  Nouvelle tâche
                </Button>
              )}
            </Box>

            {/* Table header */}
            <Box sx={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", px: 2.5, py: 1.5, bgcolor: C.bgPage, borderBottom: `1px solid ${C.border}` }}>
              {["Tâche", "Statut", "Priorité", "Assigné"].map(h => (
                <Typography key={h} sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.68rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</Typography>
              ))}
            </Box>

            {filteredTasks.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted, fontSize: "0.875rem" }}>Aucune tâche</Typography>
              </Box>
            ) : filteredTasks.map((task, index) => {
              const ts = TASK_STATUS[task.status] ?? TASK_STATUS.todo;
              const tp = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
              const av = avatarColors[index % avatarColors.length];
              const isOverdue = task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date();
              return (
                <Box key={task._id} onClick={() => setSelectedTask(task)}
                  sx={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", px: 2.5, py: 1.5, borderBottom: index < filteredTasks.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", cursor: "pointer", transition: "all 0.15s", "&:hover": { bgcolor: C.bgPage } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: "4px", border: `1.5px solid ${task.status === "done" ? C.accent : C.border}`, bgcolor: task.status === "done" ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {task.status === "done" && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </Box>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.82rem", color: task.status === "done" ? C.textMuted : C.navy, textDecoration: task.status === "done" ? "line-through" : "none" }}>{task.title}</Typography>
                    {isOverdue && (
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: 0.8, py: 0.2, borderRadius: "5px", bgcolor: "rgba(239,68,68,0.08)" }}>
                        <Box component="i" className="ti ti-clock-x" sx={{ fontSize: 11, color: "#DC2626" }} />
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: "#DC2626" }}>En retard</Typography>
                      </Box>
                    )}
                  </Box>
                  <Chip label={ts.label} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, bgcolor: ts.bg, color: ts.color, height: 20 }} />
                  <Chip label={tp.label} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, bgcolor: tp.bg, color: tp.color, height: 20 }} />
                  {task.assignedTo ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Avatar sx={{ width: 22, height: 22, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.6rem" }}>
                        {getInitials(task.assignedTo.name)}
                      </Avatar>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: C.textSecondary }}>{task.assignedTo.name.split(" ")[0]}</Typography>
                    </Box>
                  ) : <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: C.textMuted, fontStyle: "italic" }}>—</Typography>}
                </Box>
              );
            })}
          </Paper>
        )}

        {/* ════ MEMBERS TAB ════ */}
        {activeTab === "members" && (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "14px", color: C.navy }}>
                {project.members.length} membre{project.members.length !== 1 ? "s" : ""}
              </Typography>
              {canManageMembers && (
                <Button startIcon={<AddIcon />} onClick={() => setAddMemberDialog(true)}
                  sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.navy, color: "#fff", borderRadius: "9px", textTransform: "none", fontSize: "13px", "&:hover": { bgcolor: C.navyMid } }}>
                  Ajouter un membre
                </Button>
              )}
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
              {project.members.map((member, i) => {
                const av = avatarColors[i % avatarColors.length];
                const memberTasks = tasks.filter(t => t.assignedTo?._id === member._id);
                const isCreator = member._id === project.createdBy?._id;
                return (
                  <Paper key={member._id} sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "14px" }}>
                        {getInitials(member.name)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "14px", color: C.navy }}>{member.name}</Typography>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>{member.email}</Typography>
                      </Box>
                      {isCreator && <Chip label="Créateur" size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", fontWeight: 700, bgcolor: C.accentLight, color: C.accent, height: 20 }} />}
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>
                        {memberTasks.length} tâche{memberTasks.length !== 1 ? "s" : ""} assignée{memberTasks.length !== 1 ? "s" : ""}
                      </Typography>
                      {canManageMembers && !isCreator && (
                        <Button size="small" onClick={() => handleRemoveMember(member._id)}
                          sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, textTransform: "none", color: "#DC2626", bgcolor: "rgba(239,68,68,0.06)", borderRadius: "6px", "&:hover": { bgcolor: "rgba(239,68,68,0.12)" } }}>
                          Retirer
                        </Button>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        )}

        {/* ════ OVERVIEW TAB ════ */}
        {activeTab === "overview" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Stats */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(5,1fr)" }, gap: 2 }}>
              {[
                { label: "Total",       value: tasks.length,      color: C.accent,   bg: C.accentLight          },
                { label: "Todo",        value: tasks.filter(t=>t.status==="todo").length,        color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
                { label: "En cours",    value: tasks.filter(t=>t.status==="in_progress").length, color: "#2563EB", bg: "rgba(37,99,235,0.1)"   },
                { label: "Terminées",   value: doneTasks,          color: "#16A34A",  bg: "rgba(22,163,74,0.1)"  },
                { label: "En retard",   value: overdueTasks,       color: "#DC2626",  bg: "rgba(239,68,68,0.08)" },
              ].map(s => (
                <Paper key={s.label} sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2, textAlign: "center" }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.5rem", color: s.color }}>{s.value}</Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mt: 0.3, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</Typography>
                </Paper>
              ))}
            </Box>

            {/* Progress */}
            <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2.5 }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "13px", color: C.navy, mb: 2 }}>Progression globale</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <LinearProgress variant="determinate" value={project.progress}
                  sx={{ flex: 1, height: 10, borderRadius: 5, bgcolor: C.border, "& .MuiLinearProgress-bar": { bgcolor: project.color, borderRadius: 5 } }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "14px", color: C.navy, flexShrink: 0 }}>{project.progress}%</Typography>
              </Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>
                {doneTasks} tâche{doneTasks !== 1 ? "s" : ""} terminée{doneTasks !== 1 ? "s" : ""} sur {tasks.length}
              </Typography>
            </Paper>

            {/* Description */}
            {project.description && (
              <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2.5 }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "13px", color: C.navy, mb: 1 }}>Description</Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textSecondary, lineHeight: 1.6 }}>{project.description}</Typography>
              </Paper>
            )}

            {/* Timeline */}
            {(project.startDate || project.endDate) && (
              <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2.5 }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "13px", color: C.navy, mb: 2 }}>Timeline</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, flexShrink: 0 }}>{project.startDate ? formatDate(project.startDate) : "—"}</Typography>
                  <Box sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: C.border, position: "relative", overflow: "hidden" }}>
                    <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${project.progress}%`, bgcolor: project.color, borderRadius: 4, transition: "width 0.5s" }} />
                  </Box>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: deadlineColor, flexShrink: 0 }}>{project.endDate ? formatDate(project.endDate) : "—"}</Typography>
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </Box>

      {/* ════ TASK DETAIL DRAWER ════ */}
      <Drawer anchor="right" open={Boolean(selectedTask)} onClose={() => { setSelectedTask(null); setCommentInput(""); }}
        PaperProps={{ sx: { width: 460, bgcolor: C.bgPage, borderLeft: `1px solid ${C.border}` } }}>
        {selectedTask && (() => {
          const ts = TASK_STATUS[selectedTask.status] ?? TASK_STATUS.todo;
          const tp = PRIORITY_CONFIG[selectedTask.priority] ?? PRIORITY_CONFIG.medium;
          return (
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Header */}
              <Box sx={{ bgcolor: "#fff", borderBottom: `1px solid ${C.border}`, px: 2.5, py: 2 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "15px", color: C.navy, mb: 1 }}>{selectedTask.title}</Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: ts.bg }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: ts.color }}>{ts.label}</Typography>
                      </Box>
                      <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: tp.bg }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: tp.color }}>{tp.label}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={() => setSelectedTask(null)} sx={{ color: C.textMuted }}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Body */}
              <Box sx={{ flex: 1, overflow: "auto", p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Fields */}
                <Box sx={{ bgcolor: "#fff", borderRadius: "12px", border: `1px solid ${C.border}`, p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {isAdmin && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: "8px 12px", bgcolor: "rgba(59,130,246,0.06)", borderRadius: "8px", border: "1px solid rgba(59,130,246,0.2)" }}>
                      <Box component="i" className="ti ti-eye" sx={{ fontSize: 13, color: "#3B82F6" }} />
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#3B82F6", fontWeight: 500 }}>
                        Vous supervisez ce projet. Les tâches sont gérées par le Team Lead.
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                    {/* Statut — tech uniquement si tâche lui est assignée */}
                    {isTech ? (
                      selectedTask.assignedTo?._id === currentId ? (
                        <FormControl size="small" fullWidth sx={inputSx}>
                          <InputLabel>Statut</InputLabel>
                          <Select value={selectedTask.status} onChange={e => handleUpdateTask("status", e.target.value)} label="Statut">
                            {Object.entries(TASK_STATUS).map(([k,v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                      ) : (
                        <Box sx={{ px: 1.5, py: 1, bgcolor: C.bgPage, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mb: 0.3 }}>Statut</Typography>
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>{TASK_STATUS[selectedTask.status]?.label ?? selectedTask.status}</Typography>
                        </Box>
                      )
                    ) : (
                      <Box sx={{ px: 1.5, py: 1, bgcolor: C.bgPage, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mb: 0.3 }}>Statut</Typography>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>{TASK_STATUS[selectedTask.status]?.label ?? selectedTask.status}</Typography>
                      </Box>
                    )}
                    {/* Priorité — leader uniquement */}
                    {isLeader ? (
                      <FormControl size="small" fullWidth sx={inputSx}>
                        <InputLabel>Priorité</InputLabel>
                        <Select value={selectedTask.priority} onChange={e => handleUpdateTask("priority", e.target.value)} label="Priorité">
                          {Object.entries(PRIORITY_CONFIG).map(([k,v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                    ) : (
                      <Box sx={{ px: 1.5, py: 1, bgcolor: C.bgPage, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mb: 0.3 }}>Priorité</Typography>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>{PRIORITY_CONFIG[selectedTask.priority]?.label ?? selectedTask.priority}</Typography>
                      </Box>
                    )}
                  </Box>
                  {/* Assigné à — leader uniquement */}
                  {isLeader ? (
                    <FormControl size="small" fullWidth sx={inputSx}>
                      <InputLabel>Assigné à</InputLabel>
                      <Select value={selectedTask.assignedTo?._id ?? ""} onChange={e => handleUpdateTask("assignedTo", e.target.value)} label="Assigné à">
                        <MenuItem value="">Non assigné</MenuItem>
                        {project.members.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  ) : (
                    <Box sx={{ px: 1.5, py: 1, bgcolor: C.bgPage, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mb: 0.3 }}>Assigné à</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>{selectedTask.assignedTo?.name ?? "Non assigné"}</Typography>
                    </Box>
                  )}
                  {/* Date limite — leader uniquement */}
                  {isLeader ? (
                    <TextField size="small" label="Date limite" type="date" fullWidth value={selectedTask.dueDate?.slice(0,10) ?? ""} onChange={e => handleUpdateTask("dueDate", e.target.value)} sx={inputSx} InputLabelProps={{ shrink: true }} />
                  ) : selectedTask.dueDate ? (
                    <Box sx={{ px: 1.5, py: 1, bgcolor: C.bgPage, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mb: 0.3 }}>Date limite</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: C.textPrimary }}>{formatDate(selectedTask.dueDate)}</Typography>
                    </Box>
                  ) : null}
                </Box>

                {/* Description */}
                <Box sx={{ bgcolor: "#fff", borderRadius: "12px", border: `1px solid ${C.border}`, p: 2 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>Description</Typography>
                  <TextField multiline rows={3} fullWidth size="small" placeholder="Ajouter une description..." defaultValue={selectedTask.description ?? ""} onBlur={e => handleUpdateTask("description", e.target.value)} sx={inputSx} />
                </Box>

                {/* Comments */}
                <Box sx={{ bgcolor: "#fff", borderRadius: "12px", border: `1px solid ${C.border}`, p: 2 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
                    Commentaires {selectedTask.comments?.length ? `(${selectedTask.comments.length})` : ""}
                  </Typography>
                  {(selectedTask.comments ?? []).map((c, i) => {
                    const av = avatarColors[i % avatarColors.length];
                    return (
                      <Box key={c._id ?? i} sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "10px", flexShrink: 0 }}>
                          {getInitials(c.author?.name ?? "?")}
                        </Avatar>
                        <Box sx={{ flex: 1, bgcolor: C.bgPage, borderRadius: "10px", p: 1.25 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.navy }}>{c.author?.name ?? "—"}</Typography>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>
                              {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary, lineHeight: 1.5 }}>{c.content}</Typography>
                        </Box>
                      </Box>
                    );
                  })}
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <TextField size="small" fullWidth placeholder="Ajouter un commentaire..." value={commentInput} onChange={e => setCommentInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                      sx={inputSx} />
                    <Button onClick={handleAddComment} disabled={!commentInput.trim()}
                      sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.accent, color: "#fff", borderRadius: "9px", textTransform: "none", px: 2, flexShrink: 0, "&:hover": { bgcolor: C.accentHover } }}>
                      Envoyer
                    </Button>
                  </Box>
                </Box>

                {/* Infos */}
                <Box sx={{ bgcolor: "#fff", borderRadius: "12px", border: `1px solid ${C.border}`, p: 2 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>Infos</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Créé par</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500, color: C.textPrimary }}>{selectedTask.createdBy?.name ?? "—"}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>Créé le</Typography>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500, color: C.textPrimary }}>{selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleDateString("fr-FR") : "—"}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Footer */}
              {(canManageTasks || isAdmin) && (
                <Box sx={{ p: 2.5, borderTop: `1px solid ${C.border}`, bgcolor: "#fff" }}>
                  <Button fullWidth onClick={handleDeleteTask}
                    sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "none", borderRadius: "9px", bgcolor: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.2)", "&:hover": { bgcolor: "rgba(239,68,68,0.14)" } }}>
                    <Box component="i" className="ti ti-trash" sx={{ fontSize: 15, mr: 1 }} />
                    Supprimer la tâche
                  </Button>
                </Box>
              )}
            </Box>
          );
        })()}
      </Drawer>

      {/* ════ DIALOG : Create Task ════ */}
      <Dialog open={createTaskDialog} onClose={() => setCreateTaskDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.navy }}>
          Nouvelle tâche
          <IconButton onClick={() => setCreateTaskDialog(false)} size="small" sx={{ color: C.textMuted }}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: C.border }} />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          {formError && <Box sx={{ bgcolor: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", p: 1.5, fontFamily: "Inter, sans-serif", fontSize: "0.82rem" }}>{formError}</Box>}
          <TextField label="Titre" fullWidth value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} sx={inputSx} />
          <TextField label="Description" fullWidth multiline rows={2} value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} sx={inputSx} />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Statut initial</InputLabel>
              <Select value={newTaskStatus} onChange={e => setNewTaskStatus(e.target.value)} label="Statut initial">
                {Object.entries(TASK_STATUS).map(([k,v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Priorité</InputLabel>
              <Select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} label="Priorité">
                <MenuItem value="low">Faible</MenuItem>
                <MenuItem value="medium">Moyenne</MenuItem>
                <MenuItem value="high">Haute</MenuItem>
                <MenuItem value="critical">Critique</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Assigner à</InputLabel>
              <Select value={taskForm.assignedTo} onChange={e => setTaskForm(f => ({ ...f, assignedTo: e.target.value }))} label="Assigner à">
                <MenuItem value="">Non assigné</MenuItem>
                {project.members.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Date limite" type="date" size="small" fullWidth value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} sx={inputSx} InputLabelProps={{ shrink: true }} />
          </Box>
        </DialogContent>
        <Divider sx={{ borderColor: C.border }} />
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setCreateTaskDialog(false)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, textTransform: "none", borderRadius: "10px" }}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateTask} disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={14} sx={{ color: C.navy }} /> : <AddIcon />}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, bgcolor: C.accent, color: "#fff", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { bgcolor: C.accentHover } }}>
            {formLoading ? "Création..." : "Créer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════ DIALOG : Edit Project ════ */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.navy }}>
          Modifier le projet
          <IconButton onClick={() => setEditDialog(false)} size="small" sx={{ color: C.textMuted }}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: C.border }} />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Nom" fullWidth value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} sx={inputSx} />
          <TextField label="Description" fullWidth multiline rows={3} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} sx={inputSx} />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Statut</InputLabel>
              <Select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} label="Statut">
                {PROJECT_STATUSES.map(s => <MenuItem key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Priorité</InputLabel>
              <Select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))} label="Priorité">
                <MenuItem value="low">Faible</MenuItem>
                <MenuItem value="medium">Moyenne</MenuItem>
                <MenuItem value="high">Haute</MenuItem>
                <MenuItem value="critical">Critique</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField label="Date de fin" type="date" fullWidth size="small" value={editForm.endDate} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))} sx={inputSx} InputLabelProps={{ shrink: true }} />
          <Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textMuted, mb: 1 }}>Couleur</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {PROJECT_COLORS.map(color => (
                <Box key={color} onClick={() => setEditForm(f => ({ ...f, color }))}
                  sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: color, cursor: "pointer", border: `3px solid ${editForm.color === color ? C.navy : "transparent"}`, transition: "all 0.15s", "&:hover": { transform: "scale(1.15)" } }} />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <Divider sx={{ borderColor: C.border }} />
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setEditDialog(false)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, textTransform: "none", borderRadius: "10px" }}>Annuler</Button>
          <Button variant="contained" onClick={handleUpdateProject}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, bgcolor: C.accent, color: "#fff", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { bgcolor: C.accentHover } }}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════ DIALOG : Add Member ════ */}
      <Dialog open={addMemberDialog} onClose={() => setAddMemberDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.navy }}>
          Ajouter un membre
          <IconButton onClick={() => setAddMemberDialog(false)} size="small" sx={{ color: C.textMuted }}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: C.border }} />
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 320, overflowY: "auto" }}>
            {allUsers.filter(u => !project.members.find(m => m._id === u._id)).map((u, i) => {
              const av = avatarColors[i % avatarColors.length];
              return (
                <Box key={u._id} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "10px", border: `1px solid ${C.border}`, bgcolor: C.bgPage }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.75rem" }}>{getInitials(u.name)}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", color: C.navy }}>{u.name}</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{u.email}</Typography>
                  </Box>
                  <Button size="small" variant="contained" onClick={() => handleAddMember(u._id)}
                    sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.accent, color: "#fff", borderRadius: "8px", textTransform: "none", "&:hover": { bgcolor: C.accentHover } }}>
                    Ajouter
                  </Button>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
