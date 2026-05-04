import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  Tooltip,
  InputBase,
} from "@mui/material";
import {
  GridView,
  ConfirmationNumber,
  People,
  TuneOutlined,
  FormatListBulleted,
  Logout,
  AssignmentInd,
} from "@mui/icons-material";
import { C } from "../theme";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [myOpenCount, setMyOpenCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [allOpenCount, setAllOpenCount] = useState(0);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userRole = user?.role || "user";
  const userName = user?.name || "User";
  const userAvatar = user?.avatar || "";

  const apiUrl = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const token = localStorage.getItem("token");
        const myRes = await fetch(`${apiUrl}/api/tickets/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myData = await myRes.json();
        if (myRes.ok) {
          setMyOpenCount(myData.filter((t: any) => t.status === "open").length);
        }
        if (userRole === "tech" || userRole === "admin") {
          const assignedRes = await fetch(`${apiUrl}/api/tickets/assigned`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const assignedData = await assignedRes.json();
          if (assignedRes.ok) {
            setAssignedCount(
              assignedData.filter(
                (t: any) => t.status !== "resolved" && t.status !== "closed"
              ).length
            );
          }
        }
        if (userRole === "admin") {
          const allRes = await fetch(`${apiUrl}/api/tickets/all`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const allData = await allRes.json();
          if (allRes.ok) {
            setAllOpenCount(
              allData.filter((t: any) => t.status === "open").length
            );
          }
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchBadges();
  }, [location.pathname]);

  const mainItems = [
    {
      text: "Dashboard",
      icon: <GridView sx={{ fontSize: 20 }} />,
      path: "/Dashbord",
      badge: 0,
    },
    {
      text: "My tickets",
      icon: <ConfirmationNumber sx={{ fontSize: 20 }} />,
      path: "/my-tickets",
      badge: myOpenCount,
    },
    {
      text: "Assigned to me",
      icon: <AssignmentInd sx={{ fontSize: 20 }} />,
      path: "/assigned-tickets",
      badge: assignedCount,
      techOnly: true,
    },
    {
      text: "All tickets",
      icon: <FormatListBulleted sx={{ fontSize: 20 }} />,
      path: "/all-tickets",
      badge: allOpenCount,
      adminOnly: true,
    },
    {
      text: "Users",
      icon: <People sx={{ fontSize: 20 }} />,
      path: "/users",
      adminOnly: true,
      badge: 0,
    },
  ];

  const supportItems = [
    {
      text: "Settings",
      icon: <TuneOutlined sx={{ fontSize: 20 }} />,
      path: "/settings",
      badge: 0,
    },
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

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // ── Logo Triangle ──
  const LogoIcon = () => (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <rect width="34" height="34" rx="8" fill={C.navy} />
      <polygon points="17,6 29,27 5,27" fill={C.accent} opacity="0.95" />
      <polygon points="17,11 26,27 8,27" fill="white" opacity="0.15" />
      <circle cx="17" cy="17" r="3.5" fill="white" opacity="0.95" />
    </svg>
  );

  const Badge = ({ count }: { count: number }) => {
    if (count === 0) return null;
    return (
      <Box sx={{
        minWidth: 16, height: 16,
        borderRadius: "8px",
        bgcolor: C.danger,
        color: "white",
        fontSize: 9, fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 0.5, ml: "auto",
        flexShrink: 0,
      }}>
        {count > 99 ? "99+" : count}
      </Box>
    );
  };

  const MenuItem = ({
    item,
  }: {
    item: { text: string; icon: React.ReactNode; path: string; badge: number };
  }) => {
    const isActive = location.pathname === item.path;
    return (
      <Tooltip title={!sidebarOpen ? item.text : ""} placement="right" arrow>
        <Box
          onClick={() => navigate(item.path)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: sidebarOpen ? 1.5 : 0,
            px: sidebarOpen ? 1.5 : 0,
            py: 1,
            mx: 0.5,
            borderRadius: "8px",
            cursor: "pointer",
            justifyContent: sidebarOpen ? "flex-start" : "center",
            position: "relative",
            transition: "all 0.2s ease",
            bgcolor: isActive ? C.accentLight : "transparent",
            "&:hover": { bgcolor: isActive ? C.accentLight : "#F8FAFC" },
          }}
        >
          {isActive && (
            <Box sx={{
              position: "absolute",
              left: 0, top: "50%",
              transform: "translateY(-50%)",
              width: 3, height: 20,
              borderRadius: "0 3px 3px 0",
              bgcolor: C.accent,
            }} />
          )}
          <Box sx={{
            color: isActive ? C.accent : C.textMuted,
            display: "flex", alignItems: "center",
            flexShrink: 0,
          }}>
            {item.icon}
          </Box>
          {sidebarOpen && (
            <>
              <Typography
                fontSize={13}
                fontWeight={isActive ? 600 : 400}
                color={isActive ? C.accent : C.textSecondary}
                sx={{ flex: 1, whiteSpace: "nowrap", fontFamily: "Inter, sans-serif" }}
              >
                {item.text}
              </Typography>
              <Badge count={item.badge} />
            </>
          )}
          {!sidebarOpen && item.badge > 0 && (
            <Box sx={{
              position: "absolute",
              top: 4, right: 4,
              width: 7, height: 7,
              borderRadius: "50%",
              bgcolor: C.danger,
            }} />
          )}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      bgcolor: C.bgPage,
      fontFamily: "Inter, sans-serif",
    }}>

      {/* ══════ NAVBAR ══════ */}
      <Box sx={{
        height: 56,
        bgcolor: "#FFFFFF",
        borderBottom: `2px solid ${C.accent}`,
        display: "flex",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1200,
        flexShrink: 0,
      }}>

        {/* Logo */}
        <Box
          onClick={() => navigate("/Dashbord")}
          sx={{
            width: 56, height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            borderRight: `2px solid ${C.accent}`,
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": { bgcolor: C.accentLight },
          }}
        >
          <LogoIcon />
        </Box>

        {/* Navbar content */}
        <Box sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2,
        }}>

          {/* Brand */}
          <Typography
            fontSize={15}
            fontWeight={700}
            color={C.navy}
            fontFamily="Inter, sans-serif"
            sx={{ letterSpacing: "-0.3px", flexShrink: 0 }}
          >
            TicketFlow
          </Typography>

          {/* ── Search Bar style Dribbble ── */}
          <Box sx={{
            flex: 1,
            maxWidth: 500,
            display: "flex",
            alignItems: "center",
            bgcolor: "#F8FAFC",
            border: `1.5px solid ${C.accent}`,
            borderRadius: "50px",
            px: 0.5,
            py: 0.5,
            gap: 1,
            transition: "all 0.2s ease",
            "&:focus-within": {
              bgcolor: "#FFFFFF",
              boxShadow: `0 0 0 3px ${C.accentLight}`,
            },
          }}>
            <InputBase
              placeholder="Search tickets, users..."
              sx={{
                flex: 1,
                fontSize: 13,
                color: C.textPrimary,
                fontFamily: "Inter, sans-serif",
                pl: 1.5,
                "& input::placeholder": { color: C.textMuted },
              }}
            />
            {/* Cercle search bien collé avec marge */}
            <Box sx={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              bgcolor: C.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: C.accentHover,
                transform: "scale(1.05)",
              },
            }}>
              <svg
                width="15" height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0B162C"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Box>
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* ── Help icon SVG stroke style ── */}
          <Tooltip title="Help">
            <Box sx={{
              width: 36, height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.textMuted,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: C.accentLight,
                color: C.accent,
              },
            }}>
              <svg
                width="20" height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </Box>
          </Tooltip>

          {/* ── Notifications icon SVG stroke style ── */}
          <Tooltip title="Notifications">
            <Box sx={{
              width: 36, height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              color: C.textMuted,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: C.accentLight,
                color: C.accent,
              },
            }}>
              <svg
                width="20" height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {/* Badge rouge */}
              {allOpenCount > 0 && (
                <Box sx={{
                  position: "absolute",
                  top: 4, right: 4,
                  width: 8, height: 8,
                  borderRadius: "50%",
                  bgcolor: C.danger,
                  border: "1.5px solid white",
                }} />
              )}
            </Box>
          </Tooltip>

       {/* ── Profile - cercle seulement ── */}
<Tooltip title="Profile">
  <Avatar
    src={userAvatar}
    onClick={() => navigate("/profile")}
    sx={{
      width: 34, height: 34,
      bgcolor: C.accentMid,
      color: C.accent,
      fontSize: 11,
      fontWeight: 700,
      border: `2px solid ${C.accent}`,
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        border: `2px solid ${C.accentHover}`,
        transform: "scale(1.05)",
      },
    }}
  >
    {!userAvatar && getInitials(userName)}
  </Avatar>
</Tooltip>

        </Box>
      </Box>

      {/* ══════ BODY ══════ */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* SIDEBAR */}
        <Box
          onMouseEnter={() => setSidebarOpen(true)}
          onMouseLeave={() => setSidebarOpen(false)}
          sx={{
            width: sidebarOpen ? 220 : 56,
            bgcolor: "#FFFFFF",
            borderRight: `2px solid ${C.accent}`,
            display: "flex",
            flexDirection: "column",
            transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            flexShrink: 0,
            position: "sticky",
            top: 56,
            height: "calc(100vh - 56px)",
            zIndex: 100,
          }}
        >
          <Box sx={{ px: 0.5, pt: 2, flex: 1 }}>
            {sidebarOpen && (
              <Typography
                fontSize={10}
                fontWeight={600}
                color={C.textMuted}
                sx={{
                  px: 1.5, mb: 1,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  fontFamily: "Inter, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                Main
              </Typography>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {filteredMainItems.map((item) => (
                <MenuItem key={item.text} item={item} />
              ))}
            </Box>

            <Box sx={{ my: 1.5, mx: 1, borderTop: `1px solid ${C.border}` }} />

            {sidebarOpen && (
              <Typography
                fontSize={10}
                fontWeight={600}
                color={C.textMuted}
                sx={{
                  px: 1.5, mb: 1,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  fontFamily: "Inter, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                Support
              </Typography>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {supportItems.map((item) => (
                <MenuItem key={item.text} item={item} />
              ))}
            </Box>
          </Box>

          {/* Logout en bas de sidebar */}
          <Box sx={{
            borderTop: `1px solid ${C.border}`,
            px: 0.5, py: 1,
          }}>
            <Tooltip title="Logout" placement="right">
              <Box
                onClick={handleLogout}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: sidebarOpen ? 1.5 : 0,
                  px: sidebarOpen ? 1.5 : 0,
                  py: 1,
                  mx: 0.5,
                  borderRadius: "8px",
                  cursor: "pointer",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  transition: "all 0.2s ease",
                  color: C.textMuted,
                  "&:hover": {
                    bgcolor: C.dangerBg,
                    color: C.danger,
                  },
                }}
              >
                <Logout sx={{ fontSize: 20 }} />
                {sidebarOpen && (
                  <Typography
                    fontSize={13}
                    fontWeight={400}
                    fontFamily="Inter, sans-serif"
                    color="inherit"
                  >
                    Logout
                  </Typography>
                )}
              </Box>
            </Tooltip>
          </Box>
        </Box>

        {/* CONTENT */}
        <Box
          key={location.pathname}
          className="page-transition"
          sx={{ flex: 1, minWidth: 0, overflow: "auto" }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;