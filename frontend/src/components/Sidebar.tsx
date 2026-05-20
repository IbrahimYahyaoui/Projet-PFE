// frontend/src/components/Sidebar.tsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Tooltip, Divider } from "@mui/material";
import {
  Home as HomeIcon,
  Group as TeamIcon,
  FolderOpen as ProjectIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  ConfirmationNumber as TicketIcon,
  Dashboard as DashIcon,
  Assignment as AssignedIcon,
  BarChart as AnalyticsIcon,
  List as ListIcon,
  PersonAdd as AddUserIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { C, PERMISSIONS } from "../theme";
import type { UserRole } from "../theme";
import { useCurrentUser } from "../App";

// ════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════
interface SubItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  permission?: keyof typeof PERMISSIONS["admin"];
  subItems?: SubItem[];
}

// ════════════════════════════════════════════════
// Config navigation par rôle
// ════════════════════════════════════════════════
const getNavItems = (role: UserRole): NavItem[] => {
  const items: NavItem[] = [
    {
      id: "home",
      label: "Accueil",
      icon: <HomeIcon sx={{ fontSize: 20 }} />,
      path: "/dashboard",
    },
    {
      id: "team",
      label: "My Team",
      icon: <TeamIcon sx={{ fontSize: 20 }} />,
      path: "/team",
      permission: "canSeeTeam",
      subItems: [
        { label: "Dashboard",      path: "/team",             icon: <DashIcon sx={{ fontSize: 15 }} /> },
        { label: "My Tickets",     path: "/tickets/my",       icon: <TicketIcon sx={{ fontSize: 15 }} /> },
        { label: "Assigned To Me", path: "/tickets/assigned", icon: <AssignedIcon sx={{ fontSize: 15 }} /> },
        { label: "All Tickets",    path: "/tickets/all",      icon: <ListIcon sx={{ fontSize: 15 }} /> },
        { label: "Analytics",      path: "/analytics",        icon: <AnalyticsIcon sx={{ fontSize: 15 }} /> },
      ],
    },
    {
      id: "projects",
      label: "My Project",
      icon: <ProjectIcon sx={{ fontSize: 20 }} />,
      path: "/projects",
      subItems: [
        { label: "Dashboard Projet", path: "/projects", icon: <DashIcon sx={{ fontSize: 15 }} /> },
        { label: "Mes Projets",      path: "/projects", icon: <ProjectIcon sx={{ fontSize: 15 }} /> },
        { label: "Tasks",            path: "/projects", icon: <AssignedIcon sx={{ fontSize: 15 }} /> },
      ],
    },
    {
      id: "users",
      label: "Users",
      icon: <UsersIcon sx={{ fontSize: 20 }} />,
      path: "/users",
      permission: "canSeeUsers",
      subItems: [
        { label: "Liste Users",    path: "/users", icon: <ListIcon sx={{ fontSize: 15 }} /> },
        { label: "Ajouter User",   path: "/users", icon: <AddUserIcon sx={{ fontSize: 15 }} /> },
        { label: "Modifier User",  path: "/users", icon: <EditIcon sx={{ fontSize: 15 }} /> },
        { label: "Supprimer User", path: "/users", icon: <DeleteIcon sx={{ fontSize: 15 }} /> },
      ],
    },
  ];

  // Filtrer selon permissions
  const perms = PERMISSIONS[role];
  return items.filter((item) => {
    if (!item.permission) return true;
    return perms[item.permission];
  });
};

// ════════════════════════════════════════════════
// Sidebar Component
// ════════════════════════════════════════════════
interface SidebarProps {
  expanded: boolean;
  onClose: () => void;
}

export const Sidebar = ({ expanded, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user     = useCurrentUser();
  const role     = (user?.role ?? "user") as UserRole;
  const navItems = getNavItems(role);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(path));

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* ── Overlay mobile ── */}
      {expanded && (
        <Box
          onClick={onClose}
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.4)",
            zIndex: 1100,
            display: { xs: "block", md: "none" },
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <Box
        sx={{
          width: 56,
          bgcolor: C.sidebar,
          borderRight: `1px solid ${C.sidebarBorder}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 1.5,
          gap: 0.5,
          flexShrink: 0,
          position: "relative",
          zIndex: 1101,
          minHeight: "calc(100vh - 60px)",
        }}
      >
        {/* ── Nav Items ── */}
        {navItems.map((item) => {
          const active  = isActive(item.path);
          const hovered = hoveredId === item.id;

          return (
            <Box
              key={item.id}
              sx={{ position: "relative", width: "100%" }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* ── Icône principale ── */}
              <Tooltip title={item.label} placement="right" arrow>
                <Box
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    width: 40,
                    height: 40,
                    mx: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    bgcolor: active
                      ? C.accent + "22"
                      : hovered
                      ? C.sidebarHover
                      : "transparent",
                    color: active ? C.accent : C.sidebarText,
                    border: active
                      ? `1px solid ${C.accent}44`
                      : "1px solid transparent",
                    "&:hover": {
                      bgcolor: active ? C.accent + "22" : C.sidebarHover,
                      color: active ? C.accent : "#FFFFFF",
                    },
                  }}
                >
                  {item.icon}
                </Box>
              </Tooltip>

              {/* ── Dropdown au hover ── */}
              {item.subItems && hovered && (
                <Box
                  sx={{
                    position: "fixed",
                    left: 56,
                    bgcolor: "#FFFFFF",
                    borderRadius: "12px",
                    border: `1px solid ${C.border}`,
                    boxShadow: C.shadowLg,
                    minWidth: 200,
                    py: 1,
                    zIndex: 2000,
                    animation: "fadeIn 0.15s ease",
                    "@keyframes fadeIn": {
                      from: { opacity: 0, transform: "translateX(-8px)" },
                      to:   { opacity: 1, transform: "translateX(0)" },
                    },
                  }}
                >
                  {/* Header dropdown */}
                  <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${C.border}` }}>
                    <Typography
                      sx={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: C.textPrimary,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>

                  {/* Sub items */}
                  {item.subItems.map((sub) => {
                    const subActive = location.pathname === sub.path;
                    return (
                      <Box
                        key={sub.path + sub.label}
                        onClick={() => handleNavigate(sub.path)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          px: 2,
                          py: 1,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          bgcolor: subActive ? C.accentLight : "transparent",
                          "&:hover": { bgcolor: C.accentLight },
                        }}
                      >
                        <Box sx={{ color: subActive ? C.accent : C.textMuted }}>
                          {sub.icon}
                        </Box>
                        <Typography
                          sx={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "0.82rem",
                            fontWeight: subActive ? 600 : 400,
                            color: subActive ? C.accent : C.textSecondary,
                          }}
                        >
                          {sub.label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}

        {/* ── Divider + Settings en bas ── */}
        <Box sx={{ flex: 1 }} />
        <Divider sx={{ width: 32, borderColor: C.sidebarBorder, mb: 0.5 }} />

        <Tooltip title="Paramètres" placement="right" arrow>
          <Box
            onClick={() => handleNavigate("/settings")}
            sx={{
              width: 40,
              height: 40,
              mx: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s",
              color: C.sidebarText,
              "&:hover": { bgcolor: C.sidebarHover, color: "#FFFFFF" },
            }}
          >
            <SettingsIcon sx={{ fontSize: 20 }} />
          </Box>
        </Tooltip>

      </Box>
    </>
  );
};