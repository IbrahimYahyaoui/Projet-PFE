// frontend/src/components/TicketTable.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, TablePagination,
  TextField, MenuItem, Select, InputAdornment, CircularProgress, IconButton, Tooltip, Paper,
} from "@mui/material";
import { C } from "../theme";
import { StatusChip }  from "./chips/StatusChip";
import { PriorityChip } from "./chips/PriorityChip";
import { SLABadge }    from "./SLABadge";
import { EmptyState }  from "./EmptyState";

// ── Types ───────────────────────────────────────────────────────────────────
export interface TicketRow {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  slaDeadline?: string | null;
  slaBreached?: boolean;
  escalationLevel?: number;
  createdBy?: { _id: string; name: string } | null;
  assignedTo?: { _id: string; name: string } | null;
  teamId?: { _id: string; name: string; tag: string; color: string } | null;
}

export type ColumnKey = "title" | "status" | "priority" | "category" | "team" | "assignedTo" | "createdBy" | "sla" | "date" | "actions";

export interface RowAction {
  icon: string;
  label: string;
  onClick: (ticket: TicketRow) => void;
  show?: (ticket: TicketRow) => boolean;
  color?: string;
  hoverBg?: string;
}

interface Props {
  tickets: TicketRow[];
  loading: boolean;
  columns: ColumnKey[];
  actions?: RowAction[];
  showFilters?: boolean;
  showPagination?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const CAT_LABELS: Record<string, string> = {
  hardware: "Hardware", software: "Logiciel", network: "Réseau",
  access: "Accès", other: "Autre", general: "Général",
};

const STATUSES = ["open", "pending", "assigned", "in_progress", "waiting", "resolved", "closed"];
const PRIORITIES = ["low", "medium", "high", "critical"];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const COLUMN_HEADERS: Record<ColumnKey, string> = {
  title:      "Ticket",
  status:     "Statut",
  priority:   "Priorité",
  category:   "Catégorie",
  team:       "Équipe",
  assignedTo: "Assigné à",
  createdBy:  "Créateur",
  sla:        "SLA",
  date:       "Date",
  actions:    "",
};

type SortKey = "title" | "status" | "priority" | "date";
type SortOrder = "asc" | "desc";

function sortTickets(tickets: TicketRow[], by: SortKey, order: SortOrder): TicketRow[] {
  const priority_order = { critical: 0, high: 1, medium: 2, low: 3 };
  const status_order   = { open: 0, pending: 1, assigned: 2, in_progress: 3, waiting: 4, resolved: 5, closed: 6 };
  return [...tickets].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    if (by === "title")    { av = a.title.toLowerCase();             bv = b.title.toLowerCase(); }
    if (by === "status")   { av = status_order[a.status as keyof typeof status_order] ?? 99;   bv = status_order[b.status as keyof typeof status_order] ?? 99; }
    if (by === "priority") { av = priority_order[a.priority as keyof typeof priority_order] ?? 99; bv = priority_order[b.priority as keyof typeof priority_order] ?? 99; }
    if (by === "date")     { av = new Date(a.createdAt).getTime();   bv = new Date(b.createdAt).getTime(); }
    if (av < bv) return order === "asc" ? -1 :  1;
    if (av > bv) return order === "asc" ?  1 : -1;
    return 0;
  });
}

// ── Component ────────────────────────────────────────────────────────────────
export function TicketTable({
  tickets, loading, columns, actions = [],
  showFilters = true, showPagination = true,
  emptyIcon = "ticket", emptyTitle = "Aucun ticket", emptyDescription = "Aucun ticket ne correspond aux filtres.",
}: Props) {
  const navigate = useNavigate();

  const [search,       setSearch]       = useState("");
  const [statusF,      setStatusF]      = useState("all");
  const [priorityF,    setPriorityF]    = useState("all");
  const [categoryF,    setCategoryF]    = useState("all");
  const [sortBy,       setSortBy]       = useState<SortKey>("date");
  const [sortOrder,    setSortOrder]    = useState<SortOrder>("desc");
  const [page,         setPage]         = useState(0);
  const [rowsPerPage,  setRowsPerPage]  = useState(25);

  const handleSort = (col: SortKey) => {
    if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sortTickets(
      tickets.filter(t =>
        (!q || t.title.toLowerCase().includes(q) ||
         t.createdBy?.name.toLowerCase().includes(q) ||
         t.assignedTo?.name.toLowerCase().includes(q)) &&
        (statusF   === "all" || t.status   === statusF)   &&
        (priorityF === "all" || t.priority === priorityF) &&
        (categoryF === "all" || t.category === categoryF)
      ),
      sortBy, sortOrder
    );
  }, [tickets, search, statusF, priorityF, categoryF, sortBy, sortOrder]);

  const paginated = showPagination
    ? filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : filtered;

  const showCategory = columns.includes("category");
  const showTeam     = columns.includes("team");

  const SortableCell = ({ col, label }: { col: SortKey; label: string }) => (
    <TableCell sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.72rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}`, py: 1.5, whiteSpace: "nowrap", backgroundColor: C.bgPage }}>
      <TableSortLabel active={sortBy === col} direction={sortBy === col ? sortOrder : "asc"} onClick={() => handleSort(col)}
        sx={{ "& .MuiTableSortLabel-icon": { color: `${C.accent} !important` }, "&.Mui-active": { color: C.accent }, color: C.textMuted }}>
        {label}
      </TableSortLabel>
    </TableCell>
  );

  const PlainCell = ({ label }: { label: string }) => (
    <TableCell sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.72rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}`, py: 1.5, whiteSpace: "nowrap", backgroundColor: C.bgPage }}>
      {label}
    </TableCell>
  );

  return (
    <Box>
      {/* ── Filters ── */}
      {showFilters && (
        <Paper sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", p: 1.5, mb: 2.5, display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Rechercher…" size="small" value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            sx={{ flex: 1, minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontFamily: "Inter, sans-serif", fontSize: "13px", "& fieldset": { borderColor: C.border }, "&:hover fieldset": { borderColor: C.accent }, "&.Mui-focused fieldset": { borderColor: C.accent } } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Box component="i" className="ti ti-search" sx={{ color: C.textMuted, fontSize: 16 }} /></InputAdornment> }}
          />
          <Select size="small" value={statusF} onChange={e => { setStatusF(e.target.value); setPage(0); }}
            sx={{ borderRadius: "10px", minWidth: 150, fontFamily: "Inter, sans-serif", fontSize: "13px", "& fieldset": { borderColor: C.border } }}>
            <MenuItem value="all" sx={{ fontFamily: "Inter, sans-serif" }}>Tous statuts</MenuItem>
            {STATUSES.map(s => <MenuItem key={s} value={s} sx={{ fontFamily: "Inter, sans-serif" }}>{s}</MenuItem>)}
          </Select>
          <Select size="small" value={priorityF} onChange={e => { setPriorityF(e.target.value); setPage(0); }}
            sx={{ borderRadius: "10px", minWidth: 150, fontFamily: "Inter, sans-serif", fontSize: "13px", "& fieldset": { borderColor: C.border } }}>
            <MenuItem value="all" sx={{ fontFamily: "Inter, sans-serif" }}>Toutes priorités</MenuItem>
            {PRIORITIES.map(p => <MenuItem key={p} value={p} sx={{ fontFamily: "Inter, sans-serif" }}>{p}</MenuItem>)}
          </Select>
          {showCategory && (
            <Select size="small" value={categoryF} onChange={e => { setCategoryF(e.target.value); setPage(0); }}
              sx={{ borderRadius: "10px", minWidth: 150, fontFamily: "Inter, sans-serif", fontSize: "13px", "& fieldset": { borderColor: C.border } }}>
              <MenuItem value="all" sx={{ fontFamily: "Inter, sans-serif" }}>Toutes catégories</MenuItem>
              {Object.entries(CAT_LABELS).map(([k, v]) => <MenuItem key={k} value={k} sx={{ fontFamily: "Inter, sans-serif" }}>{v}</MenuItem>)}
            </Select>
          )}
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, ml: "auto" }}>
            {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
          </Typography>
        </Paper>
      )}

      {/* ── Table ── */}
      <Paper sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
            <CircularProgress sx={{ color: C.accent }} />
          </Box>
        ) : filtered.length === 0 ? (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: C.bgPage }}>
                    {columns.map(col => {
                      if (col === "title")      return <SortableCell key={col} col="title"    label={COLUMN_HEADERS.title} />;
                      if (col === "status")     return <SortableCell key={col} col="status"   label={COLUMN_HEADERS.status} />;
                      if (col === "priority")   return <SortableCell key={col} col="priority" label={COLUMN_HEADERS.priority} />;
                      if (col === "date")       return <SortableCell key={col} col="date"     label={COLUMN_HEADERS.date} />;
                      return <PlainCell key={col} label={COLUMN_HEADERS[col]} />;
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((t, idx) => (
                    <TableRow
                      key={t._id}
                      sx={{ backgroundColor: idx % 2 === 0 ? C.card : C.bgPage, cursor: "pointer", "&:hover": { backgroundColor: C.accentLight }, transition: "background 0.13s" }}
                      onClick={() => navigate(`/tickets/${t._id}`)}
                    >
                      {columns.map(col => {
                        if (col === "title") return (
                          <TableCell key={col} sx={{ borderBottom: `1px solid ${C.border}`, py: 1.5, maxWidth: 320 }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "13px", color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.title}
                            </Typography>
                            {t.escalationLevel !== undefined && t.escalationLevel > 0 && (
                              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, mt: 0.3, px: 0.8, py: 0.2, borderRadius: "6px", bgcolor: C.dangerBg }}>
                                <Box component="i" className="ti ti-alert-triangle" sx={{ fontSize: 10, color: C.danger }} />
                                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: C.danger }}>Escalade {t.escalationLevel}</Typography>
                              </Box>
                            )}
                          </TableCell>
                        );
                        if (col === "status") return (
                          <TableCell key={col} sx={{ borderBottom: `1px solid ${C.border}`, py: 1.5 }}>
                            <StatusChip status={t.status} size="sm" />
                          </TableCell>
                        );
                        if (col === "priority") return (
                          <TableCell key={col} sx={{ borderBottom: `1px solid ${C.border}`, py: 1.5 }}>
                            <PriorityChip priority={t.priority} size="sm" />
                          </TableCell>
                        );
                        if (col === "category") return (
                          <TableCell key={col} sx={{ borderBottom: `1px solid ${C.border}`, py: 1.5 }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary }}>
                              {CAT_LABELS[t.category] ?? t.category}
                            </Typography>
                          </TableCell>
                        );
                        if (col === "team") return (
                          <TableCell key={col} sx={{ borderBottom: `1px solid ${C.border}`, py: 1.5 }}>
                            {t.teamId ? (
                              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1, py: 0.3, borderRadius: "6px", bgcolor: `${t.teamId.color}18`, border: `1px solid ${t.teamId.color}40` }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: t.teamId.color, flexShrink: 0 }} />
                                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: t.teamId.color }}>{t.teamId.tag}</Typography>
                              </Box>
                            ) : (
                              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted }}>—</Typography>
                            )}
                          </TableCell>
                        );
                        if (col === "assignedTo") return (
                          <TableCell key={col} sx={{ borderBottom: `1px solid ${C.border}`, py: 1.5 }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: t.assignedTo ? C.textSecondary : C.textMuted, fontStyle: t.assignedTo ? "normal" : "italic" }}>
                              {t.assignedTo?.name ?? "Non assigné"}
                            </Typography>
                          </TableCell>
                        );
                        if (col === "createdBy") return (
                          <TableCell key={col} sx={{ borderBottom: `1px solid ${C.border}`, py: 1.5 }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary }}>
                              {t.createdBy?.name ?? "—"}
                            </Typography>
                          </TableCell>
                        );
                        if (col === "sla") return (
                          <TableCell key={col} sx={{ borderBottom: `1px solid ${C.border}`, py: 1.5 }}>
                            <SLABadge slaDeadline={t.slaDeadline ?? null} slaBreached={t.slaBreached ?? false} status={t.status} />
                          </TableCell>
                        );
                        if (col === "date") return (
                          <TableCell key={col} sx={{ borderBottom: `1px solid ${C.border}`, py: 1.5 }}>
                            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, whiteSpace: "nowrap" }}>
                              {fmtDate(t.createdAt)}
                            </Typography>
                          </TableCell>
                        );
                        if (col === "actions") return (
                          <TableCell key={col} sx={{ borderBottom: `1px solid ${C.border}`, py: 1.5 }} onClick={e => e.stopPropagation()}>
                            <Box sx={{ display: "flex", gap: 0.25 }}>
                              {actions
                                .filter(a => !a.show || a.show(t))
                                .map(a => (
                                  <Tooltip key={a.label} title={a.label}>
                                    <IconButton
                                      size="small"
                                      onClick={() => a.onClick(t)}
                                      sx={{ color: C.textMuted, "&:hover": { color: a.color ?? C.accent, backgroundColor: a.hoverBg ?? C.accentLight } }}
                                    >
                                      <Box component="i" className={`ti ti-${a.icon}`} sx={{ fontSize: 15 }} />
                                    </IconButton>
                                  </Tooltip>
                                ))}
                            </Box>
                          </TableCell>
                        );
                        return null;
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {showPagination && (
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                labelRowsPerPage="Par page :"
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
                sx={{ borderTop: `1px solid ${C.border}`, fontFamily: "Inter, sans-serif", "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: C.textSecondary } }}
              />
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}
