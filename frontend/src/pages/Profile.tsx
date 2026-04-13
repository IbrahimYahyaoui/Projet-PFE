import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Avatar,
  Alert,
  Snackbar,
  IconButton,
  Divider,
} from "@mui/material";
import {
  CameraAlt,
  Save,
  Lock,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const Profile = () => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
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

  // ── Convertir image en base64 ──
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500000) {
      setError("Image must be less than 500KB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ── Sauvegarder le profil ──
  const handleSaveProfile = async () => {
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
        body: JSON.stringify({ name, avatar }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update profile");
        setLoading(false);
        return;
      }

      // Mettre à jour le localStorage
      const updatedUser = { ...user, name: data.user.name, avatar: data.user.avatar };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError("Cannot connect to server");
    }
    setLoading(false);
  };

  // ── Changer le mot de passe ──
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
      setSuccess("Password changed successfully!");
    } catch (err) {
      setError("Cannot connect to server");
    }
    setLoading(false);
  };

  return (
    <Box sx={{ flex: 1, p: 4, maxWidth: 700 }}>
      {/* En-tête */}
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Manage your personal information
      </Typography>

      {/* Section Photo + Nom */}
      <Box
        sx={{
          bgcolor: "#fff",
          borderRadius: 3,
          border: "1px solid #e0e0e0",
          p: 4,
          mb: 3,
        }}
      >
        <Typography fontSize={15} fontWeight={600} mb={3}>
          Personal information
        </Typography>

        {/* Avatar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={avatar}
              sx={{
                width: 80,
                height: 80,
                bgcolor: "#1565c0",
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {!avatar && getInitials(name)}
            </Avatar>
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              sx={{
                position: "absolute",
                bottom: -4,
                right: -4,
                bgcolor: "#111",
                color: "#fff",
                width: 28,
                height: 28,
                "&:hover": { bgcolor: "#333" },
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
          <Box>
            <Typography fontSize={14} fontWeight={600}>
              Profile photo
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              JPG or PNG. Max 500KB.
            </Typography>
          </Box>
        </Box>

        {/* Nom */}
        <TextField
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          size="small"
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
        />

        {/* Email (non modifiable) */}
        <TextField
          label="Email"
          value={user?.email || ""}
          fullWidth
          size="small"
          disabled
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
        />

        {/* Rôle (non modifiable) */}
        <TextField
          label="Role"
          value={user?.role || ""}
          fullWidth
          size="small"
          disabled
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
            "& input": { textTransform: "capitalize" },
          }}
        />

        <Button
          variant="contained"
          disableElevation
          startIcon={<Save />}
          onClick={handleSaveProfile}
          disabled={loading}
          sx={{
            bgcolor: "#111",
            textTransform: "none",
            borderRadius: 2,
            fontWeight: 600,
            "&:hover": { bgcolor: "#333" },
          }}
        >
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </Box>

      {/* Section Mot de passe */}
      <Box
        sx={{
          bgcolor: "#fff",
          borderRadius: 3,
          border: "1px solid #e0e0e0",
          p: 4,
        }}
      >
        <Typography fontSize={15} fontWeight={600} mb={1}>
          Change password
        </Typography>
        <Typography fontSize={13} color="text.secondary" mb={3}>
          Make sure your new password is at least 6 characters
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Current password"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                  >
                    {showCurrentPassword ? (
                      <VisibilityOff sx={{ fontSize: 18 }} />
                    ) : (
                      <Visibility sx={{ fontSize: 18 }} />
                    )}
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
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={() => setShowNewPassword((v) => !v)}
                  >
                    {showNewPassword ? (
                      <VisibilityOff sx={{ fontSize: 18 }} />
                    ) : (
                      <Visibility sx={{ fontSize: 18 }} />
                    )}
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
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <Button
            variant="contained"
            disableElevation
            startIcon={<Lock />}
            onClick={handleChangePassword}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            sx={{
              bgcolor: "#111",
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              alignSelf: "flex-start",
              "&:hover": { bgcolor: "#333" },
            }}
          >
            {loading ? "Changing..." : "Change password"}
          </Button>
        </Box>
      </Box>

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

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

export default Profile;