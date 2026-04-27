import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  ConfirmationNumber,
  People,
  Settings,
  ListAlt,
  Logout,
  LightMode,
  DarkMode,
  AssignmentInd,
} from "@mui/icons-material";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userRole = user?.role || "user";
  const userName = user?.name || "User";
  const userAvatar = user?.avatar || "";

  // ── Couleurs Desert Sand ──
  const colors = {
    sidebarBg: "#140E0A",
    sidebarBorder: "rgba(245,158,11,0.15)",
    textPrimary: "#FEF3C7",
    textSecondary: "rgba(254,243,199,0.5)",
    hoverBg: "rgba(245,158,11,0.08)",
    activeBg: "rgba(245,158,11,0.15)",
    activeText: "#F59E0B",
    activeIcon: "#F59E0B",
    sectionLabel: "rgba(254,243,199,0.3)",
    contentBg: "#1C1410",
    divider: "rgba(245,158,11,0.1)",
    toggleBg: "rgba(245,158,11,0.08)",
    toggleActiveBg: "#F59E0B",
  };

  // ── Menu items ──
  const mainItems = [
    { text: "Dashboard", icon: <DashboardIcon sx={{ fontSize: 20 }} />, path: "/Dashbord" },
    { text: "My tickets", icon: <ConfirmationNumber sx={{ fontSize: 20 }} />, path: "/my-tickets" },
    { text: "Assigned to me", icon: <AssignmentInd sx={{ fontSize: 20 }} />, path: "/assigned-tickets", techOnly: true },
    { text: "All tickets", icon: <ListAlt sx={{ fontSize: 20 }} />, path: "/all-tickets", adminOnly: true },
    { text: "Users", icon: <People sx={{ fontSize: 20 }} />, path: "/users", adminOnly: true },
  ];

  const supportItems = [
    { text: "Settings", icon: <Settings sx={{ fontSize: 20 }} />, path: "/settings" },
  ];

  const filteredMainItems = mainItems.filter((item) => {
    if (item.adminOnly) return userRole === "admin";
    if (item.techOnly) return userRole === "tech" || userRole === "admin";
    return true;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const MenuItem = ({ item }: { item: { text: string; icon: React.ReactNode; path: string } }) => {
    const isActive = location.pathname === item.path;

    return (
      <Box
        onClick={() => navigate(item.path)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.2,
          mx: 1.5,
          borderRadius: 2,
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s ease",
          bgcolor: isActive ? colors.activeBg : "transparent",
          color: isActive ? colors.activeText : colors.textPrimary,
          "&:hover": {
            bgcolor: isActive ? colors.activeBg : colors.hoverBg,
            transform: "translateX(4px)",
          },
          "&:active": { transform: "scale(0.98)" },
        }}
      >
        {isActive && (
          <Box
            sx={{
              position: "absolute",
              left: -12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 3,
              height: 20,
              borderRadius: 4,
              bgcolor: "#F59E0B",
            }}
          />
        )}
        <Box
          sx={{
            color: isActive ? colors.activeIcon : colors.textSecondary,
            display: "flex",
            transition: "color 0.2s ease",
          }}
        >
          {item.icon}
        </Box>
        <Typography
          fontSize={14}
          fontWeight={isActive ? 600 : 400}
          color={isActive ? colors.activeText : colors.textPrimary}
        >
          {item.text}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: colors.contentBg }}>
      {/* ====== SIDEBAR ====== */}
      <Box
        sx={{
          width: 250,
          bgcolor: colors.sidebarBg,
          borderRight: `1px solid ${colors.sidebarBorder}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <Box sx={{ px: 3, py: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "#F59E0B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "rotate(10deg)" },
            }}
          >
            <Typography fontSize={15} fontWeight={800} color="#1C1410">
              TF
            </Typography>
          </Box>
          <Typography fontSize={17} fontWeight={700} color={colors.textPrimary} letterSpacing={0.5}>
            TicketFlow
          </Typography>
        </Box>

        {/* Section MAIN */}
        <Box sx={{ mt: 1 }}>
          <Typography
            fontSize={11}
            fontWeight={600}
            color={colors.sectionLabel}
            sx={{ px: 3, mb: 1, letterSpacing: 1.5, textTransform: "uppercase" }}
          >
            Main
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
            {filteredMainItems.map((item) => (
              <MenuItem key={item.text} item={item} />
            ))}
          </Box>
        </Box>

        {/* Section SUPPORT */}
        <Box sx={{ mt: 3 }}>
          <Typography
            fontSize={11}
            fontWeight={600}
            color={colors.sectionLabel}
            sx={{ px: 3, mb: 1, letterSpacing: 1.5, textTransform: "uppercase" }}
          >
            Support
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
            {supportItems.map((item) => (
              <MenuItem key={item.text} item={item} />
            ))}
          </Box>
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Divider */}
        <Box sx={{ mx: 2, borderTop: `1px solid ${colors.divider}` }} />

        {/* Profil */}
        <Box
          sx={{
            px: 2,
            py: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": { bgcolor: colors.hoverBg },
          }}
          onClick={() => navigate("/profile")}
        >
          <Avatar
            src={userAvatar}
            sx={{
              width: 36,
              height: 36,
              bgcolor: "#F59E0B",
              color: "#1C1410",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {!userAvatar && getInitials(userName)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontSize={13} fontWeight={600} color={colors.textPrimary} noWrap>
              {userName}
            </Typography>
            <Typography fontSize={11} color={colors.textSecondary} sx={{ textTransform: "capitalize" }}>
              {userRole}
            </Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              sx={{
                color: colors.textSecondary,
                transition: "all 0.2s ease",
                "&:hover": { color: "#F59E0B", bgcolor: "rgba(245,158,11,0.1)" },
              }}
            >
              <Logout sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ====== CONTENU PRINCIPAL ====== */}
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;