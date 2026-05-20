// frontend/src/components/SecondarySidebar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { C } from "../theme";

interface SidebarItem {
  label: string;
  path: string;
  icon: string;
}

interface SidebarConfig {
  title: string;
  icon: string;
  items: SidebarItem[];
}

const SIDEBAR_CONFIG: Record<string, SidebarConfig> = {
  team: {
    title: "My Team",
    icon: "users-group",
    items: [
      { label: "Dashboard",       path: "/team",      icon: "layout-dashboard" },
      { label: "Membres",         path: "/team/members", icon: "users"          },
      { label: "Tickets Équipe",  path: "/team/tickets", icon: "ticket"         },
      { label: "Analytics",       path: "/team/analytics", icon: "chart-bar"    },
    ],
  },
  projects: {
    title: "My Project",
    icon: "folder-open",
    items: [
      { label: "Mes Projets",  path: "/projects",          icon: "folder-open"      },
      { label: "Tasks",        path: "/projects/tasks",    icon: "checkbox"         },
      { label: "Analytics",    path: "/projects/analytics",icon: "chart-bar"        },
    ],
  },
  users: {
    title: "Users",
    icon: "user-cog",
    items: [
      { label: "Liste Users",    path: "/users",         icon: "users"      },
      { label: "Ajouter User",   path: "/users/add",     icon: "user-plus"  },
      { label: "Modifier User",  path: "/users/edit",    icon: "user-edit"  },
      { label: "Supprimer User", path: "/users/delete",  icon: "user-minus" },
    ],
  },
};

interface SecondarySidebarProps {
  activeModule: string;
}

export const SecondarySidebar = ({ activeModule }: SecondarySidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const config   = SIDEBAR_CONFIG[activeModule];

  if (!config) return null;

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  return (
    <Box
      sx={{
        width: 220,
        bgcolor: "#FFFFFF",
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        minHeight: "calc(100vh - 108px)",
        py: 2.5,
        px: 1.5,
        animation: "slideIn 0.2s ease",
        "@keyframes slideIn": {
          from: { opacity: 0, transform: "translateX(-10px)" },
          to:   { opacity: 1, transform: "translateX(0)" },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, mb: 2 }}>
        <Box sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Box component="i" className={`ti ti-${config.icon}`} sx={{ fontSize: 16, color: C.accent }} />
        </Box>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 700, color: C.textPrimary }}>
          {config.title}
        </Typography>
      </Box>

      {/* Section label */}
      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", px: 1.5, mb: 1 }}>
        Navigation
      </Typography>

      {/* Items */}
      {config.items.map((item) => {
        const active = isActive(item.path);
        return (
          <Box
            key={item.path + item.label}
            onClick={() => navigate(item.path)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              px: 1.5,
              py: 1.1,
              borderRadius: "9px",
              cursor: "pointer",
              mb: 0.3,
              transition: "all 0.15s ease",
              bgcolor: active ? C.accentLight : "transparent",
              border: active ? `1px solid ${C.accent}22` : "1px solid transparent",
              "&:hover": { bgcolor: active ? C.accentLight : C.bgPage },
            }}
          >
            <Box sx={{ width: 30, height: 30, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, bgcolor: active ? C.accentMid : "transparent", transition: "all 0.15s" }}>
              <Box component="i" className={`ti ti-${item.icon}`} sx={{ fontSize: 17, color: active ? C.accent : C.textMuted, transition: "color 0.15s" }} />
            </Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: active ? 600 : 400, color: active ? C.textPrimary : "#64748B", transition: "all 0.15s" }}>
              {item.label}
            </Typography>
            {active && (
              <Box sx={{ ml: "auto", width: 6, height: 6, borderRadius: "50%", bgcolor: C.accent }} />
            )}
          </Box>
        );
      })}

      {/* Divider */}
      <Box sx={{ mt: "auto", pt: 2, borderTop: `1px solid ${C.divider}` }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", px: 1.5, mb: 1 }}>
          Raccourcis
        </Typography>
        <Box
          onClick={() => navigate("/tickets/my")}
          sx={{ display: "flex", alignItems: "center", gap: 1.2, px: 1.5, py: 1, borderRadius: "9px", cursor: "pointer", transition: "all 0.15s", "&:hover": { bgcolor: C.bgPage } }}
        >
          <Box component="i" className="ti ti-ticket" sx={{ fontSize: 16, color: C.textMuted }} />
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#64748B" }}>Mes tickets</Typography>
        </Box>
        <Box
          onClick={() => navigate("/tickets/assigned")}
          sx={{ display: "flex", alignItems: "center", gap: 1.2, px: 1.5, py: 1, borderRadius: "9px", cursor: "pointer", transition: "all 0.15s", "&:hover": { bgcolor: C.bgPage } }}
        >
          <Box component="i" className="ti ti-clipboard-list" sx={{ fontSize: 16, color: C.textMuted }} />
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#64748B" }}>Assignés à moi</Typography>
        </Box>
      </Box>

    </Box>
  );
};