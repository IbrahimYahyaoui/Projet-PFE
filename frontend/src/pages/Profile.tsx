import { useState, useRef } from "react";
import {
  Box, Typography, Button, TextField, Avatar,
  Alert, Snackbar, IconButton, Divider,
} from "@mui/material";
import {
  CameraAlt, Lock, Visibility, VisibilityOff,
  ChevronRight, Person, Email, Badge, Logout,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { C } from "../theme";

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const Profile = () => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { setError("Image must be less than 500KB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const newAvatar = reader.result as string;
      setAvatar(newAvatar);
      saveProfile(name, newAvatar);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (newName: string, newAvatar: string) => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName, avatar: newAvatar }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "Failed to update profile"); setLoading(false); return; }
      const updatedUser = { ...user, name: data.user.name, avatar: data.user.avatar };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setSuccess("Profile updated successfully!");
      setEditMode(false);
    } catch { setError("Cannot connect to server"); }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    setError("");
    if (newPassword !== confirmPassword) { setError("New passwords don't match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/profile/${user.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "Failed to change password"); setLoading(false); return; }
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPasswordMode(false);
      setSuccess("Password changed successfully!");
    } catch { setError("Cannot connect to server"); }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const rowStyle = {
    display: "flex", alignItems: "center", px: 2.5, py: 2, gap: 2,
    transition: "all 0.2s ease",
  };

  const sectionStyle = {
    bgcolor: C.card, borderRadius: 3, border: `1px solid ${C.border}`, overflow: "hidden", mb: 3,
  };

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2, bgcolor: "#1C1410", color: C.textPrimary,
      "& fieldset": { borderColor: C.border },
      "&:hover fieldset": { borderColor: "rgba(245,158,11,0.3)" },
      "&.Mui-focused fieldset": { borderColor: C.accent },
    },
    "& .MuiInputLabel-root": { color: C.textSecondary },
    "& .MuiInputLabel-root.Mui-focused": { color: C.accent },
  };

  return (
    <Box sx={{ flex: 1, display: "flex", justifyContent: "center", py: 4, px: 2, bgcolor: C.bg }}>
      <Box sx={{ width: "100%", maxWidth: 500 }}>
        {/* Avatar + Nom */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
          <Box sx={{ position: "relative", mb: 2 }}>
            <Avatar
              src={avatar}
              sx={{ width: 90, height: 90, bgcolor: C.iconBg, color: C.accent, fontSize: 28, fontWeight: 700, border: `4px solid rgba(245,158,11,0.2)` }}
            >
              {!avatar && getInitials(name)}
            </Avatar>
            <IconButton size="small" onClick={() => fileInputRef.current?.click()}
              sx={{ position: "absolute", bottom: 0, right: 0, bgcolor: C.accent, color: "#1C1410", width: 30, height: 30, border: `2px solid ${C.bg}`, "&:hover": { bgcolor: C.accentHover, transform: "scale(1.1)" } }}
            >
              <CameraAlt sx={{ fontSize: 14 }} />
            </IconButton>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </Box>
          <Typography fontSize={20} fontWeight={700} color={C.textPrimary}>{name}</Typography>
          <Typography fontSize={14} color={C.textSecondary} mt={0.3}>{user?.email}</Typography>
          <Button variant="contained" disableElevation size="small" onClick={() => setEditMode(true)}
            sx={{ mt: 2, borderRadius: 6, px: 3, py: 0.8, bgcolor: C.accent, color: "#1C1410", textTransform: "none", fontWeight: 600, fontSize: 13, "&:hover": { bgcolor: C.accentHover } }}
          >
            Edit profile
          </Button>
        </Box>

        {/* Account Section */}
        <Typography fontSize={12} fontWeight={600} color={C.textMuted} sx={{ px: 2.5, mb: 1, letterSpacing: 1, textTransform: "uppercase" }}>
          Account
        </Typography>
        <Box sx={sectionStyle}>
          <Box sx={{ ...rowStyle, cursor: "default" }}>
            <Person sx={{ fontSize: 20, color: C.textMuted }} />
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={14} color={C.textPrimary}>Name</Typography>
            </Box>
            <Typography fontSize={14} color={C.textSecondary}>{name}</Typography>
          </Box>
          <Divider sx={{ borderColor: C.border, mx: 2.5 }} />
          <Box sx={{ ...rowStyle, cursor: "default" }}>
            <Email sx={{ fontSize: 20, color: C.textMuted }} />
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={14} color={C.textPrimary}>Email</Typography>
            </Box>
            <Typography fontSize={14} color={C.textSecondary}>{user?.email}</Typography>
          </Box>
          <Divider sx={{ borderColor: C.border, mx: 2.5 }} />
          <Box sx={{ ...rowStyle, cursor: "default" }}>
            <Badge sx={{ fontSize: 20, color: C.textMuted }} />
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={14} color={C.textPrimary}>Role</Typography>
            </Box>
            <Box sx={{ bgcolor: C.iconBg, color: C.accent, px: 1.5, py: 0.3, borderRadius: 2, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
              {user?.role}
            </Box>
          </Box>
        </Box>

        {/* Security Section */}
        <Typography fontSize={12} fontWeight={600} color={C.textMuted} sx={{ px: 2.5, mb: 1, letterSpacing: 1, textTransform: "uppercase" }}>
          Security
        </Typography>
        <Box sx={sectionStyle}>
          <Box sx={{ ...rowStyle, cursor: "pointer", "&:hover": { bgcolor: C.hoverBg } }} onClick={() => setPasswordMode(!passwordMode)}>
            <Lock sx={{ fontSize: 20, color: C.textMuted }} />
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={14} color={C.textPrimary}>Change password</Typography>
            </Box>
            <ChevronRight sx={{ fontSize: 20, color: C.textMuted, transition: "transform 0.2s ease", transform: passwordMode ? "rotate(90deg)" : "rotate(0deg)" }} />
          </Box>

          {passwordMode && (
            <Box sx={{ px: 2.5, pb: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField label="Current password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} fullWidth size="small" sx={fieldStyle}
                slotProps={{ input: { endAdornment: <IconButton size="small" onClick={() => setShowCurrentPassword((v) => !v)} sx={{ color: C.textSecondary }}>{showCurrentPassword ? <Visibility sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton> } }}
              />
              <TextField label="New password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth size="small" sx={fieldStyle}
                slotProps={{ input: { endAdornment: <IconButton size="small" onClick={() => setShowNewPassword((v) => !v)} sx={{ color: C.textSecondary }}>{showNewPassword ? <Visibility sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton> } }}
              />
              <TextField label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} fullWidth size="small" sx={fieldStyle} />
              {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
              <Button variant="contained" disableElevation onClick={handleChangePassword} disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                sx={{ bgcolor: C.accent, color: "#1C1410", textTransform: "none", borderRadius: 2, fontWeight: 600, alignSelf: "flex-start", "&:hover": { bgcolor: C.accentHover } }}
              >
                {loading ? "Changing..." : "Update password"}
              </Button>
            </Box>
          )}
        </Box>

        {/* Logout */}
        <Box sx={sectionStyle}>
          <Box sx={{ ...rowStyle, cursor: "pointer", "&:hover": { bgcolor: C.dangerBg } }} onClick={handleLogout}>
            <Logout sx={{ fontSize: 20, color: C.danger }} />
            <Typography fontSize={14} fontWeight={500} color={C.danger}>Logout</Typography>
          </Box>
        </Box>

        {/* Edit Modal */}
        {editMode && (
          <Box
            sx={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, bgcolor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300 }}
            onClick={() => setEditMode(false)}
          >
            <Box sx={{ bgcolor: C.card, borderRadius: 4, p: 4, width: 380, display: "flex", flexDirection: "column", gap: 2.5, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
              <Typography fontSize={18} fontWeight={700} color={C.textPrimary}>Edit profile</Typography>
              <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} fullWidth size="small" sx={fieldStyle} />
              {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
              <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                <Button onClick={() => setEditMode(false)} sx={{ textTransform: "none", color: C.textSecondary, borderRadius: 2 }}>Cancel</Button>
                <Button variant="contained" disableElevation onClick={() => saveProfile(name, avatar)} disabled={loading}
                  sx={{ bgcolor: C.accent, color: "#1C1410", textTransform: "none", borderRadius: 2, fontWeight: 600, "&:hover": { bgcolor: C.accentHover } }}
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity="success" onClose={() => setSuccess("")} sx={{ borderRadius: 2 }}>{success}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Profile;