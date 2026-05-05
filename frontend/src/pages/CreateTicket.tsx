import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { ArrowBack, Send } from "@mui/icons-material";
import { C } from "../theme";

const apiUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const CreateTicket = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "software",
    priority: "medium",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/tickets/${data._id}`);
      } else {
        setError(data.message || "Failed to create ticket");
      }
    } catch (err) {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: C.card,
      borderRadius: "8px",
      fontSize: 14,
      color: C.navy,
      fontFamily: "Inter, sans-serif",
      "& fieldset": { borderColor: C.border },
      "&:hover fieldset": { borderColor: C.accent },
      "&.Mui-focused fieldset": { borderColor: C.accent, borderWidth: 1.5 },
    },
    "& .MuiInputLabel-root": {
      fontSize: 13,
      fontFamily: "Inter, sans-serif",
      color: C.textMuted,
    },
    "& .MuiInputLabel-root.Mui-focused": { color: C.accent },
    "& .MuiOutlinedInput-input::placeholder": {
      color: C.textMuted,
      opacity: 1,
    },
  };

  return (
    <Box sx={{
      flex: 1,
      p: 3,
      bgcolor: C.bgPage,
      fontFamily: "Inter, sans-serif",
    }}>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{
            color: C.slate,
            textTransform: "none",
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            borderRadius: "8px",
            "&:hover": { color: C.accent, bgcolor: C.accentLight },
          }}
        >
          Back
        </Button>
        <Box>
          <Typography
            variant="h5"
            fontWeight={700}
            color={C.navy}
            fontFamily="Inter, sans-serif"
            sx={{ letterSpacing: "-0.3px" }}
          >
            Create new ticket
          </Typography>
          <Typography
            variant="body2"
            color={C.textMuted}
            fontFamily="Inter, sans-serif"
          >
            Describe your issue in detail
          </Typography>
        </Box>
      </Box>

      {/* ── Form ── */}
      <Box sx={{ maxWidth: 720 }}>

        {/* Error */}
        {error && (
          <Box sx={{
            bgcolor: C.dangerBg,
            border: `1px solid ${C.danger}30`,
            borderRadius: "8px",
            p: 2,
            mb: 2,
          }}>
            <Typography fontSize={13} color={C.danger} fontFamily="Inter, sans-serif">
              {error}
            </Typography>
          </Box>
        )}

        {/* Title */}
        <Box sx={{
          bgcolor: C.card,
          borderRadius: "10px",
          border: `1px solid ${C.border}`,
          p: 3,
          mb: 2,
        }}>
          <Typography
            fontSize={13}
            fontWeight={600}
            color={C.textMuted}
            fontFamily="Inter, sans-serif"
            sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: 1.5 }}
          >
            Title *
          </Typography>
          <TextField
            fullWidth
            name="title"
            placeholder="Short and descriptive title"
            value={formData.title}
            onChange={handleChange}
            sx={inputSx}
          />
        </Box>

        {/* Description */}
        <Box sx={{
          bgcolor: C.card,
          borderRadius: "10px",
          border: `1px solid ${C.border}`,
          p: 3,
          mb: 2,
        }}>
          <Typography
            fontSize={13}
            fontWeight={600}
            color={C.textMuted}
            fontFamily="Inter, sans-serif"
            sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: 1.5 }}
          >
            Description *
          </Typography>
          <TextField
            fullWidth
            name="description"
            placeholder="Describe the issue in detail. Include steps to reproduce, error messages, etc."
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={6}
            sx={inputSx}
          />
        </Box>

        {/* Category + Priority */}
        <Box sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 2,
          mb: 2,
        }}>
          {/* Category */}
          <Box sx={{
            bgcolor: C.card,
            borderRadius: "10px",
            border: `1px solid ${C.border}`,
            p: 3,
          }}>
            <Typography
              fontSize={13}
              fontWeight={600}
              color={C.textMuted}
              fontFamily="Inter, sans-serif"
              sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: 1.5 }}
            >
              Category *
            </Typography>
            <TextField
              select
              fullWidth
              name="category"
              value={formData.category}
              onChange={handleChange}
              sx={inputSx}
            >
              <MenuItem value="hardware">Hardware</MenuItem>
              <MenuItem value="software">Software</MenuItem>
              <MenuItem value="network">Network</MenuItem>
              <MenuItem value="access">Access</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Box>

          {/* Priority */}
          <Box sx={{
            bgcolor: C.card,
            borderRadius: "10px",
            border: `1px solid ${C.border}`,
            p: 3,
          }}>
            <Typography
              fontSize={13}
              fontWeight={600}
              color={C.textMuted}
              fontFamily="Inter, sans-serif"
              sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: 1.5 }}
            >
              Priority *
            </Typography>
            <TextField
              select
              fullWidth
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              sx={inputSx}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </TextField>
          </Box>
        </Box>

        {/* Submit */}
        <Box sx={{
          bgcolor: C.card,
          borderRadius: "10px",
          border: `1px solid ${C.border}`,
          p: 3,
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
        }}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            disableElevation
            sx={{
              borderColor: C.border,
              color: C.slate,
              textTransform: "none",
              borderRadius: "8px",
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
              "&:hover": { borderColor: C.accent, color: C.accent },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Send />}
            onClick={handleSubmit}
            disabled={loading}
            disableElevation
            sx={{
              bgcolor: C.accent,
              color: C.navy,
              textTransform: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
              px: 3,
              boxShadow: `0 4px 12px rgba(95,194,186,0.3)`,
              "&:hover": {
                bgcolor: C.accentHover,
                transform: "translateY(-1px)",
                boxShadow: `0 8px 20px rgba(95,194,186,0.4)`,
              },
              "&:disabled": { opacity: 0.6 },
            }}
          >
            {loading ? "Creating..." : "Create ticket"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateTicket;