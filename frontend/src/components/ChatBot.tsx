import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box, Fab, Paper, Typography, TextField,
  IconButton, Collapse, CircularProgress, Chip,
} from "@mui/material";
import { ConfirmationNumber as TicketIcon } from "@mui/icons-material";
import { C, priorityColors } from "../theme";

// ── Types ────────────────────────────────────────────────────────
type Priority = "low" | "medium" | "high" | "critical";
type Category = "hardware" | "software" | "network" | "access" | "other";

interface TicketDraft {
  title?: string;
  description?: string;
  priority?: Priority;
  category?: Category;
}

interface ActionChip {
  label: string;
  value: string;
  textColor?: string;
  bgcolor?: string;
  borderColor?: string;
}

interface Msg {
  role: "user" | "ai";
  text: string;
  chips?: ActionChip[];
  card?: TicketDraft;
  success?: boolean;
}

// ── Constants ────────────────────────────────────────────────────
const API = "http://localhost:3000/api";

const PRIORITY_CHIPS: ActionChip[] = [
  { label: "Low",      value: "low",      textColor: priorityColors.low.text,      bgcolor: priorityColors.low.bg,      borderColor: priorityColors.low.border },
  { label: "Medium",   value: "medium",   textColor: priorityColors.medium.text,   bgcolor: priorityColors.medium.bg,   borderColor: priorityColors.medium.border },
  { label: "High",     value: "high",     textColor: priorityColors.high.text,     bgcolor: priorityColors.high.bg,     borderColor: priorityColors.high.border },
  { label: "Critical", value: "critical", textColor: priorityColors.critical.text, bgcolor: priorityColors.critical.bg, borderColor: priorityColors.critical.border },
];

const CATEGORY_CHIPS: ActionChip[] = [
  { label: "Hardware", value: "hardware" },
  { label: "Software", value: "software" },
  { label: "Network",  value: "network"  },
  { label: "Access",   value: "access"   },
  { label: "Other",    value: "other"    },
];

const CONFIRM_CHIPS: ActionChip[] = [
  { label: "✓ Confirm & Create", value: "confirm", textColor: C.navy,   bgcolor: C.accent,   borderColor: C.accentHover },
  { label: "✕ Cancel",           value: "cancel",  textColor: C.danger, bgcolor: C.dangerBg, borderColor: C.danger },
];

const PRIORITY_LABEL: Record<Priority, string>  = { low: "Low",      medium: "Medium",   high: "High",    critical: "Critical" };
const CATEGORY_LABEL: Record<Category, string>  = { hardware: "Hardware", software: "Software", network: "Network", access: "Access", other: "Other" };

// ── Ticket field order and questions ────────────────────────────
type TicketField = keyof TicketDraft;
const FIELD_ORDER: TicketField[] = ["title", "description", "category", "priority"];

const FIELD_QUESTION: Record<TicketField, string> = {
  title:       "What should the title of this ticket be?",
  description: "Can you describe the issue in more detail?",
  category:    "Which category fits this issue?",
  priority:    "What priority level does this need?",
};

const nextMissing = (d: TicketDraft): TicketField | null =>
  FIELD_ORDER.find((f) => !d[f]) ?? null;

// ── Helpers ──────────────────────────────────────────────────────
const BASE_RULES =
  "You are TicketFlow AI, a helpful assistant in a ticket management system. " +
  "Help users with tickets, projects, and team questions. " +
  "When you can resolve an issue directly, do so. When action is needed, offer to do it. " +
  "Be concise and professional. " +
  "IMPORTANT: The user is already authenticated via the platform — NEVER ask them to verify their identity, state their name, or prove who they are. Their identity is confirmed below.";

// ── Component ────────────────────────────────────────────────────
export const ChatBot = () => {
  const [open,       setOpen]       = useState(false);
  const [mode,       setMode]       = useState<"chat" | "ticket">("chat");
  const [msgs,       setMsgs]       = useState<Msg[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [chatCtx,    setChatCtx]    = useState<string | undefined>(undefined);
  const [draft,      setDraft]      = useState<TicketDraft>({});
  const [awaitField, setAwaitField] = useState<TicketField | null>(null);
  const [companyCtx, setCompanyCtx] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Fetch company context from DB when chat opens ────────────
  useEffect(() => {
    if (!open || companyCtx) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/ai/company-context`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.contextString) setCompanyCtx(d.contextString); })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const addMsg  = (m: Msg)    => setMsgs((p) => [...p, m]);
  const addMsgs = (...ms: Msg[]) => setMsgs((p) => [...p, ...ms]);

  const buildRules = useCallback(() => {
    let rules = BASE_RULES;

    // Inject the authenticated user's identity so the AI never asks who they are
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored) as { name: string; email: string; role: string };
        rules += `\n\n--- Authenticated User ---\nName: ${u.name}\nEmail: ${u.email}\nRole: ${u.role}`;
      }
    } catch { /* ignore */ }

    if (companyCtx) {
      rules += `\n\n--- Company Context ---\n${companyCtx}`;
    }

    return rules;
  }, [companyCtx]);

  // ── Chat mode ────────────────────────────────────────────────
  const sendChat = async (text: string) => {
    addMsg({ role: "user", text });
    setLoading(true);
    try {
      const res  = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, rules: buildRules(), context: chatCtx }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      addMsg({ role: "ai", text: data.reply });
      setChatCtx(data.context);
    } catch (err: any) {
      addMsg({ role: "ai", text: `Error: ${err.message}` });
    } finally { setLoading(false); }
  };

  // ── Ticket mode helpers ──────────────────────────────────────
  const askNext = (d: TicketDraft): Msg => {
    const field = nextMissing(d);
    if (!field) {
      return {
        role: "ai",
        text: "Here's your ticket summary. Ready to create it?",
        card: d,
        chips: CONFIRM_CHIPS,
      };
    }
    setAwaitField(field);
    return {
      role: "ai",
      text: FIELD_QUESTION[field],
      chips: field === "category" ? CATEGORY_CHIPS : field === "priority" ? PRIORITY_CHIPS : undefined,
    };
  };

  const startTicket = () => {
    setMode("ticket");
    setDraft({});
    setAwaitField(null);
    setMsgs([{
      role: "ai",
      text: "Let's create a ticket. Describe your issue — I'll extract what I can from your message.",
    }]);
  };

  // ── Initial message: call AI to extract fields once ──────────
  const extractAndAdvance = async (text: string) => {
    addMsg({ role: "user", text });
    setLoading(true);
    try {
      const res  = await fetch(`${API}/ai/extract-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const extracted = await res.json();
      if (!res.ok) throw new Error(extracted.error || "Extraction failed");

      const newDraft: TicketDraft = { ...extracted };
      setDraft(newDraft);
      addMsg(askNext(newDraft));
    } catch (err: any) {
      addMsg({ role: "ai", text: `Error: ${err.message}` });
    } finally { setLoading(false); }
  };

  // ── Text answer for a field (title or description) ───────────
  const answerTextField = (text: string) => {
    const field = awaitField;
    if (!field) return;
    const newDraft = { ...draft, [field]: text };
    setDraft(newDraft);
    setAwaitField(null);
    addMsg({ role: "user", text });
    addMsg(askNext(newDraft));
  };

  // ── Create ticket via API ────────────────────────────────────
  const createTicket = async () => {
    setLoading(true);
    addMsg({ role: "user", text: "Confirm & Create" });
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Creation failed");
      addMsg({
        role: "ai",
        text: `Ticket created! "${data.title}" is now open and the team has been notified.`,
        success: true,
      });
      setMode("chat");
      setDraft({});
      setAwaitField(null);
    } catch (err: any) {
      addMsg({ role: "ai", text: `Failed to create ticket: ${err.message}` });
    } finally { setLoading(false); }
  };

  // ── Chip click handler ───────────────────────────────────────
  const handleChip = (chip: ActionChip) => {
    if (loading) return;

    if (chip.value === "confirm") { createTicket(); return; }

    if (chip.value === "cancel") {
      addMsgs(
        { role: "user", text: "Cancel" },
        { role: "ai",   text: "Ticket creation cancelled. How else can I help?" },
      );
      setMode("chat");
      setDraft({});
      setAwaitField(null);
      return;
    }

    // Critical → ask for confirmation first
    if (chip.value === "critical") {
      addMsgs(
        { role: "user", text: "Critical" },
        {
          role: "ai",
          text: "⚠️ Critical means immediate response required — the team will be alerted right away. Are you sure?",
          chips: [
            { label: "Yes, Critical",    value: "confirm_critical", textColor: priorityColors.critical.text, bgcolor: priorityColors.critical.bg, borderColor: priorityColors.critical.border },
            { label: "Use High instead", value: "high",             textColor: priorityColors.high.text,     bgcolor: priorityColors.high.bg,     borderColor: priorityColors.high.border },
          ],
        },
      );
      return;
    }

    if (chip.value === "confirm_critical") {
      const newDraft = { ...draft, priority: "critical" as Priority };
      setDraft(newDraft);
      setAwaitField(null);
      addMsg({ role: "user", text: "Yes, Critical" });
      addMsg(askNext(newDraft));
      return;
    }

    // Priority chip (low / medium / high)
    if (["low", "medium", "high"].includes(chip.value)) {
      const newDraft = { ...draft, priority: chip.value as Priority };
      setDraft(newDraft);
      setAwaitField(null);
      addMsg({ role: "user", text: chip.label });
      addMsg(askNext(newDraft));
      return;
    }

    // Category chip
    if (["hardware", "software", "network", "access", "other"].includes(chip.value)) {
      const newDraft = { ...draft, category: chip.value as Category };
      setDraft(newDraft);
      setAwaitField(null);
      addMsg({ role: "user", text: chip.label });
      addMsg(askNext(newDraft));
      return;
    }
  };

  // ── Main send ────────────────────────────────────────────────
  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    if (mode === "chat") { sendChat(text); return; }

    // Ticket mode: first message → extract fields via AI
    // Follow-up text messages → answer the current awaited field
    const isFirstMessage = msgs.length === 1; // only the AI greeting so far
    if (isFirstMessage) {
      extractAndAdvance(text);
    } else {
      answerTextField(text);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const lastIdx = msgs.length - 1;

  // ── Render ───────────────────────────────────────────────────
  return (
    <Box sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 1300 }}>
      <Collapse in={open} unmountOnExit>
        <Paper elevation={0} sx={{
          width: 374, height: 530, mb: 1.5,
          border: `1px solid ${C.border}`, borderRadius: "16px",
          boxShadow: C.shadowLg, display: "flex", flexDirection: "column", overflow: "hidden",
        }}>

          {/* ── Header ── */}
          <Box sx={{ px: 2, py: 1.5, bgcolor: C.navyMid, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                ✦
              </Box>
              <Box>
                <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 14, lineHeight: 1 }}>TicketFlow AI</Typography>
                <Typography sx={{ color: C.accent, fontSize: 11 }}>
                  {mode === "ticket" ? "Creating a ticket…" : "Always here to help"}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {mode === "chat" ? (
                <IconButton size="small" onClick={startTicket} title="New ticket"
                  sx={{ color: C.accent, bgcolor: "rgba(95,194,186,0.15)", borderRadius: "8px", p: 0.75, "&:hover": { bgcolor: "rgba(95,194,186,0.28)" } }}>
                  <TicketIcon sx={{ fontSize: 16 }} />
                </IconButton>
              ) : (
                <IconButton size="small" onClick={() => { setMode("chat"); setDraft({}); setAwaitField(null); }} title="Back to chat"
                  sx={{ color: "rgba(255,255,255,0.5)", fontSize: 14, borderRadius: "8px", p: 0.5, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                  ←
                </IconButton>
              )}
              <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "rgba(255,255,255,0.5)", p: 0.5 }}>✕</IconButton>
            </Box>
          </Box>

          {/* ── Messages ── */}
          <Box sx={{
            flex: 1, overflowY: "auto", px: 2, py: 1.5,
            display: "flex", flexDirection: "column", gap: 1.5, bgcolor: C.bgPage,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: C.border, borderRadius: 2 },
          }}>

            {msgs.length === 0 && (
              <Box sx={{ textAlign: "center", mt: 5 }}>
                <Typography sx={{ fontSize: 28 }}>✦</Typography>
                <Typography sx={{ color: C.textMuted, fontSize: 13, mt: 1 }}>
                  Ask me anything, or start a new ticket.
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <Chip label="📋 Create a ticket" onClick={startTicket}
                    sx={{ cursor: "pointer", bgcolor: C.accentLight, color: C.accent, border: `1px solid ${C.accent}40`, fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, "&:hover": { bgcolor: C.accentMid } }} />
                </Box>
              </Box>
            )}

            {msgs.map((msg, i) => {
              const chipsActive = i === lastIdx && !loading;
              return (
                <Box key={i}>
                  {/* Bubble */}
                  <Box sx={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <Box sx={{
                      maxWidth: "84%", px: 1.5, py: 1,
                      borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      bgcolor: msg.role === "user" ? C.navyMid : msg.success ? C.successBg : C.bg,
                      border: msg.role === "ai" ? `1px solid ${msg.success ? C.success + "50" : C.border}` : "none",
                      boxShadow: C.shadow,
                    }}>
                      <Typography sx={{
                        fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap",
                        color: msg.role === "user" ? "#fff" : msg.success ? C.success : C.textPrimary,
                      }}>
                        {msg.text}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Ticket preview card */}
                  {msg.card && (
                    <Box sx={{ mt: 1, bgcolor: C.bg, border: `1px solid ${C.border}`, borderRadius: "12px", p: 1.5, maxWidth: "84%" }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", mb: 1 }}>
                        Ticket Preview
                      </Typography>
                      {msg.card.title && (
                        <Box sx={{ mb: 0.75 }}>
                          <Typography sx={{ fontSize: 10, color: C.textMuted }}>Title</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{msg.card.title}</Typography>
                        </Box>
                      )}
                      {msg.card.description && (
                        <Box sx={{ mb: 0.75 }}>
                          <Typography sx={{ fontSize: 10, color: C.textMuted }}>Description</Typography>
                          <Typography sx={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.45 }}>{msg.card.description}</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.5 }}>
                        {msg.card.priority && (
                          <Chip size="small" label={PRIORITY_LABEL[msg.card.priority]}
                            sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: priorityColors[msg.card.priority].bg, color: priorityColors[msg.card.priority].text, border: `1px solid ${priorityColors[msg.card.priority].border}` }} />
                        )}
                        {msg.card.category && (
                          <Chip size="small" label={CATEGORY_LABEL[msg.card.category]}
                            sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: C.accentLight, color: C.accent, border: `1px solid ${C.accent}40` }} />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Chips row — horizontally scrollable */}
                  {msg.chips && msg.chips.length > 0 && (
                    <Box sx={{
                      mt: 0.75, display: "flex", gap: 0.75,
                      overflowX: "auto", pb: 0.5,
                      opacity: chipsActive ? 1 : 0.35,
                      pointerEvents: chipsActive ? "auto" : "none",
                      "&::-webkit-scrollbar": { height: 3 },
                      "&::-webkit-scrollbar-thumb": { bgcolor: C.border, borderRadius: 2 },
                    }}>
                      {msg.chips.map((chip, ci) => (
                        <Box key={ci} onClick={() => chipsActive && handleChip(chip)}
                          sx={{
                            flexShrink: 0, cursor: chipsActive ? "pointer" : "default",
                            px: 1.5, py: "5px", borderRadius: "20px",
                            border: `1.5px solid ${chip.borderColor || C.border}`,
                            bgcolor: chip.bgcolor || C.bg,
                            color: chip.textColor || C.textPrimary,
                            fontSize: 12, fontWeight: 600,
                            fontFamily: "Inter, sans-serif", lineHeight: 1.4,
                            userSelect: "none", transition: "all 0.15s",
                            "&:hover": chipsActive ? { filter: "brightness(0.9)", transform: "translateY(-1px)" } : {},
                          }}>
                          {chip.label}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}

            {loading && (
              <Box sx={{ display: "flex" }}>
                <Box sx={{ px: 1.5, py: 1, borderRadius: "14px 14px 14px 4px", bgcolor: C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={12} sx={{ color: C.accent }} />
                  <Typography sx={{ fontSize: 12, color: C.textMuted }}>Thinking…</Typography>
                </Box>
              </Box>
            )}
            <div ref={bottomRef} />
          </Box>

          {/* ── Input ── */}
          <Box sx={{ px: 1.5, py: 1.5, borderTop: `1px solid ${C.border}`, bgcolor: C.bg, display: "flex", gap: 1, alignItems: "flex-end" }}>
            <TextField multiline maxRows={4} fullWidth size="small"
              placeholder={mode === "ticket" ? "Describe your issue or answer above…" : "Type a message…"}
              value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
              sx={{ "& .MuiOutlinedInput-root": {
                borderRadius: "12px", fontSize: 13,
                "& fieldset": { borderColor: C.border },
                "&:hover fieldset": { borderColor: C.accent },
                "&.Mui-focused fieldset": { borderColor: C.accent },
              }}} />
            <IconButton onClick={handleSend} disabled={!input.trim() || loading}
              sx={{
                bgcolor: mode === "ticket" ? C.navyMid : C.accent, color: "#fff",
                width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
                "&:hover": { bgcolor: mode === "ticket" ? C.sidebarActive : C.accentHover },
                "&.Mui-disabled": { bgcolor: C.border, color: C.textMuted },
              }}>
              ➤
            </IconButton>
          </Box>
        </Paper>
      </Collapse>

      <Fab onClick={() => setOpen((v) => !v)}
        sx={{
          bgcolor: open ? C.navyMid : C.accent, color: "#fff",
          width: 52, height: 52, boxShadow: C.shadowMd,
          "&:hover": { bgcolor: open ? C.sidebarActive : C.accentHover },
          transition: "all 0.2s ease", fontSize: open ? 20 : 22,
        }}>
        {open ? "✕" : "✦"}
      </Fab>
    </Box>
  );
};
