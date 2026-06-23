// frontend/src/components/Navbar.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Typography, Avatar, Badge, IconButton,
  Popover, List, ListItemButton, ListItemText, Divider, InputBase,
} from "@mui/material";
import {
  Notifications as NotifIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  KeyboardArrowDown as ArrowIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { C, PERMISSIONS } from "../theme";
import type { UserRole } from "../theme";
import { useCurrentUser } from "../App";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

interface NotifItem {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  triggeredBy?: { name: string };
  ticketId?: { _id: string; title: string } | null;
}

interface SubItem {
  label: string;
  path: string;
  icon: string;
  permission?: keyof typeof PERMISSIONS["admin"];
  hideForRoles?: string[];
}

interface Module {
  id: string;
  label: string;
  path: string;
  pathByRole?: Partial<Record<UserRole, string>>;
  permission?: keyof typeof PERMISSIONS["admin"];
  subItems: SubItem[];
}

const MODULES: Module[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    subItems: [],
  },
  {
    id: "tickets",
    label: "Tickets",
    path: "/tickets/my",
    pathByRole: { admin: "/tickets/all", leader: "/tickets/assigned", tech: "/tickets/assigned", user: "/tickets/my" },
    subItems: [
      { label: "File Admin",       path: "/tickets/admin-queue", icon: "inbox",          permission: "canSeeAdminQueue"      },
      { label: "Tous les tickets", path: "/tickets/all",         icon: "list",           permission: "canSeeAllTickets"      },
      { label: "Créer un ticket",  path: "/tickets/create",      icon: "circle-plus",    permission: "canCreateTicket"       },
      { label: "Mes tickets",      path: "/tickets/my",          icon: "ticket",         permission: "canSeeMyTickets"       },
      { label: "Tickets assignés", path: "/tickets/assigned",    icon: "clipboard-list", permission: "canSeeAssignedTickets" },
      { label: "Historique",       path: "/tickets/history",     icon: "history",        permission: "canSeeAllTickets"      },
    ],
  },
  {
    id: "teams",
    label: "Teams",
    path: "/teams",
    permission: "canSeeTeam",
    subItems: [
      { label: "Gestion des équipes", path: "/teams",              icon: "settings",       permission: "canManageTeams"      },
      { label: "Vue d'ensemble",      path: "/teams/overview",    icon: "layout-grid",    permission: "canManageTeams",      hideForRoles: ["leader", "tech", "user"] },
      { label: "Tous les membres",    path: "/teams/all-members", icon: "users",          permission: "canManageTeams",      hideForRoles: ["leader", "tech", "user"] },
      { label: "Mon équipe",          path: "/teams",             icon: "layout-dashboard",permission: "canSeeTeamDashboard", hideForRoles: ["admin"] },
      { label: "Membres",             path: "/teams/members",     icon: "users",          permission: "canSeeTeamDashboard", hideForRoles: ["admin"] },
      { label: "Tickets équipe",      path: "/teams/tickets",     icon: "ticket",         permission: "canSeeTeamDashboard", hideForRoles: ["admin"] },
      { label: "Charge de travail",   path: "/teams/workload",    icon: "chart-bar",      permission: "canSeeTeamDashboard", hideForRoles: ["admin"] },
      { label: "Analytics",           path: "/teams/analytics",   icon: "chart-donut",    permission: "canSeeTeamAnalytics" },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    path: "/projects",
    permission: "canSeeProjects",
    subItems: [
      { label: "Tous les projets", path: "/projects",           icon: "folder-open"   },
      { label: "Mes tâches",       path: "/projects/tasks",     icon: "list-check",   hideForRoles: ["admin"] },
      { label: "Kanban",           path: "/projects/kanban",    icon: "layout-kanban",hideForRoles: ["admin"] },
      { label: "Analytics",        path: "/projects/analytics", icon: "chart-donut",  permission: "canSeeProjectAnalytics", hideForRoles: ["tech"] },
    ],
  },
];

const MORE_ITEMS: SubItem[] = [
  { label: "Base de connaissances", path: "/knowledge-base",  icon: "books",  permission: "canSeeKnowledgeBase" },
  { label: "Assistant IA",          path: "/ai-assistant",    icon: "robot"   },
  { label: "Utilisateurs",          path: "/users",           icon: "users",  permission: "canSeeUsers" },
  { label: "Paramètres",            path: "/settings",        icon: "settings" },
];

const getRoleLabel = (r: string) => {
  if (r === "admin")  return "ADMIN";
  if (r === "leader") return "TEAM LEADER";
  if (r === "tech")   return "TECHNICIEN";
  return "EMPLOYÉ";
};

const getRoleBadgeColor = (r: string) => {
  if (r === "admin")  return "#5FC2BA";
  if (r === "leader") return "#3B82F6";
  if (r === "tech")   return "#F97316";
  return "#8B5CF6";
};

export const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useCurrentUser();
  const role      = (user?.role ?? "user") as UserRole;
  const perms     = PERMISSIONS[role];

  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [openDropdown,  setOpenDropdown]  = useState<string | null>(null);
  const [searchVal,     setSearchVal]     = useState("");
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifAnchor,   setNotifAnchor]   = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [notifLoading,  setNotifLoading]  = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchUnread = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count ?? 0);
        }
      } catch { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("input[placeholder*='Rechercher']")?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setNotifLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch { /* ignore */ }
    finally { setNotifLoading(false); }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const getSearchPath = (): string => {
    if (role === "admin")  return "/tickets/all";
    if (role === "leader") return "/teams/tickets";
    if (role === "tech")   return "/tickets/assigned";
    return "/tickets/my";
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const isModuleActive = (mod: Module) => {
    if (mod.id === "dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith("/" + mod.id) ||
      mod.subItems.some(s => location.pathname.startsWith(s.path));
  };

  const isMoreActive = () =>
    MORE_ITEMS.some(item => location.pathname.startsWith(item.path));

  const handleMouseEnter = (id: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setOpenDropdown(id);
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => setOpenDropdown(null), 120);
  };

  const filterSubItems = (items: SubItem[]) =>
    items.filter(item =>
      (!item.permission || perms[item.permission]) &&
      (!item.hideForRoles || !item.hideForRoles.includes(role))
    );

  const filterModules = () =>
    MODULES.filter(mod => !mod.permission || perms[mod.permission]);

  const filterMore = () => MORE_ITEMS.filter(item => !item.permission || perms[item.permission]);

  const visibleModules = filterModules();
  const visibleMore    = filterMore();

  return (
    <Box sx={{ position: "sticky", top: 0, zIndex: 1200, flexShrink: 0 }}>

      {/* ══ TOP NAVBAR ══ */}
      <Box sx={{
        height: 62,
        bgcolor: "#0F1E35",
        display: "flex",
        alignItems: "center",
        px: 3.5,
        gap: 2,
      }}>

        {/* Logo */}
        <Box
          onClick={() => navigate("/dashboard")}
          sx={{ display: "flex", alignItems: "center", gap: 1.2, cursor: "pointer", flexShrink: 0 }}
        >
          <svg width="34" height="34" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gD_nav" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#173A57" />
                <stop offset="1" stopColor="#0C2235" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="112" height="112" rx="30" fill="url(#gD_nav)" />
            <rect x="4" y="4" width="112" height="112" rx="30" fill="none" stroke="#5BB8FF" strokeOpacity="0.25" strokeWidth="1.5" />
            <rect x="30" y="32" width="60" height="13" rx="6.5" fill="#FFFFFF" />
            <path d="M54 38 C54 64 52 78 70 92 C58 88 47 78 44 60 C43 50 44 42 47 38 Z" fill="#5BB8FF" />
          </svg>
          <Box sx={{ display: "flex", alignItems: "baseline" }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "15px", color: "#fff", letterSpacing: "-0.3px", lineHeight: 1 }}>
              Tusk
            </Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "15px", color: "#60A5FA", letterSpacing: "-0.3px", lineHeight: 1 }}>
              Flow
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <Box sx={{
          flex: 1, maxWidth: 380, mx: "auto",
          bgcolor: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "9px", height: 38,
          display: "flex", alignItems: "center", gap: 1, px: 1.75,
          transition: "all 0.2s",
          "&:focus-within": { bgcolor: "rgba(255,255,255,0.10)", border: "1px solid rgba(95,194,186,0.4)" },
        }}>
          <SearchIcon
            onClick={() => {
              if (searchVal.trim()) {
                navigate(getSearchPath(), { state: { search: searchVal.trim() } });
                setSearchVal("");
              }
            }}
            sx={{ fontSize: 16, color: "rgba(255,255,255,0.3)", flexShrink: 0, cursor: "pointer", "&:hover": { color: "rgba(255,255,255,0.6)" }, transition: "color 0.15s" }}
          />
          <InputBase
            placeholder="Rechercher tickets, projets..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchVal.trim()) {
                navigate(getSearchPath(), { state: { search: searchVal.trim() } });
                setSearchVal("");
              }
              if (e.key === "Escape") setSearchVal("");
            }}
            sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#fff", flex: 1, "& input::placeholder": { color: "rgba(255,255,255,0.3)" } }}
          />
          <Typography sx={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "5px", px: 0.75, py: 0.25 }}>
            Ctrl K
          </Typography>
        </Box>

        {/* Right side: notifications + profile */}
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.2 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              setNotifAnchor(e.currentTarget);
              fetchNotifications();
            }}
            sx={{
              width: 36, height: 36, borderRadius: "9px",
              bgcolor: Boolean(notifAnchor) ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
            }}
          >
            <Badge
              badgeContent={unreadCount > 0 ? unreadCount : undefined}
              sx={{ "& .MuiBadge-badge": { bgcolor: "#EF4444", color: "#fff", fontSize: 9, minWidth: 15, height: 15, border: "1.5px solid #0F1E35" } }}
            >
              <NotifIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.65)" }} />
            </Badge>
          </IconButton>

          <Box
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            sx={{ display: "flex", alignItems: "center", gap: 1.2, bgcolor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "10px", px: 1.5, py: 0.75, cursor: "pointer", transition: "all 0.15s", "&:hover": { bgcolor: "rgba(255,255,255,0.11)" } }}
          >
            <Avatar sx={{ width: 28, height: 28, bgcolor: getRoleBadgeColor(role), color: "#fff", fontSize: "10px", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
              {getInitials(user?.name ?? "U")}
            </Avatar>
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "#fff", lineHeight: 1.1 }}>
                {user?.name ?? "Utilisateur"}
              </Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: getRoleBadgeColor(role), letterSpacing: "0.05em" }}>
                {getRoleLabel(role)}
              </Typography>
            </Box>
            <ArrowIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }} />
          </Box>
        </Box>
      </Box>

      {/* ══ SUB NAVBAR ══ */}
      <Box sx={{
        bgcolor: "#152236",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        px: 3.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        height: 46,
      }}>

        {/* Main modules */}
        {visibleModules.map((mod) => {
          const active     = isModuleActive(mod);
          const isOpen     = openDropdown === mod.id;
          const subItems   = filterSubItems(mod.subItems);

          return (
            <Box
              key={mod.id}
              onMouseEnter={() => subItems.length > 0 ? handleMouseEnter(mod.id) : undefined}
              onMouseLeave={subItems.length > 0 ? handleMouseLeave : undefined}
              sx={{ position: "relative" }}
            >
              <Box
                onClick={() => navigate(mod.pathByRole?.[role] ?? mod.path)}
                sx={{
                  display: "flex", alignItems: "center", gap: 0.8,
                  px: 1.75, py: 0.875, borderRadius: "8px",
                  cursor: "pointer", transition: "all 0.18s", position: "relative",
                  bgcolor: active ? "rgba(95,194,186,0.12)" : isOpen ? "rgba(255,255,255,0.05)" : "transparent",
                  "&::after": active ? {
                    content: '""', position: "absolute",
                    bottom: -9, left: 14, right: 14,
                    height: "2px", bgcolor: "#5FC2BA", borderRadius: "2px 2px 0 0",
                  } : {},
                  "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                }}
              >
                <Typography sx={{
                  fontSize: "13px", fontFamily: "Inter, sans-serif",
                  color: active ? "#5FC2BA" : "rgba(255,255,255,0.65)",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.18s",
                  whiteSpace: "nowrap",
                }}>
                  {mod.label}
                </Typography>
                {subItems.length > 0 && (
                  <ArrowIcon sx={{ fontSize: 14, color: active ? "#5FC2BA" : "rgba(255,255,255,0.3)", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                )}
              </Box>

              {/* Dropdown */}
              {subItems.length > 0 && isOpen && (
                <Box
                  onMouseEnter={() => handleMouseEnter(mod.id)}
                  onMouseLeave={handleMouseLeave}
                  sx={{
                    position: "absolute", top: "calc(100% + 10px)", left: 0,
                    bgcolor: "#fff", borderRadius: "12px",
                    border: `1px solid ${C.border}`,
                    boxShadow: "0 8px 32px rgba(11,22,44,0.14)",
                    minWidth: 220, py: 1, zIndex: 2000,
                    animation: "fadeSlide 0.15s ease",
                    "@keyframes fadeSlide": {
                      from: { opacity: 0, transform: "translateY(-6px)" },
                      to:   { opacity: 1, transform: "translateY(0)" },
                    },
                  }}
                >
                  <Box sx={{ px: 1.75, py: 1, borderBottom: `1px solid ${C.divider}`, mb: 0.5 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {mod.label}
                    </Typography>
                  </Box>
                  {subItems.map((sub) => {
                    const subActive = location.pathname === sub.path;
                    return (
                      <Box
                        key={sub.path}
                        onClick={() => {
                          if (sub.path === "/projects/tasks")  { navigate("/projects", { state: { tab: "tasks" } }); }
                          else if (sub.path === "/projects/kanban") { navigate("/projects", { state: { tab: "kanban" } }); }
                          else { navigate(sub.path); }
                          setOpenDropdown(null);
                        }}
                        sx={{
                          display: "flex", alignItems: "center", gap: 1.2,
                          px: 1.75, py: 1, cursor: "pointer", transition: "all 0.12s",
                          bgcolor: subActive ? C.accentLight : "transparent",
                          "&:hover": { bgcolor: C.accentLight },
                          "&:hover .sub-label": { color: C.accent },
                        }}
                      >
                        <Box sx={{ width: 28, height: 28, borderRadius: "7px", bgcolor: subActive ? C.accentMid : C.bgPage, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Box component="i" className={`ti ti-${sub.icon}`} sx={{ fontSize: 15, color: subActive ? C.accent : C.textMuted }} />
                        </Box>
                        <Typography className="sub-label" sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: subActive ? C.accent : C.textSecondary, fontWeight: subActive ? 600 : 400, transition: "color 0.12s" }}>
                          {sub.label}
                        </Typography>
                        {subActive && <Box sx={{ ml: "auto", width: 6, height: 6, borderRadius: "50%", bgcolor: C.accent }} />}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}

        {/* ── More ▼ ── */}
        {visibleMore.length > 0 && (
          <Box
            onMouseEnter={() => handleMouseEnter("more")}
            onMouseLeave={handleMouseLeave}
            sx={{ position: "relative", ml: 0.5 }}
          >
            <Box
              sx={{
                display: "flex", alignItems: "center", gap: 0.8,
                px: 1.75, py: 0.875, borderRadius: "8px",
                cursor: "pointer", transition: "all 0.18s",
                bgcolor: isMoreActive() ? "rgba(95,194,186,0.12)" : openDropdown === "more" ? "rgba(255,255,255,0.05)" : "transparent",
                position: "relative",
                "&::after": isMoreActive() ? {
                  content: '""', position: "absolute",
                  bottom: -9, left: 14, right: 14,
                  height: "2px", bgcolor: "#5FC2BA", borderRadius: "2px 2px 0 0",
                } : {},
                "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
              }}
            >
              <Typography sx={{ fontSize: "13px", fontFamily: "Inter, sans-serif", color: isMoreActive() ? "#5FC2BA" : "rgba(255,255,255,0.65)", fontWeight: isMoreActive() ? 600 : 400, whiteSpace: "nowrap" }}>
                Plus
              </Typography>
              <ArrowIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.3)", transition: "transform 0.2s", transform: openDropdown === "more" ? "rotate(180deg)" : "rotate(0deg)" }} />
            </Box>

            {openDropdown === "more" && (
              <Box
                onMouseEnter={() => handleMouseEnter("more")}
                onMouseLeave={handleMouseLeave}
                sx={{
                  position: "absolute", top: "calc(100% + 10px)", left: 0,
                  bgcolor: "#fff", borderRadius: "12px",
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 8px 32px rgba(11,22,44,0.14)",
                  minWidth: 220, py: 1, zIndex: 2000,
                  animation: "fadeSlide 0.15s ease",
                  "@keyframes fadeSlide": {
                    from: { opacity: 0, transform: "translateY(-6px)" },
                    to:   { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                <Box sx={{ px: 1.75, py: 1, borderBottom: `1px solid ${C.divider}`, mb: 0.5 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Plus de modules
                  </Typography>
                </Box>
                {visibleMore.map((item) => {
                  const active = location.pathname.startsWith(item.path);
                  return (
                    <Box
                      key={item.path}
                      onClick={() => { navigate(item.path); setOpenDropdown(null); }}
                      sx={{ display: "flex", alignItems: "center", gap: 1.2, px: 1.75, py: 1, cursor: "pointer", transition: "all 0.12s", bgcolor: active ? C.accentLight : "transparent", "&:hover": { bgcolor: C.accentLight }, "&:hover .more-label": { color: C.accent } }}
                    >
                      <Box sx={{ width: 28, height: 28, borderRadius: "7px", bgcolor: active ? C.accentMid : C.bgPage, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Box component="i" className={`ti ti-${item.icon}`} sx={{ fontSize: 15, color: active ? C.accent : C.textMuted }} />
                      </Box>
                      <Typography className="more-label" sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: active ? C.accent : C.textSecondary, fontWeight: active ? 600 : 400, transition: "color 0.12s" }}>
                        {item.label}
                      </Typography>
                      {active && <Box sx={{ ml: "auto", width: 6, height: 6, borderRadius: "50%", bgcolor: C.accent }} />}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* ══ Notifications Popover ══ */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1, borderRadius: "14px",
            border: `1px solid ${C.border}`,
            boxShadow: C.shadowLg,
            width: 360, maxHeight: 480,
            overflow: "hidden",
            display: "flex", flexDirection: "column",
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center",
          justifyContent: "space-between", borderBottom: `1px solid ${C.border}`,
          bgcolor: C.bgPage, flexShrink: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px",
              fontWeight: 700, color: C.textPrimary }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Box sx={{ px: 1, py: 0.2, bgcolor: "#EF4444", borderRadius: "10px" }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px",
                  fontWeight: 700, color: "#fff" }}>
                  {unreadCount}
                </Typography>
              </Box>
            )}
          </Box>
          {unreadCount > 0 && (
            <Typography
              onClick={markAllRead}
              sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600,
                color: C.accent, cursor: "pointer", "&:hover": { opacity: 0.8 } }}>
              Tout marquer lu
            </Typography>
          )}
        </Box>

        {/* Liste */}
        <Box sx={{ overflow: "auto", flex: 1 }}>
          {notifLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <Box component="i" className="ti ti-loader-2"
                sx={{ fontSize: 24, color: C.accent,
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": { "100%": { transform: "rotate(360deg)" } },
                }} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <Box component="i" className="ti ti-bell-off"
                sx={{ fontSize: 36, color: C.textMuted, display: "block", mb: 1 }} />
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>
                Aucune notification
              </Typography>
            </Box>
          ) : (
            notifications.slice(0, 15).map((notif) => (
              <Box
                key={notif._id}
                onClick={() => {
                  if (notif.ticketId?._id) {
                    if (!notif.read) {
                      const token = localStorage.getItem("token");
                      fetch(`/api/notifications/${notif._id}`, {
                        method: "PUT",
                        headers: { Authorization: `Bearer ${token}` },
                      }).catch(() => {});
                      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
                      setUnreadCount(prev => Math.max(0, prev - 1));
                    }
                    navigate(`/tickets/${notif.ticketId._id}`);
                    setNotifAnchor(null);
                  }
                }}
                sx={{
                  display: "flex", alignItems: "flex-start", gap: 1.5,
                  px: 2, py: 1.5,
                  bgcolor: notif.read ? "transparent" : `${C.accent}08`,
                  borderBottom: `1px solid ${C.border}`,
                  cursor: notif.ticketId ? "pointer" : "default",
                  transition: "background 0.13s",
                  "&:hover": notif.ticketId ? { bgcolor: C.accentLight } : {},
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, mt: 0.7,
                  bgcolor: notif.read ? "transparent" : C.accent }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px",
                    color: C.textPrimary, lineHeight: 1.5,
                    overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {notif.message}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.4 }}>
                    {notif.triggeredBy?.name && (
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>
                        par {notif.triggeredBy.name}
                      </Typography>
                    )}
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>
                      {new Date(notif.createdAt).toLocaleString("fr-FR", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Popover>

      {/* ══ Profile Dropdown ══ */}
      <Popover
        open={Boolean(profileAnchor)}
        anchorEl={profileAnchor}
        onClose={() => setProfileAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { mt: 1, borderRadius: "12px", border: `1px solid ${C.border}`, boxShadow: C.shadowLg, minWidth: 210, overflow: "hidden" } }}
      >
        <Box sx={{ px: 2, py: 1.5, bgcolor: C.bgPage }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.85rem", color: C.textPrimary }}>
            {user?.name}
          </Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: C.textMuted }}>
            {user?.email}
          </Typography>
          <Box sx={{ mt: 0.8, display: "inline-flex", px: 1, py: 0.3, borderRadius: "20px", bgcolor: `${getRoleBadgeColor(role)}20` }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: getRoleBadgeColor(role) }}>
              {getRoleLabel(role)}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ borderColor: C.border }} />
        <List dense disablePadding>
          <ListItemButton onClick={() => { navigate("/profile"); setProfileAnchor(null); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: C.accentLight } }}>
            <PersonIcon sx={{ fontSize: 16, mr: 1.5, color: C.textMuted }} />
            <ListItemText primary="Mon profil" primaryTypographyProps={{ fontFamily: "Inter, sans-serif", fontSize: "0.83rem", color: C.textPrimary }} />
          </ListItemButton>
          <ListItemButton onClick={() => { navigate("/settings"); setProfileAnchor(null); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: C.accentLight } }}>
            <SettingsIcon sx={{ fontSize: 16, mr: 1.5, color: C.textMuted }} />
            <ListItemText primary="Paramètres" primaryTypographyProps={{ fontFamily: "Inter, sans-serif", fontSize: "0.83rem", color: C.textPrimary }} />
          </ListItemButton>
          {role === "admin" && (
            <ListItemButton onClick={() => { navigate("/company-context"); setProfileAnchor(null); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: C.accentLight } }}>
              <BusinessIcon sx={{ fontSize: 16, mr: 1.5, color: C.accent }} />
              <ListItemText
                primary="Company AI Context"
                primaryTypographyProps={{ fontFamily: "Inter, sans-serif", fontSize: "0.83rem", color: C.accent, fontWeight: 600 }}
              />
            </ListItemButton>
          )}
        </List>
        <Divider sx={{ borderColor: C.border }} />
        <List dense disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ px: 2, py: 1, "&:hover": { bgcolor: C.dangerBg } }}>
            <LogoutIcon sx={{ fontSize: 16, mr: 1.5, color: C.danger }} />
            <ListItemText primary="Déconnexion" primaryTypographyProps={{ fontFamily: "Inter, sans-serif", fontSize: "0.83rem", color: C.danger }} />
          </ListItemButton>
        </List>
      </Popover>
    </Box>
  );
};
