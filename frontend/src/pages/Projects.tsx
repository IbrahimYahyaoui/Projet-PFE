// frontend/src/pages/Projects.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Typography, Paper, Avatar, Chip, CircularProgress,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Select, FormControl, InputLabel,
  IconButton, Tooltip, Divider, Drawer,
} from "@mui/material";
import {
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon,
  Close as CloseIcon, PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { C, priorityColors, statusColors } from "../theme";

// ─── Types ───────────────────────────────────────────────────
interface Member { _id: string; name: string; email: string; role: string }
interface TeamRef { _id: string; name: string; color: string; tag: string }
interface Project {
  _id: string; name: string; description: string; status: string;
  priority: string; startDate: string; endDate: string; color: string;
  createdBy: Member; managerId: Member; members: Member[];
  progress: number; totalTasks: number; doneTasks: number; createdAt: string;
  teamId?: TeamRef | null;
}
interface Task {
  _id: string; title: string; description: string; status: string;
  priority: string; assignedTo: Member | null; createdBy: Member;
  dueDate: string; projectId: string; createdAt: string;
}
interface Stats {
  totalProjects: number; totalTasks: number; doneTasks: number;
  overdueTasks: number; totalMembers: number;
}

// ─── Helpers ─────────────────────────────────────────────────
const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—";

const PROJECT_COLORS = ["#5FC2BA", "#2563EB", "#7C3AED", "#EA580C", "#16A34A", "#DC2626", "#F59E0B"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planning:    { label: "Planning",     color: "#2563EB", bg: "rgba(37,99,235,0.1)" },
  in_progress: { label: "In Progress",  color: "#0E9188", bg: "rgba(95,194,186,0.1)" },
  at_risk:     { label: "At Risk",      color: "#DC2626", bg: "rgba(239,68,68,0.08)" },
  completed:   { label: "Completed",    color: "#16A34A", bg: "rgba(22,163,74,0.1)" },
  on_hold:     { label: "On Hold",      color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
};

const TASK_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  todo:        { label: "Todo",         color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  in_progress: { label: "In Progress",  color: "#2563EB", bg: "rgba(37,99,235,0.1)" },
  review:      { label: "Review",       color: "#EA580C", bg: "rgba(234,88,12,0.1)" },
  done:        { label: "Done",         color: "#16A34A", bg: "rgba(22,163,74,0.1)" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: "Low",      color: "#16A34A", bg: "rgba(22,163,74,0.1)" },
  medium:   { label: "Medium",   color: "#2563EB", bg: "rgba(37,99,235,0.1)" },
  high:     { label: "High",     color: "#EA580C", bg: "rgba(234,88,12,0.1)" },
  critical: { label: "Critical", color: "#DC2626", bg: "rgba(239,68,68,0.08)" },
};

const avatarColors = [
  { bg: C.accentLight, color: "#0E9188" },
  { bg: "rgba(59,130,246,0.12)", color: "#2563EB" },
  { bg: "rgba(124,58,237,0.12)", color: "#7C3AED" },
  { bg: "rgba(249,115,22,0.12)", color: "#EA580C" },
  { bg: "rgba(239,68,68,0.08)", color: "#DC2626" },
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

// ── Project Icon ──
const ProjectIcon = () => (
  <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: C.navy, border: `2px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  </Box>
);

// ════════════════════════════════════════════════════════════
export default function Projects() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [addMemberDialog, setAddMemberDialog] = useState<string | null>(null);
  const [createTaskDialog, setCreateTaskDialog] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<Member[]>([]);
  const [kanbanProject, setKanbanProject] = useState<string>("");
  const [kanbanTasks, setKanbanTasks] = useState<Task[]>([]);
  const [dragTask, setDragTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentInput, setCommentInput] = useState("");

  // Task filters
  const [taskSearch,   setTaskSearch]   = useState("");
  const [taskStatus,   setTaskStatus]   = useState("all");
  const [taskPriority, setTaskPriority] = useState("all");
  const [taskProject,  setTaskProject]  = useState("all");
  const [myTasksOnly,  setMyTasksOnly]  = useState(false);

  // Teams list for admin
  const [allTeams, setAllTeams] = useState<TeamRef[]>([]);

  // Forms
  const [projectForm, setProjectForm] = useState({ name: "", description: "", priority: "medium", color: "#5FC2BA", endDate: "", teamId: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", assignedTo: "", dueDate: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin   = currentUser?.role === "admin";
  const canCreate = ["admin", "leader"].includes(currentUser?.role ?? "");
  const currentUserId = currentUser?.id ?? currentUser?._id ?? "";

  // ── Fetch ──────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [projRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/api/projects`, { headers }),
        fetch(`${apiUrl}/api/projects/stats`, { headers }),
      ]);
      const projData = await projRes.json();
      const statsData = await statsRes.json();
      if (projRes.ok) setProjects(projData);
      if (statsRes.ok) setStats(statsData);

      // Fetch tasks de tous les projets pour "Tasks" tab
      if (projData.length > 0) {
        const tasksPromises = projData.map((p: Project) =>
          fetch(`${apiUrl}/api/projects/${p._id}/tasks`, { headers }).then(r => r.json())
        );
        const tasksArrays = await Promise.all(tasksPromises);
        setAllTasks(tasksArrays.flat());
      }
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setAllUsers(data);
    } catch (err) { console.log(err); }
  };

  const fetchKanbanTasks = async (projectId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/projects/${projectId}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setKanbanTasks(data);
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    fetchAll();
    fetchUsers();
    if (isAdmin) {
      const token = localStorage.getItem("token");
      fetch(`${apiUrl}/api/team/all`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setAllTeams(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const tab = (location.state as any)?.tab;
    if (tab) setActiveTab(tab);
  }, []);

  useEffect(() => {
    if (activeTab === "kanban" && projects.length > 0) {
      const pid = kanbanProject || projects[0]._id;
      setKanbanProject(pid);
      fetchKanbanTasks(pid);
    }
  }, [activeTab]);

  // ── Create Project ─────────────────────────────────────────
  const handleCreateProject = async () => {
    if (!projectForm.name.trim()) { setFormError("Le nom est obligatoire"); return; }
    setFormLoading(true); setFormError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(projectForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCreateDialog(false);
      setProjectForm({ name: "", description: "", priority: "medium", color: "#5FC2BA", endDate: "", teamId: "" });
      fetchAll();
    } catch (err: any) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  // ── Delete Project ─────────────────────────────────────────
  const handleDeleteProject = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/projects/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setDeleteDialog(null);
      fetchAll();
    } catch (err) { console.log(err); }
  };

  // ── Add Member ─────────────────────────────────────────────
  const handleAddMember = async (projectId: string, userId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      });
      fetchAll();
    } catch (err) { console.log(err); }
  };

  // ── Create Task ────────────────────────────────────────────
  const handleCreateTask = async (projectId: string) => {
    if (!taskForm.title.trim()) { setFormError("Le titre est obligatoire"); return; }
    setFormLoading(true); setFormError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(taskForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCreateTaskDialog(null);
      setTaskForm({ title: "", description: "", priority: "medium", assignedTo: "", dueDate: "" });
      fetchAll();
      if (activeTab === "kanban") fetchKanbanTasks(projectId);
    } catch (err: any) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  // ── Kanban drag & drop ─────────────────────────────────────
  const handleDrop = async (status: string) => {
    if (!dragTask || dragTask.status === status) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/projects/${dragTask.projectId}/tasks/${dragTask._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setKanbanTasks(prev => prev.map(t => t._id === dragTask._id ? { ...t, status } : t));
      setDragTask(null);
    } catch (err) { console.log(err); }
  };

  // ── Task drawer handlers ───────────────────────────────────
  const handleUpdateTask = async (field: string, value: string) => {
    if (!selectedTask) return;
    const token = localStorage.getItem("token");
    await fetch(`${apiUrl}/api/projects/${selectedTask.projectId}/tasks/${selectedTask._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [field]: value }),
    });
    const updated = { ...selectedTask, [field]: value };
    setAllTasks(prev => prev.map(t => t._id === selectedTask._id ? { ...t, [field]: value } : t));
    setKanbanTasks(prev => prev.map(t => t._id === selectedTask._id ? { ...t, [field]: value } : t));
    setSelectedTask(updated);
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    const token = localStorage.getItem("token");
    await fetch(`${apiUrl}/api/projects/${selectedTask.projectId}/tasks/${selectedTask._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setAllTasks(prev => prev.filter(t => t._id !== selectedTask._id));
    setKanbanTasks(prev => prev.filter(t => t._id !== selectedTask._id));
    setSelectedTask(null);
  };

  // ── Sub navbar tabs ────────────────────────────────────────
  const tabs = [
    { id: "overview", label: "Overview", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { id: "tasks",    label: "Tasks",    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
    { id: "kanban",   label: "Kanban",   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> },
    { id: "teams",    label: "Teams",    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  ];

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: C.accent }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: C.bgPage, fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ══ SECOND NAVBAR ══ */}
      <Box sx={{ bgcolor: "#FFFFFF", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", px: 3, height: 46, flexShrink: 0, gap: 0 }}>
        {tabs.map((tab) => (
          <Box
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 2, height: "100%", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", color: activeTab === tab.id ? C.accent : C.textMuted, borderBottom: `2px solid ${activeTab === tab.id ? C.accent : "transparent"}`, transition: "all 0.2s", whiteSpace: "nowrap", "&:hover": { color: activeTab === tab.id ? C.accent : C.navy } }}
          >
            <Box sx={{ color: "inherit" }}>{tab.icon}</Box>
            {tab.label}
          </Box>
        ))}

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: C.textMuted, display: "flex", alignItems: "center", gap: 0.5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Q2 2026
          </Typography>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => setCreateDialog(true)}
              sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, bgcolor: C.accent, color: "#fff", borderRadius: "8px", textTransform: "none", fontSize: "0.78rem", px: 2, py: 0.8, "&:hover": { bgcolor: C.accentHover } }}>
              New Project
            </Button>
          )}
        </Box>
      </Box>

      {/* ══ CONTENT ══ */}
      <Box sx={{ flex: 1, p: 3, overflowY: "auto" }}>

        {/* ════ OVERVIEW TAB ════ */}
        {activeTab === "overview" && (
          <>
            {/* Stats */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
              {[
                { label: "Total Projects", value: stats?.totalProjects ?? 0, color: C.accent, bg: C.accentLight, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
                { label: "Tasks Done",     value: stats?.doneTasks ?? 0,     color: "#2563EB", bg: "rgba(37,99,235,0.1)", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
                { label: "Overdue Tasks",  value: stats?.overdueTasks ?? 0,  color: "#EA580C", bg: "rgba(234,88,12,0.1)", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                { label: "Team Members",   value: stats?.totalMembers ?? 0,  color: "#16A34A", bg: "rgba(22,163,74,0.1)", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              ].map((s) => (
                <Paper key={s.label} sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 2.5, display: "flex", alignItems: "center", gap: 2, transition: "all 0.2s", "&:hover": { borderColor: C.accent, transform: "translateY(-2px)" } }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</Box>
                  <Box>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.5rem", color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", color: C.textMuted, mt: 0.3, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</Typography>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* Projects Grid */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: C.navy }}>Active Projects</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: C.textMuted }}>{projects.length} projets</Typography>
            </Box>

            {projects.length === 0 ? (
              <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 6, textAlign: "center" }}>
                <Box sx={{ width: 60, height: 60, bgcolor: C.accentLight, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </Box>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", color: C.navy, mb: 0.5 }}>Aucun projet</Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: C.textMuted, mb: 2 }}>Créez votre premier projet pour commencer</Typography>
                {canCreate && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialog(true)}
                    sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.accent, color: "#fff", borderRadius: "10px", textTransform: "none", "&:hover": { bgcolor: C.accentHover } }}>
                    Créer un projet
                  </Button>
                )}
              </Paper>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
                {projects.map((project) => {
                  const sc = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planning;
                  return (
                    <Paper key={project._id}
                      onClick={() => navigate(`/projects/${project._id}`)}
                      sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden", cursor: "pointer", transition: "all 0.2s", "&:hover": { borderColor: project.color, transform: "translateY(-2px)", boxShadow: C.shadowMd } }}>
                      {/* Color top bar */}
                      <Box sx={{ height: 6, bgcolor: project.color }} />
                      <Box sx={{ p: 2.5 }}>
                        {/* Status badge */}
                        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, bgcolor: sc.bg, px: 1.2, py: 0.4, borderRadius: "20px", mb: 1.5 }}>
                          <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: sc.color }} />
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", fontWeight: 700, color: sc.color }}>{sc.label}</Typography>
                        </Box>

                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: C.navy, mb: 0.5 }}>{project.name}</Typography>
                        {project.teamId && (
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, bgcolor: `${project.teamId.color}15`, border: `1px solid ${project.teamId.color}40`, borderRadius: "6px", px: 1, py: 0.3, mb: 0.8 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: project.teamId.color }} />
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: project.teamId.color }}>{project.teamId.name}</Typography>
                          </Box>
                        )}
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: C.textMuted, mb: 1.5, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {project.description || "Aucune description"}
                        </Typography>

                        {/* Progress */}
                        <Box sx={{ mb: 1.5 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", color: C.textMuted }}>Progress</Typography>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", fontWeight: 700, color: C.navy }}>{project.progress}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={project.progress}
                            sx={{ height: 5, borderRadius: 3, bgcolor: C.border, "& .MuiLinearProgress-bar": { bgcolor: project.color, borderRadius: 3 } }} />
                        </Box>

                        {/* Footer */}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1.5, borderTop: `1px solid ${C.border}` }}>
                          <Box sx={{ display: "flex" }}>
                            {project.members.slice(0, 4).map((m, i) => {
                              const av = avatarColors[i % avatarColors.length];
                              return (
                                <Avatar key={m._id} sx={{ width: 22, height: 22, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.55rem", border: "2px solid white", ml: i > 0 ? "-6px" : 0 }}>
                                  {getInitials(m.name)}
                                </Avatar>
                              );
                            })}
                            {project.members.length > 4 && (
                              <Avatar sx={{ width: 22, height: 22, bgcolor: C.border, color: C.textMuted, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.55rem", border: "2px solid white", ml: "-6px" }}>
                                +{project.members.length - 4}
                              </Avatar>
                            )}
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            {canCreate && (
                              <>
                                <Tooltip title="Ajouter membre">
                                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAddMemberDialog(project._id); }}
                                    sx={{ color: C.textMuted, "&:hover": { color: C.accent, bgcolor: C.accentLight } }}>
                                    <PersonAddIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Supprimer">
                                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteDialog(project._id); }}
                                    sx={{ color: C.textMuted, "&:hover": { color: "#DC2626", bgcolor: "rgba(239,68,68,0.08)" } }}>
                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {project.endDate && (
                              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", color: C.textMuted, display: "flex", alignItems: "center", gap: 0.3 }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                {formatDate(project.endDate)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </>
        )}

        {/* ════ TASKS TAB ════ */}
        {activeTab === "tasks" && (() => {
          const filteredTasks = allTasks.filter(t =>
            (!taskSearch   || t.title.toLowerCase().includes(taskSearch.toLowerCase())) &&
            (taskStatus   === "all" || t.status   === taskStatus) &&
            (taskPriority === "all" || t.priority === taskPriority) &&
            (taskProject  === "all" || t.projectId === taskProject) &&
            (!myTasksOnly  || t.assignedTo?._id === currentUserId)
          );
          return (
          <Paper sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden" }}>
            {/* Filters bar */}
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.border}`, bgcolor: C.bgPage, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <TextField size="small" placeholder="Rechercher..." value={taskSearch} onChange={e => setTaskSearch(e.target.value)}
                sx={{ ...inputSx, minWidth: 180 }} />
              <FormControl size="small" sx={{ ...inputSx, minWidth: 130 }}>
                <InputLabel>Statut</InputLabel>
                <Select value={taskStatus} onChange={e => setTaskStatus(e.target.value)} label="Statut">
                  <MenuItem value="all">Tous</MenuItem>
                  {Object.entries(TASK_STATUS).map(([k,v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ ...inputSx, minWidth: 130 }}>
                <InputLabel>Priorité</InputLabel>
                <Select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} label="Priorité">
                  <MenuItem value="all">Toutes</MenuItem>
                  {Object.entries(PRIORITY_CONFIG).map(([k,v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ ...inputSx, minWidth: 150 }}>
                <InputLabel>Projet</InputLabel>
                <Select value={taskProject} onChange={e => setTaskProject(e.target.value)} label="Projet">
                  <MenuItem value="all">Tous</MenuItem>
                  {projects.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Chip label="Mes tâches" size="small" onClick={() => setMyTasksOnly(v => !v)}
                sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", fontWeight: 600,
                  bgcolor: myTasksOnly ? C.accent : C.accentLight, color: myTasksOnly ? C.navy : C.accent,
                  cursor: "pointer", border: `1px solid ${myTasksOnly ? C.accent : "transparent"}` }} />
              {canCreate && (
                <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                  {projects.map(p => (
                    <Chip key={p._id} label={`+ ${p.name}`} size="small" onClick={() => setCreateTaskDialog(p._id)}
                      sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, bgcolor: C.accentLight, color: C.accent, cursor: "pointer", "&:hover": { bgcolor: C.accent, color: C.navy } }} />
                  ))}
                </Box>
              )}
            </Box>

            {/* Table header */}
            <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", px: 2.5, py: 1.5, bgcolor: C.bgPage, borderBottom: `1px solid ${C.border}` }}>
              {["Tâche", "Projet", "Statut", "Priorité", "Assigné"].map(h => (
                <Typography key={h} sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.68rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</Typography>
              ))}
            </Box>

            {filteredTasks.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted, fontSize: "0.875rem" }}>Aucune tâche</Typography>
              </Box>
            ) : (
              filteredTasks.map((task, index) => {
                const ts = TASK_STATUS[task.status] ?? TASK_STATUS.todo;
                const tp = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
                const proj = projects.find(p => p._id === task.projectId);
                const av = avatarColors[index % avatarColors.length];
                const isOverdue = task.dueDate && !["done"].includes(task.status) && new Date(task.dueDate) < new Date();
                return (
                  <Box key={task._id} onClick={() => setSelectedTask(task)}
                    sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", px: 2.5, py: 1.5, borderBottom: index < filteredTasks.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", transition: "all 0.15s", cursor: "pointer", "&:hover": { bgcolor: C.bgPage } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: "4px", border: `1.5px solid ${task.status === "done" ? C.accent : C.border}`, bgcolor: task.status === "done" ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {task.status === "done" && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </Box>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.82rem", color: task.status === "done" ? C.textMuted : C.navy, textDecoration: task.status === "done" ? "line-through" : "none" }}>{task.title}</Typography>
                      {isOverdue && (
                        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: 0.8, py: 0.2, borderRadius: "5px", bgcolor: "rgba(239,68,68,0.08)", ml: 1 }}>
                          <Box component="i" className="ti ti-clock-x" sx={{ fontSize: 11, color: "#DC2626" }} />
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: "#DC2626" }}>En retard</Typography>
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {proj && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: proj.color, flexShrink: 0 }} />}
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: C.textMuted }}>{proj?.name ?? "—"}</Typography>
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
                    ) : (
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: C.textMuted, fontStyle: "italic" }}>Non assigné</Typography>
                    )}
                  </Box>
                );
              })
            )}
          </Paper>
          );
        })()}

        {/* ════ KANBAN TAB ════ */}
        {activeTab === "kanban" && (
          <>
            {/* Project selector */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: C.textMuted }}>Projet :</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {projects.map(p => (
                  <Box key={p._id} onClick={() => { setKanbanProject(p._id); fetchKanbanTasks(p._id); }}
                    sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.6, borderRadius: "8px", cursor: "pointer", border: `1.5px solid ${kanbanProject === p._id ? p.color : C.border}`, bgcolor: kanbanProject === p._id ? `${p.color}10` : C.card, transition: "all 0.2s" }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.color }} />
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", fontWeight: 600, color: kanbanProject === p._id ? p.color : C.textMuted }}>{p.name}</Typography>
                  </Box>
                ))}
                {kanbanProject && canCreate && (
                  <Button size="small" startIcon={<AddIcon />} onClick={() => setCreateTaskDialog(kanbanProject)}
                    sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.navy, color: "#fff", borderRadius: "8px", textTransform: "none", fontSize: "0.75rem", px: 1.5, "&:hover": { bgcolor: C.navyMid } }}>
                    Add Task
                  </Button>
                )}
              </Box>
            </Box>

            {/* Kanban columns */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
              {Object.entries(TASK_STATUS).map(([status, config]) => {
                const colTasks = kanbanTasks.filter(t => t.status === status);
                return (
                  <Box key={status}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(status)}
                    sx={{ minHeight: 400 }}
                  >
                    {/* Column header */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, px: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.75rem", color: config.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>{config.label}</Typography>
                      </Box>
                      <Box sx={{ bgcolor: config.bg, color: config.color, fontFamily: "Inter, sans-serif", fontSize: "0.68rem", fontWeight: 700, width: 20, height: 20, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {colTasks.length}
                      </Box>
                    </Box>

                    {/* Cards */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {colTasks.map((task, i) => {
                        const tp = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
                        const av = avatarColors[i % avatarColors.length];
                        const isOverdue = task.dueDate && !["done"].includes(task.status) && new Date(task.dueDate) < new Date();
                        return (
                          <Paper key={task._id} draggable onDragStart={() => setDragTask(task)}
                            onClick={() => setSelectedTask(task)}
                            sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", p: 1.5, cursor: "pointer", transition: "all 0.15s", "&:hover": { borderColor: config.color, boxShadow: C.shadowMd, transform: "translateY(-1px)" }, "&:active": { cursor: "grabbing" } }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.8rem", color: C.navy, mb: 1 }}>{task.title}</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1, flexWrap: "wrap" }}>
                              <Chip label={tp.label} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", fontWeight: 600, bgcolor: tp.bg, color: tp.color, height: 18 }} />
                              {isOverdue && (
                                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.3, px: 0.7, py: 0.2, borderRadius: "5px", bgcolor: "rgba(239,68,68,0.08)" }}>
                                  <Box component="i" className="ti ti-clock-x" sx={{ fontSize: 10, color: "#DC2626" }} />
                                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "9px", fontWeight: 700, color: "#DC2626" }}>En retard</Typography>
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              {task.dueDate ? (
                                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", color: isOverdue ? "#DC2626" : C.textMuted, display: "flex", alignItems: "center", gap: 0.3, fontWeight: isOverdue ? 600 : 400 }}>
                                  <Box component="i" className="ti ti-calendar" sx={{ fontSize: 10 }} />
                                  {formatDate(task.dueDate)}
                                </Typography>
                              ) : <Box />}
                              {task.assignedTo ? (
                                <Avatar sx={{ width: 20, height: 20, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.55rem" }}>
                                  {getInitials(task.assignedTo.name)}
                                </Avatar>
                              ) : (
                                <Box sx={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px dashed ${C.border}` }} />
                              )}
                            </Box>
                          </Paper>
                        );
                      })}
                      {colTasks.length === 0 && (
                        <Box sx={{ border: `2px dashed ${C.border}`, borderRadius: "10px", p: 3, textAlign: "center" }}>
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: C.textMuted }}>Drop here</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        {/* ════ TEAMS TAB ════ */}
        {activeTab === "teams" && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
            {projects.map((project) => (
              <Paper key={project._id} sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: project.color }} />
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.875rem", color: C.navy }}>{project.name}</Typography>
                  <Chip label={`${project.members.length} membres`} size="small" sx={{ ml: "auto", fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, bgcolor: C.accentLight, color: C.accent, height: 20 }} />
                </Box>
                <Box sx={{ p: 1.5 }}>
                  {project.members.map((member, i) => {
                    const av = avatarColors[i % avatarColors.length];
                    return (
                      <Box key={member._id} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "8px 10px", borderRadius: "8px", "&:hover": { bgcolor: C.bgPage } }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem" }}>
                          {getInitials(member.name)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.82rem", color: C.navy }}>{member.name}</Typography>
                          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", color: C.textMuted, textTransform: "capitalize" }}>{member.role}</Typography>
                        </Box>
                        {member._id === project.createdBy?._id && (
                          <Chip label="Leader" size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", fontWeight: 700, bgcolor: C.accentLight, color: C.accent, height: 18 }} />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      {/* ════ DIALOG : Create Project ════ */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.navy }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}><ProjectIcon />Nouveau projet</Box>
          <IconButton onClick={() => setCreateDialog(false)} size="small" sx={{ color: C.textMuted }}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: C.border }} />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          {formError && <Box sx={{ bgcolor: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", p: 1.5, fontFamily: "Inter, sans-serif", fontSize: "0.82rem" }}>{formError}</Box>}
          <TextField label="Nom du projet" fullWidth value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))} sx={inputSx} />
          <TextField label="Description" fullWidth multiline rows={3} value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} sx={inputSx} />
          {isAdmin && (
            <Box>
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Équipe (optionnel)</InputLabel>
                <Select value={projectForm.teamId} onChange={e => setProjectForm(f => ({ ...f, teamId: e.target.value }))} label="Équipe (optionnel)">
                  <MenuItem value=""><em>Aucune équipe</em></MenuItem>
                  {allTeams.map(t => (
                    <MenuItem key={t._id} value={t._id}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: t.color, flexShrink: 0 }} />
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>{t.name}</Typography>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, ml: "auto" }}>{t.tag}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted, mt: 0.5 }}>
                Si une équipe est sélectionnée, ses membres sont automatiquement ajoutés au projet.
              </Typography>
            </Box>
          )}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Priorité</InputLabel>
              <Select value={projectForm.priority} onChange={e => setProjectForm(f => ({ ...f, priority: e.target.value }))} label="Priorité">
                <MenuItem value="low">Faible</MenuItem>
                <MenuItem value="medium">Moyenne</MenuItem>
                <MenuItem value="high">Haute</MenuItem>
                <MenuItem value="critical">Critique</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Date de fin" type="date" fullWidth size="small" value={projectForm.endDate} onChange={e => setProjectForm(f => ({ ...f, endDate: e.target.value }))} sx={inputSx} InputLabelProps={{ shrink: true }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: C.textMuted, mb: 1 }}>Couleur du projet</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {PROJECT_COLORS.map(color => (
                <Box key={color} onClick={() => setProjectForm(f => ({ ...f, color }))}
                  sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: color, cursor: "pointer", border: `3px solid ${projectForm.color === color ? C.navy : "transparent"}`, transition: "all 0.15s", "&:hover": { transform: "scale(1.15)" } }} />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <Divider sx={{ borderColor: C.border }} />
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setCreateDialog(false)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, textTransform: "none", borderRadius: "10px" }}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateProject} disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={14} sx={{ color: C.navy }} /> : <AddIcon />}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, bgcolor: C.accent, color: "#fff", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { bgcolor: C.accentHover } }}>
            {formLoading ? "Création..." : "Créer le projet"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════ DIALOG : Add Member ════ */}
      <Dialog open={!!addMemberDialog} onClose={() => setAddMemberDialog(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.navy }}>
          Ajouter un membre
          <IconButton onClick={() => setAddMemberDialog(null)} size="small" sx={{ color: C.textMuted }}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: C.border }} />
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 320, overflowY: "auto" }}>
            {allUsers.filter(u => {
              const proj = projects.find(p => p._id === addMemberDialog);
              return !proj?.members.find(m => m._id === u._id);
            }).map((u, i) => {
              const av = avatarColors[i % avatarColors.length];
              return (
                <Box key={u._id} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "10px", border: `1px solid ${C.border}`, bgcolor: C.bgPage, "&:hover": { borderColor: C.accent, bgcolor: C.accentLight } }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: av.bg, color: av.color, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.75rem" }}>
                    {getInitials(u.name)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: C.navy }}>{u.name}</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: C.textMuted }}>{u.email}</Typography>
                  </Box>
                  <Chip label={u.role} size="small" sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", textTransform: "capitalize", height: 20 }} />
                  <Button size="small" variant="contained" onClick={() => { handleAddMember(addMemberDialog!, u._id); }}
                    sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, bgcolor: C.accent, color: "#fff", borderRadius: "8px", textTransform: "none", minWidth: 70, "&:hover": { bgcolor: C.accentHover } }}>
                    Ajouter
                  </Button>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>

      {/* ════ DIALOG : Create Task ════ */}
      <Dialog open={!!createTaskDialog} onClose={() => setCreateTaskDialog(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.navy }}>
          Nouvelle tâche
          <IconButton onClick={() => setCreateTaskDialog(null)} size="small" sx={{ color: C.textMuted }}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: C.border }} />
        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          {formError && <Box sx={{ bgcolor: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", p: 1.5, fontFamily: "Inter, sans-serif", fontSize: "0.82rem" }}>{formError}</Box>}
          <TextField label="Titre de la tâche" fullWidth value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} sx={inputSx} />
          <TextField label="Description" fullWidth multiline rows={2} value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} sx={inputSx} />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Priorité</InputLabel>
              <Select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} label="Priorité">
                <MenuItem value="low">Faible</MenuItem>
                <MenuItem value="medium">Moyenne</MenuItem>
                <MenuItem value="high">Haute</MenuItem>
                <MenuItem value="critical">Critique</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Assigner à</InputLabel>
              <Select value={taskForm.assignedTo} onChange={e => setTaskForm(f => ({ ...f, assignedTo: e.target.value }))} label="Assigner à">
                <MenuItem value="">Non assigné</MenuItem>
                {allUsers.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField label="Date limite" type="date" fullWidth size="small" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} sx={inputSx} InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <Divider sx={{ borderColor: C.border }} />
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setCreateTaskDialog(null)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, textTransform: "none", borderRadius: "10px" }}>Annuler</Button>
          <Button variant="contained" onClick={() => handleCreateTask(createTaskDialog!)} disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={14} sx={{ color: C.navy }} /> : <AddIcon />}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, bgcolor: C.accent, color: "#fff", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { bgcolor: C.accentHover } }}>
            {formLoading ? "Création..." : "Créer la tâche"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════ TASK DETAIL DRAWER ════ */}
      <Drawer anchor="right" open={Boolean(selectedTask)} onClose={() => setSelectedTask(null)}
        PaperProps={{ sx: { width: 460, bgcolor: C.bgPage, borderLeft: `1px solid ${C.border}` } }}>
        {selectedTask && (() => {
          const ts = TASK_STATUS[selectedTask.status] ?? TASK_STATUS.todo;
          const tp = PRIORITY_CONFIG[selectedTask.priority] ?? PRIORITY_CONFIG.medium;
          const proj = projects.find(p => p._id === selectedTask.projectId);
          return (
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Header */}
              <Box sx={{ bgcolor: "#fff", borderBottom: `1px solid ${C.border}`, px: 2.5, py: 2, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "15px", color: C.navy, mb: 1 }}>{selectedTask.title}</Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: ts.bg }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: ts.color }}>{ts.label}</Typography>
                    </Box>
                    <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: tp.bg }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: tp.color }}>{tp.label}</Typography>
                    </Box>
                    {proj && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.3, borderRadius: "6px", bgcolor: C.bgPage }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: proj.color }} />
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>{proj.name}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => setSelectedTask(null)} sx={{ color: C.textMuted }}>
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>

              {/* Body */}
              <Box sx={{ flex: 1, overflow: "auto", p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Fields */}
                <Box sx={{ bgcolor: "#fff", borderRadius: "12px", border: `1px solid ${C.border}`, p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                    <FormControl size="small" fullWidth sx={inputSx}>
                      <InputLabel>Statut</InputLabel>
                      <Select value={selectedTask.status} onChange={e => handleUpdateTask("status", e.target.value)} label="Statut">
                        {Object.entries(TASK_STATUS).map(([k,v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth sx={inputSx}>
                      <InputLabel>Priorité</InputLabel>
                      <Select value={selectedTask.priority} onChange={e => handleUpdateTask("priority", e.target.value)} label="Priorité">
                        {Object.entries(PRIORITY_CONFIG).map(([k,v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Box>
                  <FormControl size="small" fullWidth sx={inputSx}>
                    <InputLabel>Assigné à</InputLabel>
                    <Select value={selectedTask.assignedTo?._id ?? ""} onChange={e => handleUpdateTask("assignedTo", e.target.value)} label="Assigné à">
                      <MenuItem value="">Non assigné</MenuItem>
                      {(proj ? proj.members : allUsers).map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField size="small" label="Date limite" type="date" fullWidth value={selectedTask.dueDate?.slice(0,10) ?? ""} onChange={e => handleUpdateTask("dueDate", e.target.value)} sx={inputSx} InputLabelProps={{ shrink: true }} />
                </Box>

                {/* Description */}
                <Box sx={{ bgcolor: "#fff", borderRadius: "12px", border: `1px solid ${C.border}`, p: 2 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>Description</Typography>
                  <TextField multiline rows={3} fullWidth size="small" placeholder="Ajouter une description..." value={selectedTask.description ?? ""} onChange={e => handleUpdateTask("description", e.target.value)} sx={inputSx} />
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
              {canCreate && (
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

      {/* ════ DIALOG : Delete ════ */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: C.navy }}>Supprimer le projet</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, fontSize: "0.9rem" }}>
            Cette action supprimera le projet et toutes ses tâches. Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteDialog(null)} sx={{ fontFamily: "Inter, sans-serif", color: C.textSecondary, textTransform: "none", borderRadius: "10px" }}>Annuler</Button>
          <Button variant="contained" onClick={() => handleDeleteProject(deleteDialog!)}
            sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, bgcolor: "#DC2626", color: "white", borderRadius: "10px", textTransform: "none", px: 3, "&:hover": { bgcolor: "#B91C1C" } }}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}