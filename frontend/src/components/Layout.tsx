import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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

  const allMenuItems = [
    { text: "Dashboard", icon: <DashboardIcon fontSize="small" />, path: "/Dashbord" },
    { text: "My tickets", icon: <ConfirmationNumber fontSize="small" />, path: "/my-tickets" },
    { text: "All tickets", icon: <ListAlt fontSize="small" />, path: "/all-tickets" },
    { text: "Users", icon: <People fontSize="small" />, path: "/users", adminOnly: true },
    { text: "Settings", icon: <Settings fontSize="small" />, path: "/settings" },
  ];

  const menuItems = allMenuItems.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

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

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <Box
        sx={{
          width: 240,
          bgcolor: "#fff",
          borderRight: "1px solid #e0e0e0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ px: 3, py: 3 }}>
          <Typography variant="h6" fontWeight={700}>
            TicketFlow
          </Typography>
        </Box>

        <List sx={{ px: 1.5, flex: 1 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "#e3f2fd",
                  color: "#1565c0",
                  "& .MuiListItemIcon-root": { color: "#1565c0" },
                },
                "&:hover": { bgcolor: "#f5f5f5" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontSize: 14 }}
              />
            </ListItemButton>
          ))}
        </List>

        {/* Profil utilisateur - cliquable */}
        <Box
          sx={{
            px: 2,
            py: 2,
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
            "&:hover": { bgcolor: "#f5f5f5" },
          }}
          onClick={() => navigate("/profile")}
        >
          <Avatar
            src={userAvatar}
            sx={{
              width: 32,
              height: 32,
              bgcolor: "#1565c0",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {!userAvatar && getInitials(userName)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={13} fontWeight={600}>
              {userName}
            </Typography>
            <Typography
              fontSize={11}
              color="text.secondary"
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
            >
              <Logout sx={{ fontSize: 18, color: "text.secondary" }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {children}
    </Box>
  );
};

export default Layout;