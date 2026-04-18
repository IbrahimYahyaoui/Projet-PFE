import { useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Avatar,
  Alert,
  Snackbar,
  IconButton,
  Switch,
} from "@mui/material";
import {
  CameraAlt,
  Edit,
  Lock,
  Visibility,
  VisibilityOff,
  ChevronRight,
  Person,
  Email,
  Badge,
  Logout,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500000) {
      setError("Image must be less than 500KB");
      return;
    }

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName, avatar: newAvatar }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update profile");
        setLoading(false);
        return;
      }

      const updatedUser = { ...user, name: data.user.name, avatar: data.user.avatar };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setSuccess("Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      setError("Cannot connect to server");
    }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/profile/${user.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to change password");
        setLoading(false);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMode(false);
      setSuccess("Password changed successfully!");
    } catch (err) {
      setError("Cannot connect to server");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ── Style d'un row ──
  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 2,
    px: 2.5,
    py: 1.8,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": { bgcolor: "rgba(174,183,132,0.08)" },
  };

  const dividerStyle = {
    borderBottom: "1px solid rgba(65,67,27,0.08)",
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 500 }}>
        {/* ── Avatar + Nom + Email ── */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box sx={{ position: "relative", mb: 2 }}>
            <Avatar
              src={avatar}
              sx={{
                width: 90,
                height: 90,
                bgcolor: "#AEB784",
                color: "#41431B",
                fontSize: 28,
                fontWeight: 700,
                border: "4px solid rgba(174,183,132,0.3)",
              }}
            >
              {!avatar && getInitials(name)}
            </Avatar>
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                bgcolor: "#41431B",
                color: "#E3DBBB",
                width: 30,
                height: 30,
                border: "2px solid #E3DBBB",
                transition: "all 0.2s ease",
                "&:hover": { bgcolor: "#555725", transform: "scale(1.1)" },
              }}
            >
              <CameraAlt sx={{ fontSize: 14 }} />
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageUpload}
            />
          </Box>

          <Typography fontSize={20} fontWeight={700} color="#41431B">
            {name}
          </Typography>
          <Typography fontSize={14} color="rgba(65,67,27,0.5)" mt={0.3}>
            {user?.email}
          </Typography>

          <Button
            variant="contained"
            disableElevation
            size="small"
            onClick={() => setEditMode(true)}
            sx={{
              mt: 2,
              borderRadius: 6,
              px: 3,
              py: 0.8,
              bgcolor: "#41431B",
              color: "#E3DBBB",
              textTransform: "none",
              fontWeight: 600,
              fontSize: 13,
              "&:hover": { bgcolor: "#555725" },
            }}
          >
            Edit profile
          </Button>
        </Box>

        {/* ── Section: Account ── */}
        <Typography
          fontSize={12}
          fontWeight={600}
          color="rgba(65,67,27,0.4)"
          sx={{ px: 2.5, mb: 1, letterSpacing: 1, textTransform: "uppercase" }}
        >
          Account
        </Typography>

        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: 3,
            border: "1px solid rgba(65,67,27,0.08)",
            overflow: "hidden",
            mb: 3,
          }}
        >
          {/* Nom */}
          <Box sx={{ ...rowStyle, ...dividerStyle }}>
            <Person sx={{ fontSize: 20, color: "rgba(65,67,27,0.4)" }} />
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={14} color="#41431B">
                Name
              </Typography>
            </Box>
            <Typography fontSize={14} color="rgba(65,67,27,0.5)">
              {name}
            </Typography>
          </Box>

          {/* Email */}
          <Box sx={{ ...rowStyle, ...dividerStyle, cursor: "default", "&:hover": {} }}>
            <Email sx={{ fontSize: 20, color: "rgba(65,67,27,0.4)" }} />
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={14} color="#41431B">
                Email
              </Typography>
            </Box>
            <Typography fontSize={14} color="rgba(65,67,27,0.5)">
              {user?.email}
            </Typography>
          </Box>

          {/* Rôle */}
          <Box sx={{ ...rowStyle, cursor: "default", "&:hover": {} }}>
            <Badge sx={{ fontSize: 20, color: "rgba(65,67,27,0.4)" }} />
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={14} color="#41431B">
                Role
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: "rgba(174,183,132,0.2)",
                color: "#41431B",
                px: 1.5,
                py: 0.3,
                borderRadius: 2,
                fontSize: 12,
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {user?.role}
            </Box>
          </Box>
        </Box>

        {/* ── Section: Security ── */}
        <Typography
          fontSize={12}
          fontWeight={600}
          color="rgba(65,67,27,0.4)"
          sx={{ px: 2.5, mb: 1, letterSpacing: 1, textTransform: "uppercase" }}
        >
          Security
        </Typography>

        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: 3,
            border: "1px solid rgba(65,67,27,0.08)",
            overflow: "hidden",
            mb: 3,
          }}
        >
          {/* Change password */}
          <Box
            sx={{ ...rowStyle }}
            onClick={() => setPasswordMode(!passwordMode)}
          >
            <Lock sx={{ fontSize: 20, color: "rgba(65,67,27,0.4)" }} />
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={14} color="#41431B">
                Change password
              </Typography>
            </Box>
            <ChevronRight
              sx={{
                fontSize: 20,
                color: "rgba(65,67,27,0.3)",
                transition: "transform 0.2s ease",
                transform: passwordMode ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          </Box>

          {/* Password fields */}
          {passwordMode && (
            <Box sx={{ px: 2.5, pb: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Current password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&.Mui-focused fieldset": { borderColor: "#AEB784" },
                  },
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <IconButton size="small" onClick={() => setShowCurrentPassword((v) => !v)}>
                        {showCurrentPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    ),
                  },
                }}
              />

              <TextField
                label="New password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&.Mui-focused fieldset": { borderColor: "#AEB784" },
                  },
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <IconButton size="small" onClick={() => setShowNewPassword((v) => !v)}>
                        {showNewPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    ),
                  },
                }}
              />

              <TextField
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&.Mui-focused fieldset": { borderColor: "#AEB784" },
                  },
                }}
              />

              {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                variant="contained"
                disableElevation
                onClick={handleChangePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                sx={{
                  bgcolor: "#41431B",
                  color: "#E3DBBB",
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: 600,
                  alignSelf: "flex-start",
                  "&:hover": { bgcolor: "#555725" },
                }}
              >
                {loading ? "Changing..." : "Update password"}
              </Button>
            </Box>
          )}
        </Box>

        {/* ── Logout ── */}
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: 3,
            border: "1px solid rgba(65,67,27,0.08)",
            overflow: "hidden",
            mb: 3,
          }}
        >
          <Box
            sx={{
              ...rowStyle,
              "&:hover": { bgcolor: "rgba(198,40,40,0.05)" },
            }}
            onClick={handleLogout}
          >
            <Logout sx={{ fontSize: 20, color: "#c62828" }} />
            <Typography fontSize={14} fontWeight={500} color="#c62828">
              Logout
            </Typography>
          </Box>
        </Box>

        {/* ── Dialog Edit Profile ── */}
        {editMode && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1300,
            }}
            onClick={() => setEditMode(false)}
          >
            <Box
              sx={{
                bgcolor: "#fff",
                borderRadius: 4,
                p: 4,
                width: 380,
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography fontSize={18} fontWeight={700} color="#41431B">
                Edit profile
              </Typography>

              <TextField
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&.Mui-focused fieldset": { borderColor: "#AEB784" },
                  },
                }}
              />

              <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                <Button
                  onClick={() => setEditMode(false)}
                  sx={{
                    textTransform: "none",
                    color: "rgba(65,67,27,0.5)",
                    borderRadius: 2,
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => saveProfile(name, avatar)}
                  disabled={loading}
                  sx={{
                    bgcolor: "#41431B",
                    color: "#E3DBBB",
                    textTransform: "none",
                    borderRadius: 2,
                    fontWeight: 600,
                    "&:hover": { bgcolor: "#555725" },
                  }}
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
              </Box>
            </Box>
          </Box>
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
    </Box>
  );
};

export default Profile;