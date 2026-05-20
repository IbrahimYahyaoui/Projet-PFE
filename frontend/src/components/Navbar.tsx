// frontend/src/components/Navbar.tsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Avatar, Badge, IconButton, Popover, List, ListItemButton, ListItemText, Divider, InputBase } from "@mui/material";
import { Notifications as NotifIcon, Search as SearchIcon, Logout as LogoutIcon, Person as PersonIcon, Settings as SettingsIcon, KeyboardArrowDown as ArrowIcon } from "@mui/icons-material";
import { C } from "../theme";
import { useCurrentUser } from "../App";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const getNavModules = (role: string) => {
  const all = [
    { label: "Accueil",    path: "/dashboard", roles: ["admin","tech","user","leader"] },
    { label: "My Team",    path: "/team",       roles: ["admin","leader","tech"] },
    { label: "My Project", path: "/projects",   roles: ["admin","tech","user","leader"] },
    { label: "Users",      path: "/users",      roles: ["admin"] },
  ];
  return all.filter((m) => m.roles.includes(role));
};

const getSubItems = (path: string, role: string) => {
  const map: Record<string, { label: string; path: string; icon: string }[]> = {
    "/team": [
      { label: "Dashboard",      path: "/team",             icon: "layout-dashboard" },
      { label: "Membres",        path: "/team/members",     icon: "users"            },
      { label: "Tickets Équipe", path: "/team/tickets",     icon: "ticket"           },
      { label: "Analytics",      path: "/team/analytics",   icon: "chart-bar"        },
    ],
    "/projects": [
      { label: "Mes Projets", path: "/projects",          icon: "folder-open" },
      { label: "Tasks",       path: "/projects/tasks",    icon: "checkbox"    },
      { label: "Analytics",   path: "/projects/analytics",icon: "chart-bar"   },
    ],
    "/users": [
      { label: "Liste Users",    path: "/users",        icon: "users"      },
      { label: "Ajouter User",   path: "/users/add",    icon: "user-plus"  },
      { label: "Modifier User",  path: "/users/edit",   icon: "user-edit"  },
      { label: "Supprimer User", path: "/users/delete", icon: "user-minus" },
    ],
  };
  return map[path] ?? [];
};

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
  const role      = user?.role ?? "user";
  const modules   = getNavModules(role);

  const [profileAnchor,  setProfileAnchor]  = useState<HTMLElement | null>(null);
  const [hoveredModule,  setHoveredModule]  = useState<string | null>(null);
  const [searchVal,      setSearchVal]      = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const isModuleActive = (path: string) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(path));

  return (
    <Box sx={{ position: "sticky", top: 0, zIndex: 1200, flexShrink: 0 }}>

      {/* ══ TOP NAVBAR ══ */}
      <Box sx={{ height: 62, bgcolor: "#0F1E35", display: "flex", alignItems: "center", px: 3.5, gap: 2 }}>

        {/* Logo */}
        <Box onClick={() => navigate("/dashboard")} sx={{ display: "flex", alignItems: "center", gap: 1.2, cursor: "pointer", flexShrink: 0 }}>
          <Box sx={{ width: 34, height: 34, background: "linear-gradient(135deg, #5FC2BA, #4AADA5)", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 34 34" fill="none">
              <polygon points="17,4 31,28 3,28" fill="white" opacity="0.9"/>
              <circle cx="17" cy="17" r="4" fill="#5FC2BA"/>
            </svg>
          </Box>
          <Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "13px", color: "#fff", lineHeight: 1, letterSpacing: "-0.2px" }}>
              TicketFlow
            </Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "9px", color: "#5FC2BA", letterSpacing: "0.12em", fontWeight: 500 }}>
              TUSKENS MEA
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <Box sx={{ flex: 1, maxWidth: 380, mx: "auto", bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "9px", height: 38, display: "flex", alignItems: "center", gap: 1, px: 1.75, transition: "all 0.2s", "&:focus-within": { bgcolor: "rgba(255,255,255,0.10)", border: "1px solid rgba(95,194,186,0.4)" } }}>
          <SearchIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          <InputBase
            placeholder="Rechercher tickets, projets..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#fff", flex: 1, "& input::placeholder": { color: "rgba(255,255,255,0.3)" } }}
          />
          <Typography sx={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "5px", px: 0.75, py: 0.25 }}>
            Ctrl K
          </Typography>
        </Box>

        {/* Right */}
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.2 }}>
          <IconButton size="small" sx={{ width: 36, height: 36, borderRadius: "9px", bgcolor: "rgba(255,255,255,0.07)", "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}>
            <Badge badgeContent={3} sx={{ "& .MuiBadge-badge": { bgcolor: "#EF4444", color: "#fff", fontSize: 9, minWidth: 15, height: 15, border: "1.5px solid #0F1E35" } }}>
              <NotifIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.65)" }} />
            </Badge>
          </IconButton>

          {/* Profile */}
          <Box onClick={(e) => setProfileAnchor(e.currentTarget)} sx={{ display: "flex", alignItems: "center", gap: 1.2, bgcolor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "10px", px: 1.5, py: 0.75, cursor: "pointer", transition: "all 0.15s", "&:hover": { bgcolor: "rgba(255,255,255,0.11)" } }}>
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
      <Box sx={{ bgcolor: "#152236", borderBottom: "1px solid rgba(255,255,255,0.06)", px: 3.5, display: "flex", alignItems: "center", gap: 0.5, height: 46 }}>
        {modules.map((mod) => {
          const active   = isModuleActive(mod.path);
          const subItems = getSubItems(mod.path, role);
          const hovered  = hoveredModule === mod.path;

          return (
            <Box key={mod.path} onMouseEnter={() => setHoveredModule(mod.path)} onMouseLeave={() => setHoveredModule(null)} sx={{ position: "relative" }}>
              <Box onClick={() => navigate(mod.path)}
                sx={{ display: "flex", alignItems: "center", gap: 0.9, px: 1.75, py: 0.875, borderRadius: "8px", cursor: "pointer", transition: "all 0.18s", position: "relative", bgcolor: active ? "rgba(95,194,186,0.12)" : hovered ? "rgba(255,255,255,0.05)" : "transparent",
                  "&::after": active ? { content: '""', position: "absolute", bottom: -9, left: 14, right: 14, height: "2px", bgcolor: "#5FC2BA", borderRadius: "2px 2px 0 0" } : {},
                }}
              >
                <Typography sx={{ fontSize: "13px", fontFamily: "Inter, sans-serif", color: active ? "#5FC2BA" : hovered ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: active ? 600 : 400, transition: "all 0.18s" }}>
                  {mod.label}
                </Typography>
              </Box>

              {/* Dropdown */}
              {subItems.length > 0 && hovered && (
                <Box sx={{ position: "absolute", top: "calc(100% + 10px)", left: 0, bgcolor: "#fff", borderRadius: "12px", border: `1px solid ${C.border}`, boxShadow: "0 8px 32px rgba(11,22,44,0.14)", minWidth: 200, py: 1, zIndex: 2000, animation: "fadeSlide 0.15s ease",
                  "@keyframes fadeSlide": { from: { opacity: 0, transform: "translateY(-6px)" }, to: { opacity: 1, transform: "translateY(0)" } },
                }}>
                  <Box sx={{ px: 1.75, py: 1, borderBottom: `1px solid ${C.divider}`, mb: 0.5 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {mod.label}
                    </Typography>
                  </Box>
                  {subItems.map((sub) => (
                    <Box key={sub.path + sub.label} onClick={() => { navigate(sub.path); setHoveredModule(null); }}
                      sx={{ display: "flex", alignItems: "center", gap: 1.2, px: 1.75, py: 1, cursor: "pointer", transition: "all 0.12s", "&:hover": { bgcolor: C.accentLight }, "&:hover .sub-label": { color: C.accent } }}
                    >
                      <Box sx={{ width: 28, height: 28, borderRadius: "7px", bgcolor: C.bgPage, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Box component="i" className={`ti ti-${sub.icon}`} sx={{ fontSize: 15, color: C.textMuted }} />
                      </Box>
                      <Typography className="sub-label" sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textSecondary, transition: "color 0.12s" }}>
                        {sub.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* ══ Profile Dropdown ══ */}
      <Popover open={Boolean(profileAnchor)} anchorEl={profileAnchor} onClose={() => setProfileAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { mt: 1, borderRadius: "12px", border: `1px solid ${C.border}`, boxShadow: C.shadowLg, minWidth: 210, overflow: "hidden" } }}
      >
        <Box sx={{ px: 2, py: 1.5, bgcolor: C.bgPage }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.85rem", color: C.textPrimary }}>{user?.name}</Typography>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: C.textMuted }}>{user?.email}</Typography>
          <Box sx={{ mt: 0.8, display: "inline-flex", px: 1, py: 0.3, borderRadius: "20px", bgcolor: `${getRoleBadgeColor(role)}20` }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600, color: getRoleBadgeColor(role) }}>
              {getRoleLabel(role)}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ borderColor: C.border }} />
        <List dense disablePadding>
          <ListItemButton onClick={() => { navigate("/settings"); setProfileAnchor(null); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: C.accentLight } }}>
            <PersonIcon sx={{ fontSize: 16, mr: 1.5, color: C.textMuted }} />
            <ListItemText primary="Mon profil" primaryTypographyProps={{ fontFamily: "Inter, sans-serif", fontSize: "0.83rem", color: C.textPrimary }} />
          </ListItemButton>
          <ListItemButton onClick={() => { navigate("/settings"); setProfileAnchor(null); }} sx={{ px: 2, py: 1, "&:hover": { bgcolor: C.accentLight } }}>
            <SettingsIcon sx={{ fontSize: 16, mr: 1.5, color: C.textMuted }} />
            <ListItemText primary="Paramètres" primaryTypographyProps={{ fontFamily: "Inter, sans-serif", fontSize: "0.83rem", color: C.textPrimary }} />
          </ListItemButton>
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