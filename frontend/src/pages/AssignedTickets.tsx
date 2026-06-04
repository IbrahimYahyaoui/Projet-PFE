// frontend/src/pages/AssignedTickets.tsx
import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { C } from "../theme";
import { TicketTable, type TicketRow } from "../components/TicketTable";

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function AssignedTickets() {
  const storedUser  = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${apiUrl}/api/tickets/assigned`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setTickets(Array.isArray(data) ? data : (data.tickets ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (ticket: TicketRow, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/tickets/${ticket._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, status: newStatus } : t));
    } catch (err) { console.error("Erreur changement statut:", err); }
  };

  const pending    = tickets.filter(t => ["pending", "assigned"].includes(t.status)).length;
  const inProgress = tickets.filter(t => t.status === "in_progress").length;
  const resolved   = tickets.filter(t => t.status === "resolved").length;

  return (
    <Box sx={{ p: 3, bgcolor: C.bgPage, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color={C.navy} fontFamily="Inter, sans-serif" sx={{ letterSpacing: "-0.3px" }}>
          Tickets assignés
        </Typography>
        <Typography variant="body2" color={C.textMuted} mt={0.3} fontFamily="Inter, sans-serif">
          Tickets assignés à vous ou à votre équipe — {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
        {[
          { label: "Total assignés", value: tickets.length, color: C.navy },
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
        columns={["title", "status", "priority", "category", "createdBy", "sla", "date"]}
        emptyIcon="clipboard-list"
        emptyTitle="Aucun ticket assigné"
        emptyDescription="Aucun ticket ne vous est assigné pour le moment."
        onStatusChange={handleStatusChange}
        currentUserId={currentUser?.id ?? currentUser?._id}
        currentUserRole={currentUser?.role}
      />
    </Box>
  );
}
