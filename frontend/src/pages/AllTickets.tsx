// frontend/src/pages/AllTickets.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { Download } from "@mui/icons-material";
import { C } from "../theme";
import { TicketTable, type TicketRow } from "../components/TicketTable";

const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function AllTickets() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchFromNav = (location.state as any)?.search ?? "";
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === "admin";

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/tickets/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setTickets(data.tickets ?? data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleDelete = async (ticket: TicketRow) => {
    if (!window.confirm(`Supprimer "${ticket.title}" ?`)) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiUrl}/api/tickets/${ticket._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setTickets(prev => prev.filter(t => t._id !== ticket._id));
  };

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

  const handleExportCSV = () => {
    const headers = ["ID", "Titre", "Statut", "Priorité", "Catégorie", "Créé par", "Assigné à", "Équipe", "Date de création", "SLA deadline"];
    const rows = tickets.map(t => [
      t._id, t.title, t.status, t.priority, t.category,
      t.createdBy?.name ?? "", t.assignedTo?.name ?? "Non assigné",
      t.teamId?.name ?? "Non assignée",
      new Date(t.createdAt).toLocaleDateString("fr-FR"),
      t.slaDeadline ? new Date(t.slaDeadline).toLocaleString("fr-FR") : "—",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = `tickets_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <Box sx={{ p: 3, bgcolor: C.bgPage, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color={C.navy} fontFamily="Inter, sans-serif" sx={{ letterSpacing: "-0.3px" }}>
            Tous les tickets
          </Typography>
          <Typography variant="body2" color={C.textMuted} mt={0.3} fontFamily="Inter, sans-serif">
            Gestion globale des tickets de l'entreprise
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          {isAdmin && (
            <Button
              variant="outlined"
              onClick={() => navigate("/tickets/admin-queue")}
              sx={{ borderColor: C.accent, color: C.accent, textTransform: "none", borderRadius: "8px", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 0.8, "&:hover": { bgcolor: C.accentLight } }}
            >
              <Box component="i" className="ti ti-inbox" sx={{ fontSize: 16 }} />
              File d'attente
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportCSV}
            sx={{ borderColor: C.border, color: C.slate, textTransform: "none", borderRadius: "8px", fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif", "&:hover": { borderColor: C.accent, color: C.accent, bgcolor: C.accentLight } }}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      <TicketTable
        tickets={tickets}
        loading={loading}
        columns={["title", "status", "priority", "category", "createdBy", "assignedTo", "sla", "date", "actions"]}
        actions={isAdmin ? [{
          icon: "trash",
          label: "Supprimer",
          onClick: handleDelete,
          color: C.danger,
          hoverBg: C.dangerBg,
        }] : []}
        emptyIcon="ticket"
        emptyTitle="Aucun ticket"
        emptyDescription="Aucun ticket trouvé dans le système."
        onStatusChange={handleStatusChange}
        currentUserId={user?.id ?? user?._id}
        currentUserRole={user?.role}
        initialSearch={searchFromNav}
      />
    </Box>
  );
}
