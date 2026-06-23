// frontend/src/pages/MyTickets.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { Add } from "@mui/icons-material";
import { C } from "../theme";
import { TicketTable, type TicketRow } from "../components/TicketTable";

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function MyTickets() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchFromNav = (location.state as any)?.search ?? "";
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${apiUrl}/api/tickets/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setTickets(Array.isArray(data) ? data : (data.tickets ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const open     = tickets.filter(t => t.status === "open").length;
  const pending  = tickets.filter(t => ["assigned", "in_progress"].includes(t.status)).length;
  const resolved = tickets.filter(t => t.status === "resolved").length;

  return (
    <Box sx={{ p: 3, bgcolor: C.bgPage, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color={C.navy} fontFamily="Inter, sans-serif" sx={{ letterSpacing: "-0.3px" }}>
            Mes tickets
          </Typography>
          <Typography variant="body2" color={C.textMuted} mt={0.3} fontFamily="Inter, sans-serif">
            Suivez vos demandes soumises — {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          disableElevation
          onClick={() => navigate("/tickets/create")}
          sx={{ bgcolor: C.accent, color: "#fff", textTransform: "none", borderRadius: "8px", fontWeight: 700, fontSize: 13, fontFamily: "Inter, sans-serif", "&:hover": { bgcolor: C.accentHover } }}
        >
          Nouveau ticket
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
        {[
          { label: "Ouverts", value: open, color: C.info },
          { label: "En traitement", value: pending, color: C.warning },
          { label: "Résolus", value: resolved, color: C.success },
        ].map(s => (
          <Box key={s.label} sx={{ bgcolor: C.card, borderRadius: "12px", border: `1px solid ${C.border}`, p: 2.5, transition: "all 0.2s", "&:hover": { transform: "translateY(-2px)", boxShadow: C.shadowMd, borderColor: C.accent } }}>
            <Typography fontSize={11} fontWeight={600} color={C.textMuted} fontFamily="Inter, sans-serif" sx={{ textTransform: "uppercase", letterSpacing: "0.5px", mb: 1 }}>
              {s.label}
            </Typography>
            <Typography fontSize={28} fontWeight={700} color={s.color} fontFamily="Inter, sans-serif" sx={{ letterSpacing: "-0.5px" }}>
              {s.value}
            </Typography>
          </Box>
        ))}
      </Box>

      <TicketTable
        tickets={tickets}
        loading={loading}
        columns={["title", "status", "priority", "category", "sla", "date"]}
        emptyIcon="ticket"
        emptyTitle="Aucun ticket"
        emptyDescription="Vous n'avez pas encore soumis de ticket."
        initialSearch={searchFromNav}
      />
    </Box>
  );
}
