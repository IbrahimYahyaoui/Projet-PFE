import { useState } from "react";
import {
  Box, Typography, Button, TextField, MenuItem, Alert, Snackbar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { C } from "../theme";

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const fieldStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#1C1410",
    color: C.textPrimary,
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: "rgba(245,158,11,0.3)" },
    "&.Mui-focused fieldset": { borderColor: C.accent },
  },
  "& .MuiInputLabel-root": { color: C.textSecondary },
  "& .MuiInputLabel-root.Mui-focused": { color: C.accent },
  "& .MuiSelect-icon": { color: C.textSecondary },
};

const CreateTicket = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("other");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, priority, category }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "Failed to create ticket"); setLoading(false); return; }
      setSuccess("Ticket created successfully!");
      setTimeout(() => navigate("/my-tickets"), 1500);
    } catch {
      setError("Cannot connect to server");
    }
    setLoading(false);
  };

  return (
    <Box sx={{ flex: 1, display: "flex", justifyContent: "center", py: 5, px: 2, bgcolor: C.bg }}>
      <Box sx={{ width: "100%", maxWidth: 700 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography fontSize={26} fontWeight={700} color={C.textPrimary}>Create new ticket</Typography>
          <Typography fontSize={14} color={C.textSecondary} mt={0.5}>Describe your issue in detail</Typography>
        </Box>

        {/* Form */}
        <Box sx={{ bgcolor: C.card, borderRadius: 3, p: 4, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 3 }}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required size="small" sx={fieldStyle} />

          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth required multiline rows={4} sx={fieldStyle} />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} select fullWidth size="small" sx={fieldStyle}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </TextField>

            <TextField label="Category" value={category} onChange={(e) => setCategory(e.target.value)} select fullWidth size="small" sx={fieldStyle}>
              <MenuItem value="hardware">Hardware</MenuItem>
              <MenuItem value="software">Software</MenuItem>
              <MenuItem value="network">Network</MenuItem>
              <MenuItem value="access">Access</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", mt: 1 }}>
            <Button onClick={() => navigate("/my-tickets")}
              sx={{ textTransform: "none", color: C.textSecondary, borderRadius: 2, fontWeight: 500 }}
            >
              Cancel
            </Button>
            <Button variant="contained" disableElevation onClick={handleSubmit} disabled={loading}
              sx={{
                bgcolor: C.accent, color: "#1C1410", textTransform: "none", borderRadius: 2, fontWeight: 700, px: 3,
                "&:hover": { bgcolor: C.accentHover, transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(245,158,11,0.3)" },
              }}
            >
              {loading ? "Creating..." : "Create ticket"}
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" onClose={() => setSuccess("")} sx={{ borderRadius: 2 }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateTicket;