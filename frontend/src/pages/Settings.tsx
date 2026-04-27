import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Switch, Button, Divider,
  Alert, Snackbar, MenuItem, TextField,
} from "@mui/material";
import {
  Palette, Notifications, Person, AdminPanelSettings,
  ChevronRight, Download, Delete, Lock,
} from "@mui/icons-material";
import { C } from "../theme";

const Settings = () => {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === "admin";

  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("english");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifAssigned, setNotifAssigned] = useState(true);
  const [notifComment, setNotifComment] = useState(true);
  const [success, setSuccess] = useState("");

  const sectionStyle = {
    bgcolor: C.card,
    borderRadius: 3,
    border: `1px solid ${C.border}`,
    overflow: "hidden",
    mb: 3,
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    px: 3,
    py: 2,
    gap: 2,
    transition: "all 0.2s ease",
  };

  const iconBoxStyle = {
    width: 36,
    height: 36,
    borderRadius: 2,
    bgcolor: C.iconBg,
    color: C.accent,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const switchStyle = {
    "& .MuiSwitch-switchBase.Mui-checked": { color: C.accent },
    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: C.accentHover },
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: C.textMuted,
    px: 1,
    mb: 1,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  };

  return (
    <Box sx={{ flex: 1, p: 4, bgcolor: C.bg }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography fontSize={26} fontWeight={700} color={C.textPrimary}>Settings</Typography>
        <Typography fontSize={14} color={C.textSecondary} mt={0.5}>Manage your preferences and account</Typography>
      </Box>

      {/* ── Appearance ── */}
      <Typography sx={labelStyle}>Appearance</Typography>
      <Box sx={sectionStyle}>
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${C.border}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={iconBoxStyle}><Palette sx={{ fontSize: 18 }} /></Box>
            <Typography fontSize={15} fontWeight={600} color={C.textPrimary}>Appearance</Typography>
          </Box>
        </Box>

        <Box sx={rowStyle}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color={C.textPrimary}>Dark mode</Typography>
            <Typography fontSize={12} color={C.textSecondary}>Switch between light and dark theme</Typography>
          </Box>
          <Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} sx={switchStyle} />
        </Box>

        <Divider sx={{ borderColor: C.border, mx: 3 }} />

        <Box sx={rowStyle}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color={C.textPrimary}>Language</Typography>
            <Typography fontSize={12} color={C.textSecondary}>Choose your preferred language</Typography>
          </Box>
          <TextField
            select value={language}
            onChange={(e) => { setLanguage(e.target.value); setSuccess("Language updated!"); }}
            size="small"
            sx={{
              width: 150,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2, bgcolor: "#1C1410", color: C.textPrimary,
                "& fieldset": { borderColor: C.border },
                "&:hover fieldset": { borderColor: "rgba(245,158,11,0.3)" },
                "&.Mui-focused fieldset": { borderColor: C.accent },
              },
              "& .MuiSelect-icon": { color: C.textSecondary },
            }}
          >
            <MenuItem value="english">English</MenuItem>
            <MenuItem value="french">Français</MenuItem>
            <MenuItem value="arabic">العربية</MenuItem>
          </TextField>
        </Box>
      </Box>

      {/* ── Notifications ── */}
      <Typography sx={labelStyle}>Notifications</Typography>
      <Box sx={sectionStyle}>
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${C.border}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={iconBoxStyle}><Notifications sx={{ fontSize: 18 }} /></Box>
            <Typography fontSize={15} fontWeight={600} color={C.textPrimary}>Notifications</Typography>
          </Box>
        </Box>

        <Box sx={rowStyle}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color={C.textPrimary}>Email notifications</Typography>
            <Typography fontSize={12} color={C.textSecondary}>Receive notifications via email</Typography>
          </Box>
          <Switch checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} sx={switchStyle} />
        </Box>

        <Divider sx={{ borderColor: C.border, mx: 3 }} />

        <Box sx={rowStyle}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color={C.textPrimary}>Ticket assigned</Typography>
            <Typography fontSize={12} color={C.textSecondary}>Notify when a ticket is assigned to you</Typography>
          </Box>
          <Switch checked={notifAssigned} onChange={(e) => setNotifAssigned(e.target.checked)} disabled={!notifEmail} sx={switchStyle} />
        </Box>

        <Divider sx={{ borderColor: C.border, mx: 3 }} />

        <Box sx={rowStyle}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color={C.textPrimary}>New comment</Typography>
            <Typography fontSize={12} color={C.textSecondary}>Notify when someone comments on your ticket</Typography>
          </Box>
          <Switch checked={notifComment} onChange={(e) => setNotifComment(e.target.checked)} disabled={!notifEmail} sx={switchStyle} />
        </Box>
      </Box>

      {/* ── Account ── */}
      <Typography sx={labelStyle}>Account</Typography>
      <Box sx={sectionStyle}>
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${C.border}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={iconBoxStyle}><Person sx={{ fontSize: 18 }} /></Box>
            <Typography fontSize={15} fontWeight={600} color={C.textPrimary}>Account</Typography>
          </Box>
        </Box>

        <Box sx={{ ...rowStyle, cursor: "pointer", "&:hover": { bgcolor: C.hoverBg } }} onClick={() => navigate("/profile")}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color={C.textPrimary}>Edit profile</Typography>
            <Typography fontSize={12} color={C.textSecondary}>Change your name and photo</Typography>
          </Box>
          <ChevronRight sx={{ color: C.textMuted, fontSize: 20 }} />
        </Box>

        <Divider sx={{ borderColor: C.border, mx: 3 }} />

        <Box sx={{ ...rowStyle, cursor: "pointer", "&:hover": { bgcolor: C.hoverBg } }} onClick={() => navigate("/profile")}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color={C.textPrimary}>Change password</Typography>
            <Typography fontSize={12} color={C.textSecondary}>Update your security password</Typography>
          </Box>
          <Lock sx={{ color: C.textMuted, fontSize: 20 }} />
        </Box>

        <Divider sx={{ borderColor: C.border, mx: 3 }} />

        <Box
          sx={{ ...rowStyle, cursor: "pointer", "&:hover": { bgcolor: C.dangerBg } }}
          onClick={() => { if (window.confirm("Are you sure?")) setSuccess("Account deletion requested."); }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color={C.danger}>Delete account</Typography>
            <Typography fontSize={12} color="rgba(198,40,40,0.6)">Permanently delete your account and data</Typography>
          </Box>
          <Delete sx={{ color: C.danger, fontSize: 20 }} />
        </Box>
      </Box>

      {/* ── System (admin only) ── */}
      {isAdmin && (
        <>
          <Typography sx={labelStyle}>System</Typography>
          <Box sx={sectionStyle}>
            <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${C.border}` }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={iconBoxStyle}><AdminPanelSettings sx={{ fontSize: 18 }} /></Box>
                <Typography fontSize={15} fontWeight={600} color={C.textPrimary}>System (Admin only)</Typography>
              </Box>
            </Box>

            <Box sx={{ ...rowStyle, cursor: "pointer", "&:hover": { bgcolor: C.hoverBg } }} onClick={() => setSuccess("Export started!")}>
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={14} color={C.textPrimary}>Export tickets</Typography>
                <Typography fontSize={12} color={C.textSecondary}>Download all tickets as CSV</Typography>
              </Box>
              <Button variant="contained" disableElevation size="small" startIcon={<Download sx={{ fontSize: 16 }} />}
                sx={{ bgcolor: C.accent, color: "#1C1410", textTransform: "none", borderRadius: 2, fontWeight: 700, fontSize: 12, "&:hover": { bgcolor: C.accentHover } }}
              >
                Export CSV
              </Button>
            </Box>

            <Divider sx={{ borderColor: C.border, mx: 3 }} />

            <Box sx={{ ...rowStyle, cursor: "pointer", "&:hover": { bgcolor: C.hoverBg } }} onClick={() => navigate("/users")}>
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={14} color={C.textPrimary}>Manage users</Typography>
                <Typography fontSize={12} color={C.textSecondary}>Add, remove and manage team members</Typography>
              </Box>
              <ChevronRight sx={{ color: C.textMuted, fontSize: 20 }} />
            </Box>
          </Box>
        </>
      )}

      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" onClose={() => setSuccess("")} sx={{ borderRadius: 2 }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;