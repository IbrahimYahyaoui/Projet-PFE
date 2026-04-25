import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Switch,
  Button,
  Divider,
  Alert,
  Snackbar,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  Palette,
  Notifications,
  Person,
  AdminPanelSettings,
  ChevronRight,
  Download,
  Delete,
  Lock,
} from "@mui/icons-material";

const Settings = () => {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === "admin";

  // ── States ──
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("english");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifAssigned, setNotifAssigned] = useState(true);
  const [notifComment, setNotifComment] = useState(true);
  const [success, setSuccess] = useState("");

  // ── Style des rows ──
  const sectionStyle = {
    bgcolor: "#fff",
    borderRadius: 3,
    border: "1px solid rgba(65,67,27,0.08)",
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

  const dividerStyle = {
    borderColor: "rgba(65,67,27,0.06)",
    mx: 3,
  };

  const iconBoxStyle = {
    width: 36,
    height: 36,
    borderRadius: 2,
    bgcolor: "rgba(174,183,132,0.2)",
    color: "#41431B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <Box sx={{ flex: 1, p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography fontSize={26} fontWeight={700} color="#41431B">
          Settings
        </Typography>
        <Typography fontSize={14} color="rgba(65,67,27,0.5)" mt={0.5}>
          Manage your preferences and account
        </Typography>
      </Box>

      {/* ── Section Appearance ── */}
      <Typography
        fontSize={12}
        fontWeight={600}
        color="rgba(65,67,27,0.4)"
        sx={{ px: 1, mb: 1, letterSpacing: 1, textTransform: "uppercase" }}
      >
        Appearance
      </Typography>

      <Box sx={sectionStyle}>
        {/* Header */}
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid rgba(65,67,27,0.06)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={iconBoxStyle}>
              <Palette sx={{ fontSize: 18 }} />
            </Box>
            <Typography fontSize={15} fontWeight={600} color="#41431B">
              Appearance
            </Typography>
          </Box>
        </Box>

        {/* Dark mode */}
        <Box sx={rowStyle}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color="#41431B">Dark mode</Typography>
            <Typography fontSize={12} color="rgba(65,67,27,0.5)">
              Switch between light and dark theme
            </Typography>
          </Box>
          <Switch
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": { color: "#41431B" },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#AEB784" },
            }}
          />
        </Box>

        <Divider sx={dividerStyle} />

        {/* Language */}
        <Box sx={rowStyle}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color="#41431B">Language</Typography>
            <Typography fontSize={12} color="rgba(65,67,27,0.5)">
              Choose your preferred language
            </Typography>
          </Box>
          <TextField
            select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setSuccess("Language updated!");
            }}
            size="small"
            sx={{
              width: 150,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "&.Mui-focused fieldset": { borderColor: "#AEB784" },
              },
            }}
          >
            <MenuItem value="english">English</MenuItem>
            <MenuItem value="french">Français</MenuItem>
            <MenuItem value="arabic">العربية</MenuItem>
          </TextField>
        </Box>
      </Box>

      {/* ── Section Notifications ── */}
      <Typography
        fontSize={12}
        fontWeight={600}
        color="rgba(65,67,27,0.4)"
        sx={{ px: 1, mb: 1, letterSpacing: 1, textTransform: "uppercase" }}
      >
        Notifications
      </Typography>

      <Box sx={sectionStyle}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid rgba(65,67,27,0.06)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={iconBoxStyle}>
              <Notifications sx={{ fontSize: 18 }} />
            </Box>
            <Typography fontSize={15} fontWeight={600} color="#41431B">
              Notifications
            </Typography>
          </Box>
        </Box>

        {/* Email notifications */}
        <Box sx={rowStyle}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color="#41431B">Email notifications</Typography>
            <Typography fontSize={12} color="rgba(65,67,27,0.5)">
              Receive notifications via email
            </Typography>
          </Box>
          <Switch
            checked={notifEmail}
            onChange={(e) => setNotifEmail(e.target.checked)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": { color: "#41431B" },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#AEB784" },
            }}
          />
        </Box>

        <Divider sx={dividerStyle} />

        {/* Assigned notifications */}
        <Box sx={rowStyle}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color="#41431B">Ticket assigned</Typography>
            <Typography fontSize={12} color="rgba(65,67,27,0.5)">
              Notify when a ticket is assigned to you
            </Typography>
          </Box>
          <Switch
            checked={notifAssigned}
            onChange={(e) => setNotifAssigned(e.target.checked)}
            disabled={!notifEmail}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": { color: "#41431B" },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#AEB784" },
            }}
          />
        </Box>

        <Divider sx={dividerStyle} />

        {/* Comment notifications */}
        <Box sx={rowStyle}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color="#41431B">New comment</Typography>
            <Typography fontSize={12} color="rgba(65,67,27,0.5)">
              Notify when someone comments on your ticket
            </Typography>
          </Box>
          <Switch
            checked={notifComment}
            onChange={(e) => setNotifComment(e.target.checked)}
            disabled={!notifEmail}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": { color: "#41431B" },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#AEB784" },
            }}
          />
        </Box>
      </Box>

      {/* ── Section Account ── */}
      <Typography
        fontSize={12}
        fontWeight={600}
        color="rgba(65,67,27,0.4)"
        sx={{ px: 1, mb: 1, letterSpacing: 1, textTransform: "uppercase" }}
      >
        Account
      </Typography>

      <Box sx={sectionStyle}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid rgba(65,67,27,0.06)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={iconBoxStyle}>
              <Person sx={{ fontSize: 18 }} />
            </Box>
            <Typography fontSize={15} fontWeight={600} color="#41431B">
              Account
            </Typography>
          </Box>
        </Box>

        {/* Edit profile */}
        <Box
          sx={{
            ...rowStyle,
            cursor: "pointer",
            "&:hover": { bgcolor: "rgba(174,183,132,0.08)" },
          }}
          onClick={() => navigate("/profile")}
        >
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color="#41431B">Edit profile</Typography>
            <Typography fontSize={12} color="rgba(65,67,27,0.5)">
              Change your name and photo
            </Typography>
          </Box>
          <ChevronRight sx={{ color: "rgba(65,67,27,0.3)", fontSize: 20 }} />
        </Box>

        <Divider sx={dividerStyle} />

        {/* Change password */}
        <Box
          sx={{
            ...rowStyle,
            cursor: "pointer",
            "&:hover": { bgcolor: "rgba(174,183,132,0.08)" },
          }}
          onClick={() => navigate("/profile")}
        >
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color="#41431B">Change password</Typography>
            <Typography fontSize={12} color="rgba(65,67,27,0.5)">
              Update your security password
            </Typography>
          </Box>
          <Lock sx={{ color: "rgba(65,67,27,0.3)", fontSize: 20 }} />
        </Box>

        <Divider sx={dividerStyle} />

        {/* Delete account */}
        <Box
          sx={{
            ...rowStyle,
            cursor: "pointer",
            "&:hover": { bgcolor: "rgba(198,40,40,0.05)" },
          }}
          onClick={() => {
            if (window.confirm("Are you sure you want to delete your account? This action is irreversible.")) {
              setSuccess("Account deletion requested.");
            }
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} color="#c62828">Delete account</Typography>
            <Typography fontSize={12} color="rgba(198,40,40,0.6)">
              Permanently delete your account and data
            </Typography>
          </Box>
          <Delete sx={{ color: "#c62828", fontSize: 20 }} />
        </Box>
      </Box>

      {/* ── Section System (admin only) ── */}
      {isAdmin && (
        <>
          <Typography
            fontSize={12}
            fontWeight={600}
            color="rgba(65,67,27,0.4)"
            sx={{ px: 1, mb: 1, letterSpacing: 1, textTransform: "uppercase" }}
          >
            System
          </Typography>

          <Box sx={sectionStyle}>
            <Box sx={{ px: 3, py: 2, borderBottom: "1px solid rgba(65,67,27,0.06)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={iconBoxStyle}>
                  <AdminPanelSettings sx={{ fontSize: 18 }} />
                </Box>
                <Typography fontSize={15} fontWeight={600} color="#41431B">
                  System (Admin only)
                </Typography>
              </Box>
            </Box>

            {/* Export tickets */}
            <Box
              sx={{
                ...rowStyle,
                cursor: "pointer",
                "&:hover": { bgcolor: "rgba(174,183,132,0.08)" },
              }}
              onClick={() => {
                setSuccess("Export started! File will be downloaded shortly.");
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={14} color="#41431B">Export tickets</Typography>
                <Typography fontSize={12} color="rgba(65,67,27,0.5)">
                  Download all tickets as CSV
                </Typography>
              </Box>
              <Button
                variant="contained"
                disableElevation
                size="small"
                startIcon={<Download sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: "#41431B",
                  color: "#E3DBBB",
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: 12,
                  "&:hover": { bgcolor: "#555725" },
                }}
              >
                Export CSV
              </Button>
            </Box>

            <Divider sx={dividerStyle} />

            {/* Manage users */}
            <Box
              sx={{
                ...rowStyle,
                cursor: "pointer",
                "&:hover": { bgcolor: "rgba(174,183,132,0.08)" },
              }}
              onClick={() => navigate("/users")}
            >
              <Box sx={{ flex: 1 }}>
                <Typography fontSize={14} color="#41431B">Manage users</Typography>
                <Typography fontSize={12} color="rgba(65,67,27,0.5)">
                  Add, remove and manage team members
                </Typography>
              </Box>
              <ChevronRight sx={{ color: "rgba(65,67,27,0.3)", fontSize: 20 }} />
            </Box>
          </Box>
        </>
      )}

      {/* Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{ borderRadius: 2 }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;