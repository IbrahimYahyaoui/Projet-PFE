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
} from "@mui/icons-material";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userRole = user?.role || "user";
  const userName = user?.name || "User";
  const userAvatar = user?.avatar || "";

  // ── Couleurs selon le mode ──
  const colors = darkMode
    ? {
        sidebarBg: "#1a1b0e",
        sidebarBorder: "rgba(174,183,132,0.15)",
        textPrimary: "#E3DBBB",
        textSecondary: "rgba(227,219,187,0.5)",
        hoverBg: "rgba(174,183,132,0.1)",
        activeBg: "rgba(174,183,132,0.15)",
        activeText: "#AEB784",
        activeIcon: "#AEB784",
        sectionLabel: "rgba(227,219,187,0.35)",
        contentBg: "#121306",
        toggleBg: "rgba(174,183,132,0.1)",
        toggleActiveBg: "#41431B",
        divider: "rgba(174,183,132,0.1)",
      }
    : {
        sidebarBg: "#ffffff",
        sidebarBorder: "#e8e4d9",
        textPrimary: "#41431B",
        textSecondary: "rgba(65,67,27,0.5)",
        hoverBg: "rgba(174,183,132,0.1)",
        activeBg: "rgba(174,183,132,0.2)",
        activeText: "#41431B",
        activeIcon: "#41431B",
        sectionLabel: "rgba(65,67,27,0.35)",
        contentBg: "#E3DBBB",
        toggleBg: "rgba(65,67,27,0.06)",
        toggleActiveBg: "#41431B",
        divider: "rgba(65,67,27,0.08)",
      };

  // ── Menu items ──
  const mainItems = [
    { text: "Dashboard", icon: <DashboardIcon sx={{ fontSize: 20 }} />, path: "/Dashbord" },
    { text: "My tickets", icon: <ConfirmationNumber sx={{ fontSize: 20 }} />, path: "/my-tickets" },
    { text: "All tickets", icon: <ListAlt sx={{ fontSize: 20 }} />, path: "/all-tickets" },
    { text: "Users", icon: <People sx={{ fontSize: 20 }} />, path: "/users", adminOnly: true },
  ];

  const supportItems = [
    { text: "Settings", icon: <Settings sx={{ fontSize: 20 }} />, path: "/settings" },
  ];

  const filteredMainItems = mainItems.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  // ── Déconnexion ──
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ── Initiales ──
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ── Composant MenuItem ──
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
          "&:active": {
            transform: "scale(0.98)",
          },
        }}
      >
        {/* Indicateur actif */}
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
              bgcolor: "#AEB784",
              transition: "all 0.3s ease",
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
          sx={{ transition: "font-weight 0.2s ease" }}
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
          transition: "all 0.3s ease",
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            px: 3,
            py: 3,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "#AEB784",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "rotate(10deg)" },
            }}
          >
            <Typography fontSize={15} fontWeight={800} color="#41431B">
              TF
            </Typography>
          </Box>
          <Typography
            fontSize={17}
            fontWeight={700}
            color={colors.textPrimary}
            letterSpacing={0.5}
          >
            TicketFlow
          </Typography>
        </Box>

        {/* Section MAIN */}
        <Box sx={{ mt: 1 }}>
          <Typography
            fontSize={11}
            fontWeight={600}
            color={colors.sectionLabel}
            sx={{
              px: 3,
              mb: 1,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
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
            sx={{
              px: 3,
              mb: 1,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            Support
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
            {supportItems.map((item) => (
              <MenuItem key={item.text} item={item} />
            ))}
          </Box>
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Toggle Light/Dark */}
        <Box sx={{ px: 3, mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              bgcolor: colors.toggleBg,
              borderRadius: 3,
              p: 0.4,
            }}
          >
            <Box
              onClick={() => setDarkMode(false)}
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.8,
                py: 0.8,
                borderRadius: 2.5,
                cursor: "pointer",
                transition: "all 0.3s ease",
                bgcolor: !darkMode ? colors.toggleActiveBg : "transparent",
                color: !darkMode ? "#E3DBBB" : colors.textSecondary,
              }}
            >
              <LightMode sx={{ fontSize: 15 }} />
              <Typography fontSize={12} fontWeight={500}>
                Light
              </Typography>
            </Box>
            <Box
              onClick={() => setDarkMode(true)}
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.8,
                py: 0.8,
                borderRadius: 2.5,
                cursor: "pointer",
                transition: "all 0.3s ease",
                bgcolor: darkMode ? colors.toggleActiveBg : "transparent",
                color: darkMode ? "#E3DBBB" : colors.textSecondary,
              }}
            >
              <DarkMode sx={{ fontSize: 15 }} />
              <Typography fontSize={12} fontWeight={500}>
                Dark
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ mx: 2, borderTop: `1px solid ${colors.divider}` }} />

        {/* Profil utilisateur */}
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
              bgcolor: "#AEB784",
              color: "#41431B",
              fontSize: 14,
              fontWeight: 600,
              transition: "transform 0.2s ease",
              "&:hover": { transform: "scale(1.05)" },
            }}
          >
            {!userAvatar && getInitials(userName)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              fontSize={13}
              fontWeight={600}
              color={colors.textPrimary}
              noWrap
            >
              {userName}
            </Typography>
            <Typography
              fontSize={11}
              color={colors.textSecondary}
              sx={{ textTransform: "capitalize" }}
            >
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
                "&:hover": {
                  color: "#c62828",
                  bgcolor: "rgba(198,40,40,0.1)",
                },
              }}
            >
              <Logout sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ====== CONTENU PRINCIPAL ====== */}
      <Box sx={{ flex: 1, transition: "background-color 0.3s ease" }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;