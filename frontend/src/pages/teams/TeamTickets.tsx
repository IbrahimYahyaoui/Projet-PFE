// frontend/src/pages/teams/TeamTickets.tsx
import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { C } from "../../theme";
import { api } from "../../api";
import { TicketTable, type TicketRow } from "../../components/TicketTable";

export default function TeamTickets() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<TicketRow[]>("/api/team/my/tickets")
      .then(data => setTickets(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const inProgress = tickets.filter(t => t.status === "in_progress").length;
  const pending    = tickets.filter(t => ["pending", "assigned"].includes(t.status)).length;
  const resolved   = tickets.filter(t => t.status === "resolved").length;

  return (
    <Box sx={{ p: 3, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color={C.navy} fontFamily="Inter, sans-serif" sx={{ letterSpacing: "-0.3px" }}>
          Tickets de l'équipe
        </Typography>
        <Typography variant="body2" color={C.textMuted} mt={0.3} fontFamily="Inter, sans-serif">
          Tous les tickets assignés à votre équipe — {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
        {[
          { label: "Total équipe", value: tickets.length, color: C.navy },
          { label: "En attente", value: pending, color: C.info },
          { label: "En cours", value: inProgress, color: C.accent },
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
        columns={["title", "status", "priority", "category", "assignedTo", "sla", "date"]}
        emptyIcon="ticket"
        emptyTitle="Aucun ticket"
        emptyDescription="Aucun ticket n'est assigné à votre équipe pour le moment."
      />
    </Box>
  );
}
