// frontend/src/components/Layout.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  Tooltip,
  InputBase,
  Divider,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  GridView,
  ConfirmationNumber,
  People,
  TuneOutlined,
  FormatListBulleted,
  AssignmentInd,
  Settings as SettingsIcon,
  DoneAll as DoneAllIcon,
  DeleteSweep as DeleteSweepIcon,
  AssignmentInd as AssignedIcon,
  Comment as CommentIcon,
  SwapHoriz as StatusIcon,
  NotificationsNone as NotifEmptyIcon,
} from "@mui/icons-material";
import { C } from "../theme";
import { BarChart } from "@mui/icons-material";

interface Notification {
  _id: string;
  type: "assigned" | "commented" | "status_changed" | "created";
  message: string;
  read: boolean;
  createdAt: string;
  ticketId: { _id: string; title: string };
  triggeredBy: { name: string };
}

interface LayoutProps {
  children: React.ReactNode;
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${days}j`;
};

const notifIcon = (type: string) => {
  switch (type) {
    case "assigned":       return <AssignedIcon sx={{ fontSize: 16 }} />;
    case "commented":      return <CommentIcon  sx={{ fontSize: 16 }} />;
    case "status_changed": return <StatusIcon   sx={{ fontSize: 16 }} />;
    default:               return <ConfirmationNumber sx={{ fontSize: 16 }} />;
  }
};

const notifColor = (type: string) => {
  switch (type) {
    case "assigned":       return "#2563EB";
    case "commented":      return C.accent;
    case "status_changed": return "#EA580C";
    default:               return C.accent;
  }
};

const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [myOpenCount, setMyOpenCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [allOpenCount, setAllOpenCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userRole = user?.role || "user";
  const userName = user?.name || "User";
  const userAvatar = user?.avatar || "";

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const token = localStorage.getItem("token");
        const myRes = await fetch(`${apiUrl}/api/tickets/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myData = await myRes.json();
        if (myRes.ok) setMyOpenCount(myData.filter((t: any) => t.status === "open").length);
        if (userRole === "tech" || userRole === "admin") {
          const assignedRes = await fetch(`${apiUrl}/api/tickets/assigned`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const assignedData = await assignedRes.json();
          if (assignedRes.ok) setAssignedCount(assignedData.filter((t: any) => t.status !== "resolved" && t.status !== "closed").length);
        }
        if (userRole === "admin") {
          const allRes = await fetch(`${apiUrl}/api/tickets/all`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const allData = await allRes.json();
          if (allRes.ok) setAllOpenCount(allData.filter((t: any) => t.status === "open").length);
        }
      } catch (err) { console.log(err); }
    };
    fetchBadges();
  }, [location.pathname]);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) { setNotifications(data.notifications); setUnreadCount(data.unreadCount); }
    } catch (err) { console.log(err); }
    finally { setNotifLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/notifications/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) { console.log(err); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) { console.log(err); }
  };

  const handleDeleteAll = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/notifications/delete-all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) { console.log(err); }
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.read) await handleMarkAsRead(notif._id);
    setNotifOpen(false);
    navigate(`/tickets/${notif.ticketId._id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const unreadNotifs = notifications.filter((n) => !n.read);
  const readNotifs   = notifications.filter((n) => n.read);

  const mainItems = [
    {
      text: "My Team",
      icon: (
        // ✅ Carré navy + border teal + icône people teal — exactement capture 2
        <Box sx={{
          width: 32, height: 32,
          borderRadius: "8px",
          bgcolor: C.navy,
          border: `2px solid ${C.accent}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.2s",
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </Box>
      ),
      path: "/team",
      badge: 0,
      techOnly: true,
      isTeam: true,
    },
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
    {
  text: "Analytics",
  icon: <BarChart sx={{ fontSize: 20 }} />,
  path: "/analytics",
  badge: 0,
  adminOnly: true,
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

  const filteredMainItems = mainItems.filter((item: any) => {
    if (item.adminOnly) return userRole === "admin";
    if (item.techOnly) return userRole === "tech" || userRole === "admin";
    return true;
  });

  const LogoIcon = () => (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <rect width="34" height="34" rx="8" fill={C.navy} />
      <polygon points="17,6 29,27 5,27" fill={C.accent} opacity="0.95" />
      <polygon points="17,11 26,27 8,27" fill="white" opacity="0.15" />
      <circle cx="17" cy="17" r="3.5" fill="white" opacity="0.95" />
    </svg>
  );

  const BadgeCount = ({ count }: { count: number }) => {
    if (count === 0) return null;
    return (
      <Box sx={{ minWidth: 16, height: 16, borderRadius: "8px", bgcolor: C.danger, color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", px: 0.5, ml: "auto", flexShrink: 0 }}>
        {count > 99 ? "99+" : count}
      </Box>
    );
  };

  const SidebarItem = ({ item }: { item: any }) => {
    const isActive = location.pathname === item.path;
    const isTeam = item.isTeam;
    return (
      <Tooltip title={!sidebarOpen ? item.text : ""} placement="right" arrow>
        <Box
          onClick={() => navigate(item.path)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: sidebarOpen ? 1.5 : 0,
            px: sidebarOpen ? 1.5 : 0,
            py: isTeam ? 1.2 : 1,
            mx: 0.5,
            borderRadius: "8px",
            cursor: "pointer",
            justifyContent: sidebarOpen ? "flex-start" : "center",
            position: "relative",
            transition: "all 0.2s ease",
            bgcolor: isActive ? C.accentLight : "transparent",
            "&:hover": { bgcolor: C.accentLight },
          }}
        >
          {isActive && (
            <Box sx={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, borderRadius: "0 3px 3px 0", bgcolor: C.accent }} />
          )}
          <Box sx={{ color: isActive ? C.accent : C.textMuted, display: "flex", alignItems: "center", flexShrink: 0 }}>
            {item.icon}
          </Box>
          {sidebarOpen && (
            <>
              <Typography
                fontSize={isTeam ? 13.5 : 13}
                fontWeight={isActive || isTeam ? 600 : 400}
                color={isActive ? C.accent : isTeam ? C.accent : C.textSecondary}
                sx={{ flex: 1, whiteSpace: "nowrap", fontFamily: "Inter, sans-serif" }}
              >
                {item.text}
              </Typography>
              <BadgeCount count={item.badge} />
            </>
          )}
          {!sidebarOpen && item.badge > 0 && (
            <Box sx={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", bgcolor: C.danger }} />
          )}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: C.bgPage, fontFamily: "Inter, sans-serif" }}>

      {/* ══════ NAVBAR ══════ */}
      <Box sx={{ height: 56, bgcolor: "#FFFFFF", borderBottom: `2px solid ${C.accent}`, display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 1200, flexShrink: 0 }}>
        <Box onClick={() => navigate("/Dashbord")} sx={{ width: 56, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRight: `2px solid ${C.accent}`, cursor: "pointer", "&:hover": { bgcolor: C.accentLight } }}>
          <LogoIcon />
        </Box>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 2, px: 2 }}>
          <Typography fontSize={15} fontWeight={700} color={C.navy} fontFamily="Inter, sans-serif" sx={{ letterSpacing: "-0.3px", flexShrink: 0 }}>
            TicketFlow
          </Typography>
          <Box sx={{ flex: 1, maxWidth: 500, display: "flex", alignItems: "center", bgcolor: "#F8FAFC", border: `1.5px solid ${C.accent}`, borderRadius: "50px", px: 0.5, py: 0.5, gap: 1, "&:focus-within": { bgcolor: "#FFFFFF", boxShadow: `0 0 0 3px ${C.accentLight}` } }}>
            <InputBase placeholder="Search tickets, users..." sx={{ flex: 1, fontSize: 13, color: C.textPrimary, fontFamily: "Inter, sans-serif", pl: 1.5, "& input::placeholder": { color: C.textMuted } }} />
            <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", "&:hover": { bgcolor: C.accentHover } }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0B162C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Box>
          </Box>
          <Box sx={{ flex: 1 }} />

          <Tooltip title="Help">
            <Box sx={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.textMuted, "&:hover": { bgcolor: C.accentLight, color: C.accent } }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </Box>
          </Tooltip>

          {/* NOTIFICATIONS */}
          <Box ref={notifRef} sx={{ position: "relative" }}>
            <Tooltip title="Notifications">
              <Box
                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
                sx={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", color: notifOpen ? C.accent : C.textMuted, bgcolor: notifOpen ? C.accentLight : "transparent", "&:hover": { bgcolor: C.accentLight, color: C.accent } }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <Box sx={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", bgcolor: C.danger, border: "1.5px solid white" }} />
                )}
              </Box>
            </Tooltip>

            {notifOpen && (
              <Box sx={{ position: "absolute", top: "calc(100% + 12px)", right: -100, width: 420, maxHeight: 520, bgcolor: "#FFFFFF", borderRadius: "16px", boxShadow: "0 8px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`, zIndex: 9999, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `2px solid ${C.accent}` }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", color: C.navy }}>
                    Notifications
                    {unreadCount > 0 && (
                      <Box component="span" sx={{ ml: 1, px: 1, py: 0.2, bgcolor: C.danger, color: "white", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 700 }}>{unreadCount}</Box>
                    )}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Tout marquer comme lu">
                      <IconButton size="small" onClick={handleMarkAllAsRead} sx={{ color: C.textMuted, "&:hover": { color: C.accent, bgcolor: C.accentLight } }}>
                        <DoneAllIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Tout supprimer">
                      <IconButton size="small" onClick={handleDeleteAll} sx={{ color: C.textMuted, "&:hover": { color: C.danger, bgcolor: C.dangerBg } }}>
                        <DeleteSweepIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Paramètres">
                      <IconButton size="small" onClick={() => { setNotifOpen(false); navigate("/settings"); }} sx={{ color: C.textMuted, "&:hover": { color: C.accent, bgcolor: C.accentLight } }}>
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Box sx={{ overflowY: "auto", flex: 1 }}>
                  {notifLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} sx={{ color: C.accent }} /></Box>
                  ) : notifications.length === 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 1 }}>
                      <NotifEmptyIcon sx={{ fontSize: 48, color: C.textMuted }} />
                      <Typography sx={{ fontFamily: "Inter, sans-serif", color: C.textMuted, fontSize: "0.875rem" }}>Aucune notification</Typography>
                    </Box>
                  ) : (
                    <>
                      {unreadNotifs.length > 0 && (
                        <>
                          <Box sx={{ px: 2.5, py: 1.5, bgcolor: C.bgPage }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.78rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Importantes</Typography>
                          </Box>
                          {unreadNotifs.map((notif, i) => (
                            <Box key={notif._id}>
                              <Box onClick={() => handleNotifClick(notif)} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, px: 2.5, py: 1.8, cursor: "pointer", bgcolor: `${C.accent}08`, "&:hover": { bgcolor: C.accentLight } }}>
                                <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: `${notifColor(notif.type)}15`, color: notifColor(notif.type), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.3 }}>
                                  {notifIcon(notif.type)}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: C.navy, fontWeight: 500, lineHeight: 1.4, mb: 0.3 }}>{notif.message}</Typography>
                                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: C.accent, fontWeight: 600 }}>{timeAgo(notif.createdAt)}</Typography>
                                </Box>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: C.accent, flexShrink: 0, mt: 1 }} />
                              </Box>
                              {i < unreadNotifs.length - 1 && <Divider sx={{ borderColor: C.divider }} />}
                            </Box>
                          ))}
                        </>
                      )}
                      {readNotifs.length > 0 && (
                        <>
                          <Box sx={{ px: 2.5, py: 1.5, bgcolor: C.bgPage, borderTop: unreadNotifs.length > 0 ? `2px solid ${C.accent}` : "none" }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.78rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Autres notifications</Typography>
                          </Box>
                          {readNotifs.map((notif, i) => (
                            <Box key={notif._id}>
                              <Box onClick={() => handleNotifClick(notif)} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, px: 2.5, py: 1.8, cursor: "pointer", "&:hover": { bgcolor: C.bgPage } }}>
                                <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: `${notifColor(notif.type)}10`, color: notifColor(notif.type), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.3, opacity: 0.7 }}>
                                  {notifIcon(notif.type)}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: C.textSecondary, fontWeight: 400, lineHeight: 1.4, mb: 0.3 }}>{notif.message}</Typography>
                                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: C.textMuted }}>{timeAgo(notif.createdAt)}</Typography>
                                </Box>
                              </Box>
                              {i < readNotifs.length - 1 && <Divider sx={{ borderColor: C.divider }} />}
                            </Box>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            )}
          </Box>

          <Tooltip title="Profile">
            <Avatar src={userAvatar} onClick={() => navigate("/profile")}
              sx={{ width: 34, height: 34, bgcolor: C.accentMid, color: C.accent, fontSize: 11, fontWeight: 700, border: `2px solid ${C.accent}`, cursor: "pointer", "&:hover": { border: `2px solid ${C.accentHover}`, transform: "scale(1.05)" } }}>
              {!userAvatar && getInitials(userName)}
            </Avatar>
          </Tooltip>
        </Box>
      </Box>

      {/* ══════ BODY ══════ */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ✅ SIDEBAR FIXE */}
        <Box
          onMouseEnter={() => setSidebarOpen(true)}
          onMouseLeave={() => setSidebarOpen(false)}
          sx={{ width: sidebarOpen ? 220 : 56, bgcolor: "#FFFFFF", borderRight: `2px solid ${C.accent}`, display: "flex", flexDirection: "column", transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)", overflow: "hidden", flexShrink: 0, height: "100%", zIndex: 100 }}
        >
          {/* ✅ My Team EN HAUT avec section séparée */}
          <Box sx={{ px: 0.5, pt: 2, pb: 1 }}>
            {sidebarOpen && (
              <Typography fontSize={10} fontWeight={600} color={C.textMuted}
                sx={{ px: 1.5, mb: 1, letterSpacing: "1px", textTransform: "uppercase", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
                Team
              </Typography>
            )}
            {filteredMainItems.filter((i: any) => i.isTeam).map((item: any) => (
              <SidebarItem key={item.text} item={item} />
            ))}
          </Box>

          {/* ✅ Ligne teal séparatrice */}
          <Box sx={{ mx: 1.5, borderTop: `2px solid ${C.accent}`, opacity: 0.25 }} />

          {/* Autres items */}
          <Box sx={{ px: 0.5, pt: 1.5, flex: 1, overflowY: "auto",
            "&::-webkit-scrollbar": { width: 0 },
          }}>
            {sidebarOpen && (
              <Typography fontSize={10} fontWeight={600} color={C.textMuted}
                sx={{ px: 1.5, mb: 1, letterSpacing: "1px", textTransform: "uppercase", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
                Main
              </Typography>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {filteredMainItems.filter((i: any) => !i.isTeam).map((item: any) => (
                <SidebarItem key={item.text} item={item} />
              ))}
            </Box>

            <Box sx={{ my: 1.5, mx: 1, borderTop: `1px solid ${C.border}` }} />

            {sidebarOpen && (
              <Typography fontSize={10} fontWeight={600} color={C.textMuted}
                sx={{ px: 1.5, mb: 1, letterSpacing: "1px", textTransform: "uppercase", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
                Support
              </Typography>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {supportItems.map((item) => <SidebarItem key={item.text} item={item} />)}
            </Box>
          </Box>
        </Box>

        {/* ✅ CONTENT scroll uniquement ici */}
        <Box key={location.pathname} className="page-transition" sx={{ flex: 1, minWidth: 0, overflowY: "auto", height: "100%" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;