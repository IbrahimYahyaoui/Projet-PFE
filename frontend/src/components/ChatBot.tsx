import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box, Typography, TextField, IconButton, Fab, CircularProgress,
  Chip, Collapse, Divider, Tooltip,
} from "@mui/material";

const API = "/api";

type Priority    = "low" | "medium" | "high" | "critical";
type Category    = "hardware" | "software" | "network" | "access" | "other";
type TicketField = "title" | "description" | "priority" | "category";

interface ActionChip {
  label: string; value: string;
  bgcolor?: string; textColor?: string; borderColor?: string;
}
interface TicketDraft {
  title?: string; description?: string;
  priority?: Priority; category?: Category;
}
interface Msg {
  role: "user" | "ai";
  text: string;
  chips?:   ActionChip[];
  card?:    TicketDraft;
  success?: boolean;
}
interface HistoryItem { _id: string; title: string; updatedAt: string; }

const C = {
  bg:           "#ffffff",
  bgSide:       "#f4f7fb",
  bgInput:      "#f0f4fa",
  accent:       "#2563eb",
  accentHover:  "#1d4ed8",
  accentLight:  "#eff6ff",
  accentMid:    "#dbeafe",
  textPrimary:  "#0f172a",
  textSecondary:"#475569",
  textMuted:    "#94a3b8",
  border:       "#e2e8f0",
  shadow:       "0 1px 3px rgba(0,0,0,0.08)",
  shadowMd:     "0 4px 16px rgba(37,99,235,0.18)",
  shadowLg:     "0 8px 40px rgba(15,23,42,0.13)",
  success:      "#16a34a",
  successBg:    "#f0fdf4",
  successBorder:"#bbf7d0",
  sidebarHover: "#e8f0fe",
  sidebarActive:"#dbeafe",
  userBubble:   "#2563eb",
};

const PRIORITY_LABEL: Record<Priority, string> = { low: "🟢 Low", medium: "🟡 Medium", high: "🟠 High", critical: "🔴 Critical" };
const CATEGORY_LABEL: Record<Category, string> = { hardware: "🖥️ Hardware", software: "💻 Software", network: "🌐 Network", access: "🔑 Access", other: "📦 Other" };

const priorityColors: Record<Priority, { bg: string; text: string; border: string }> = {
  low:      { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  medium:   { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  high:     { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  critical: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
};

const FIELD_QUESTION: Record<TicketField, string> = {
  title:       "Quel titre donneriez-vous à ce ticket ? (résumé court du problème)",
  description: "Pouvez-vous décrire le problème plus en détail ?",
  priority:    "Quelle est la priorité de ce ticket ?",
  category:    "Dans quelle catégorie se situe ce problème ?",
};

const PRIORITY_CHIPS: ActionChip[] = [
  { label: "🟢 Low",      value: "low",      ...priorityColors.low      },
  { label: "🟡 Medium",   value: "medium",   ...priorityColors.medium   },
  { label: "🟠 High",     value: "high",     ...priorityColors.high     },
  { label: "🔴 Critical", value: "critical", ...priorityColors.critical },
];
const CATEGORY_CHIPS: ActionChip[] = [
  { label: "🖥️ Hardware", value: "hardware", bgcolor: C.accentLight, textColor: C.accent, borderColor: C.accentMid },
  { label: "💻 Software", value: "software", bgcolor: C.accentLight, textColor: C.accent, borderColor: C.accentMid },
  { label: "🌐 Network",  value: "network",  bgcolor: C.accentLight, textColor: C.accent, borderColor: C.accentMid },
  { label: "🔑 Access",   value: "access",   bgcolor: C.accentLight, textColor: C.accent, borderColor: C.accentMid },
  { label: "📦 Other",    value: "other",    bgcolor: C.accentLight, textColor: C.accent, borderColor: C.accentMid },
];
const CONFIRM_CHIPS: ActionChip[] = [
  { label: "✅ Créer le ticket", value: "confirm", bgcolor: "#f0fdf4", textColor: "#16a34a", borderColor: "#bbf7d0" },
  { label: "✏️ Annuler",         value: "cancel",  bgcolor: "#fef2f2", textColor: "#dc2626", borderColor: "#fecaca" },
];

const nextMissing = (d: TicketDraft): TicketField | null => {
  if (!d.title)       return "title";
  if (!d.description) return "description";
  if (!d.priority)    return "priority";
  if (!d.category)    return "category";
  return null;
};

const CHATBOT_SUGGESTIONS: Record<string, { icon: string; label: string; msg: string }[]> = {
  admin: [
    { icon: "📊", label: "Résumé SLA",     msg: "Donne-moi un résumé des SLA actuels" },
    { icon: "📥", label: "File d'attente", msg: "Quels tickets n'ont pas encore été assignés ?" },
    { icon: "👥", label: "Charge équipes", msg: "Quel est l'état de charge de mes équipes ?" },
    { icon: "🎫", label: "Créer un ticket",msg: "__start_ticket__" },
  ],
  leader: [
    { icon: "⚖️", label: "Charge équipe", msg: "Quel est l'état de charge de mon équipe ?" },
    { icon: "🚨", label: "Tickets SLA",   msg: "Quels tickets de mon équipe ont un SLA en danger ?" },
    { icon: "📋", label: "Résumé équipe", msg: "Donne-moi un résumé de l'activité de mon équipe" },
  ],
  tech: [
    { icon: "📋", label: "Mes tickets",         msg: "Quels tickets me sont assignés en ce moment ?" },
    { icon: "🔧", label: "Aide dépannage",       msg: "J'ai besoin d'aide pour résoudre un problème technique" },
    { icon: "📚", label: "Base de connaissances",msg: "Cherche dans la base de connaissances" },
  ],
  user: [
    { icon: "⚠️", label: "J'ai un problème",  msg: "J'ai un problème informatique à signaler" },
    { icon: "📋", label: "Mes tickets",        msg: "Quel est l'état de mes tickets ?" },
    { icon: "🎫", label: "Créer un ticket",    msg: "__start_ticket__" },
    { icon: "❓", label: "Aide",               msg: "Que peux-tu faire pour m'aider ?" },
  ],
};

const BASE_RULES =
  "Tu es l'assistant IA de TuskFlow, une plateforme de gestion de tickets et de projets. " +
  "Tu aides les utilisateurs à gérer leurs tickets de support, projets et équipes. " +
  "Sois professionnel, bienveillant et concis. " +
  "RÈGLE LANGUE CRITIQUE : Détecte automatiquement la langue du message de l'utilisateur et réponds TOUJOURS dans cette même langue. Français → français, Arabe → arabe, Anglais → anglais. Ne mélange jamais les langues. " +
  "IMPORTANT : L'utilisateur est déjà authentifié — ne lui demande JAMAIS de prouver son identité. Son profil est fourni ci-dessous. " +
  "RÈGLE CRITIQUE TICKETS : Tu n'as JAMAIS accès aux tickets réels et tu ne peux PAS créer de tickets toi-même. " +
  "Ne simule JAMAIS la création d'un ticket, n'invente JAMAIS de numéro de ticket, ne liste JAMAIS de faux tickets. " +
  "Quand l'utilisateur a un problème qui nécessite un ticket, dis-lui clairement de cliquer sur le bouton 🎫 en haut du chat pour créer un vrai ticket via le formulaire intégré. " +
  "À la fin de chaque réponse, si c'est pertinent, propose 2-3 suggestions courtes sous la forme : [SUGGESTIONS: suggestion1 | suggestion2 | suggestion3].";

export const ChatBot = () => {
  const storedUser  = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const currentRole = currentUser?.role ?? "user";

  const [open,        setOpen]        = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [mode,        setMode]        = useState<"chat" | "ticket">("chat");
  const [msgs,        setMsgs]        = useState<Msg[]>([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [chatCtx,     setChatCtx]     = useState<string | undefined>(undefined);
  const [draft,       setDraft]       = useState<TicketDraft>({});
  const [awaitField,  setAwaitField]  = useState<TicketField | null>(null);
  const [companyCtx,  setCompanyCtx]  = useState<string>("");
  const [historyId,   setHistoryId]   = useState<string | null>(null);
  const [histories,   setHistories]   = useState<HistoryItem[]>([]);
  const [copiedIdx,   setCopiedIdx]   = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || companyCtx) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/ai/company-context`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.contextString) setCompanyCtx(d.contextString); })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const addMsg  = (m: Msg)       => setMsgs(p => [...p, m]);
  const addMsgs = (...ms: Msg[]) => setMsgs(p => [...p, ...ms]);

  const buildRules = useCallback(() => {
    let rules = BASE_RULES;
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored) as { name: string; email: string; role: string };
        rules += `\n\n--- Utilisateur connecté ---\nNom: ${u.name}\nEmail: ${u.email}\nRôle: ${u.role}`;
      }
    } catch { /* ignore */ }
    if (companyCtx) rules += `\n\n--- Contexte entreprise ---\n${companyCtx}`;
    return rules;
  }, [companyCtx]);

  const parseSuggestions = (text: string): { clean: string; chips: ActionChip[] } => {
    const match = text.match(/\[SUGGESTIONS:\s*(.+?)\]/);
    if (!match) return { clean: text, chips: [] };
    const clean = text.replace(match[0], "").trim();
    const chips = match[1].split("|").map(s => s.trim()).filter(Boolean).map(s => ({
      label: s, value: `__suggestion__${s}`,
      bgcolor: C.accentLight, textColor: C.accent, borderColor: C.accentMid,
    }));
    return { clean, chips };
  };

  const copyMsg = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const saveHistory = async (updatedMsgs: Msg[]) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const payload = {
      messages: updatedMsgs.filter(m => m.text).map(m => ({ role: m.role, text: m.text })),
      title: updatedMsgs.find(m => m.role === "user")?.text?.slice(0, 60) || "Conversation",
    };
    try {
      if (historyId) {
        await fetch(`${API}/chat-history/${historyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } else {
        const res  = await fetch(`${API}/chat-history`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data._id) setHistoryId(data._id);
      }
    } catch { /* silently fail */ }
  };

  const loadHistories = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res  = await fetch(`${API}/chat-history`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setHistories(data);
    } catch { /* ignore */ }
  };

  const openHistory = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res  = await fetch(`${API}/chat-history/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.messages) {
        setMsgs(data.messages.map((m: { role: string; text: string }) => ({ role: m.role as "user" | "ai", text: m.text })));
        setHistoryId(id);
        setMode("chat");
        setChatCtx(undefined);
        setShowHistory(false);
      }
    } catch { /* ignore */ }
  };

  const newConversation = () => {
    setMsgs([]);
    setHistoryId(null);
    setChatCtx(undefined);
    setMode("chat");
    setDraft({});
    setAwaitField(null);
    setShowHistory(false);
  };

  const sendChat = async (text: string) => {
    if (text === "__start_ticket__") { startTicket(); return; }
    addMsg({ role: "user", text });
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res  = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, rules: buildRules(), context: chatCtx }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Requête échouée");
      const { clean, chips } = parseSuggestions(data.reply);
      const aiMsg: Msg = { role: "ai", text: clean, ...(chips.length > 0 && { chips }) };
      const updated = [...msgs, { role: "user" as const, text }, aiMsg];
      setMsgs(updated);
      setChatCtx(data.context);
      await saveHistory(updated);
    } catch (err: any) {
      addMsg({ role: "ai", text: `Erreur : ${err.message}` });
    } finally { setLoading(false); }
  };

  const askNext = (d: TicketDraft): Msg => {
    const field = nextMissing(d);
    if (!field) {
      return {
        role: "ai",
        text: "Voici le résumé de votre ticket. Voulez-vous le créer ?",
        card:  d,
        chips: CONFIRM_CHIPS,
      };
    }
    setAwaitField(field);
    return {
      role: "ai",
      text: FIELD_QUESTION[field],
      chips: field === "priority" ? PRIORITY_CHIPS : field === "category" ? CATEGORY_CHIPS : undefined,
    };
  };

  const startTicket = () => {
    if (currentRole === "tech") {
      setMsgs([{ role: "ai", text: "En tant que technicien, la création de tickets n'est pas dans votre rôle. Contactez votre Team Lead." }]);
      return;
    }
    setMode("ticket");
    setDraft({});
    setAwaitField(null);
    setMsgs([{ role: "ai", text: "Créons un ticket ensemble. Décrivez votre problème — j'extrairai automatiquement les informations clés." }]);
  };

  const extractAndAdvance = async (text: string) => {
    addMsg({ role: "user", text });
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API}/ai/extract-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      const extracted = await res.json();
      if (!res.ok) throw new Error(extracted.error || "Extraction échouée");
      const newDraft: TicketDraft = { ...extracted };
      setDraft(newDraft);
      addMsg(askNext(newDraft));
    } catch (err: any) {
      addMsg({ role: "ai", text: `Erreur : ${err.message}` });
    } finally { setLoading(false); }
  };

  const answerTextField = (text: string) => {
    const field = awaitField;
    if (!field) return;
    const newDraft = { ...draft, [field]: text };
    setDraft(newDraft);
    setAwaitField(null);
    addMsg({ role: "user", text });
    addMsg(askNext(newDraft));
  };

  const createTicket = async () => {
    setLoading(true);
    addMsg({ role: "user", text: "Confirmer & Créer" });
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Création échouée");
      addMsg({
        role: "ai",
        text: `✅ Ticket créé avec succès ! "${data.title}" est maintenant ouvert et l'équipe a été notifiée.`,
        success: true,
      });
      setMode("chat");
      setDraft({});
      setAwaitField(null);
    } catch (err: any) {
      addMsg({ role: "ai", text: `Échec de création du ticket : ${err.message}` });
    } finally { setLoading(false); }
  };

  const handleChip = (chip: ActionChip) => {
    if (loading) return;
    if (chip.value === "__start_ticket__") { startTicket(); return; }
    if (chip.value.startsWith("__suggestion__")) { sendChat(chip.label); return; }
    if (chip.value === "confirm") { createTicket(); return; }
    if (chip.value === "cancel") {
      addMsgs(
        { role: "user", text: "Annuler" },
        { role: "ai",   text: "Création de ticket annulée. Comment puis-je vous aider ?" },
      );
      setMode("chat"); setDraft({}); setAwaitField(null);
      return;
    }
    if (chip.value === "critical") {
      addMsgs(
        { role: "user", text: "Critique" },
        {
          role: "ai",
          text: "⚠️ Critique signifie une réponse immédiate requise — l'équipe sera alertée. Vous confirmez ?",
          chips: [
            { label: "Oui, Critique", value: "confirm_critical", ...priorityColors.critical },
            { label: "Utiliser High", value: "high",             ...priorityColors.high },
          ],
        },
      );
      return;
    }
    if (chip.value === "confirm_critical") {
      const newDraft = { ...draft, priority: "critical" as Priority };
      setDraft(newDraft); setAwaitField(null);
      addMsg({ role: "user", text: "Oui, Critique" });
      addMsg(askNext(newDraft));
      return;
    }
    if (["low", "medium", "high"].includes(chip.value)) {
      const newDraft = { ...draft, priority: chip.value as Priority };
      setDraft(newDraft); setAwaitField(null);
      addMsg({ role: "user", text: chip.label });
      addMsg(askNext(newDraft));
      return;
    }
    if (["hardware", "software", "network", "access", "other"].includes(chip.value)) {
      const newDraft = { ...draft, category: chip.value as Category };
      setDraft(newDraft); setAwaitField(null);
      addMsg({ role: "user", text: chip.label });
      addMsg(askNext(newDraft));
      return;
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    if (mode === "chat") { sendChat(text); return; }
    const isFirst = msgs.length === 1;
    if (isFirst) { extractAndAdvance(text); } else { answerTextField(text); }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const lastIdx = msgs.length - 1;

  let userName = "vous";
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    if (u.name) userName = u.name.split(" ")[0];
  } catch { /* ignore */ }

  return (
    <Box sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1.5 }}>

      <Collapse in={open} unmountOnExit>
        <Box sx={{
          width: 380,
          height: "calc(100vh - 120px)",
          maxHeight: 560,
          bgcolor: C.bg,
          borderRadius: "20px",
          boxShadow: C.shadowLg,
          border: `1px solid ${C.border}`,
          display: "flex",
          overflow: "hidden",
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        }}>

          {/* ── SIDEBAR HISTORIQUE ── */}
          <Collapse in={showHistory} orientation="horizontal" unmountOnExit>
            <Box sx={{ width: 190, height: "100%", bgcolor: C.bgSide, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${C.border}` }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Historique
                </Typography>
              </Box>
              <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
                <Box onClick={newConversation} sx={{
                  px: 1.5, py: 1, borderRadius: "10px",
                  bgcolor: C.accent, color: "#fff",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "center",
                  "&:hover": { bgcolor: C.accentHover }, transition: "background 0.15s",
                }}>
                  + Nouvelle conversation
                </Box>
              </Box>
              <Box sx={{ flex: 1, overflowY: "auto", px: 1, py: 0.5 }}>
                {histories.length === 0 ? (
                  <Typography sx={{ fontSize: 12, color: C.textMuted, px: 1, py: 2, textAlign: "center" }}>
                    Aucun historique
                  </Typography>
                ) : histories.map(h => (
                  <Box key={h._id} onClick={() => openHistory(h._id)} sx={{
                    px: 1.5, py: 1, borderRadius: "8px", cursor: "pointer", mb: 0.5,
                    bgcolor: historyId === h._id ? C.sidebarActive : "transparent",
                    "&:hover": { bgcolor: C.sidebarHover }, transition: "background 0.12s",
                  }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.title}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: C.textMuted }}>
                      {new Date(h.updatedAt).toLocaleDateString("fr-FR")}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Collapse>

          {/* ── ZONE PRINCIPALE ── */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

            {/* Header */}
            <Box sx={{
              px: 2, py: 1.25,
              background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
              display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0,
            }}>
              <Box sx={{ width: 32, height: 32, borderRadius: "9px", bgcolor: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                ✦
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>TuskFlow AI</Typography>
                <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                  TuskFlow • {mode === "ticket" ? "Création ticket" : "Assistant"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip title="Historique">
                  <IconButton size="small" onClick={() => { if (!showHistory) loadHistories(); setShowHistory(v => !v); }}
                    sx={{ color: "rgba(255,255,255,0.85)", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" }, borderRadius: "8px" }}>
                    <span style={{ fontSize: 14 }}>🕐</span>
                  </IconButton>
                </Tooltip>
                {mode === "chat" && (
                  <Tooltip title="Créer un ticket">
                    <IconButton size="small" onClick={startTicket}
                      sx={{ color: "rgba(255,255,255,0.85)", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" }, borderRadius: "8px" }}>
                      <span style={{ fontSize: 14 }}>🎫</span>
                    </IconButton>
                  </Tooltip>
                )}
                {mode === "ticket" && (
                  <Tooltip title="Retour au chat">
                    <IconButton size="small" onClick={() => { setMode("chat"); setMsgs([]); setDraft({}); setAwaitField(null); }}
                      sx={{ color: "rgba(255,255,255,0.85)", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" }, borderRadius: "8px" }}>
                      <span style={{ fontSize: 14 }}>💬</span>
                    </IconButton>
                  </Tooltip>
                )}
                <IconButton size="small" onClick={() => setOpen(false)}
                  sx={{ color: "rgba(255,255,255,0.85)", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" }, borderRadius: "8px" }}>
                  <span style={{ fontSize: 14 }}>✕</span>
                </IconButton>
              </Box>
            </Box>

            {/* Zone messages */}
            <Box sx={{
              flex: 1, overflowY: "auto", px: 2, py: 1.5,
              display: "flex", flexDirection: "column", gap: 1.5, bgcolor: C.bg,
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-thumb": { bgcolor: C.border, borderRadius: 2 },
            }}>

              {/* Écran d'accueil */}
              {msgs.length === 0 && !loading && (
                <Box>
                  <Box sx={{ textAlign: "center", py: 1.5, pb: 2 }}>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: "14px",
                      background: "linear-gradient(135deg, #2563eb, #1e40af)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, mx: "auto", mb: 1.5,
                      boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
                    }}>✦</Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, mb: 0.5 }}>
                      Bonjour {userName} !
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
                      Comment puis-je vous aider aujourd'hui ?
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 1.5, borderColor: C.border }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", mb: 1 }}>
                    Suggestions
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                    {(CHATBOT_SUGGESTIONS[currentRole] ?? CHATBOT_SUGGESTIONS.user).map(s => (
                      <Box key={s.msg} onClick={() => s.msg === "__start_ticket__" ? startTicket() : sendChat(s.msg)} sx={{
                        px: 1.5, py: 1, borderRadius: "12px",
                        border: `1px solid ${C.border}`,
                        display: "flex", alignItems: "center", gap: 1.5,
                        cursor: "pointer", bgcolor: C.bg,
                        "&:hover": { bgcolor: C.accentLight, borderColor: C.accent },
                        transition: "all 0.15s ease",
                      }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                          {s.icon}
                        </Box>
                        <Typography sx={{ fontSize: 13, color: C.textPrimary, fontWeight: 500 }}>{s.label}</Typography>
                        <Box sx={{ ml: "auto", color: C.textMuted, fontSize: 14 }}>›</Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Messages */}
              {msgs.map((msg, i) => {
                const chipsActive = i === lastIdx && !loading;
                return (
                  <Box key={i} sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>

                    {/* Bulle + bouton copier */}
                    <Box sx={{ position: "relative", maxWidth: "82%", "&:hover .copy-btn": { opacity: 1 } }}>
                      <Box sx={{
                        px: 1.5, py: 1,
                        borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        bgcolor: msg.role === "user" ? C.userBubble : msg.success ? C.successBg : C.bgInput,
                        border: msg.role === "ai" ? `1px solid ${msg.success ? C.successBorder : C.border}` : "none",
                        boxShadow: C.shadow,
                      }}>
                        <Typography sx={{ fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", color: msg.role === "user" ? "#fff" : msg.success ? C.success : C.textPrimary }}>
                          {msg.text}
                        </Typography>
                      </Box>

                      {/* Bouton copier — seulement sur les messages IA */}
                      {msg.role === "ai" && (
                        <Tooltip title={copiedIdx === i ? "Copié !" : "Copier"}>
                          <Box
                            className="copy-btn"
                            onClick={() => copyMsg(msg.text, i)}
                            sx={{
                              position: "absolute", bottom: 6, right: -30,
                              width: 22, height: 22, borderRadius: "6px",
                              bgcolor: C.bg, border: `1px solid ${C.border}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", opacity: 0,
                              transition: "all 0.15s",
                              "&:hover": { bgcolor: C.accentLight, borderColor: C.accent },
                              fontSize: 12,
                            }}
                          >
                            {copiedIdx === i ? "✅" : "📋"}
                          </Box>
                        </Tooltip>
                      )}
                    </Box>

                    {/* Card ticket preview */}
                    {msg.card && (
                      <Box sx={{ maxWidth: "82%", mt: 0.5, bgcolor: C.bg, border: `1px solid ${C.border}`, borderRadius: "12px", p: 1.5 }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", mb: 1 }}>
                          Aperçu du ticket
                        </Typography>
                        {msg.card.title && (
                          <Box sx={{ mb: 0.75 }}>
                            <Typography sx={{ fontSize: 10, color: C.textMuted }}>Titre</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{msg.card.title}</Typography>
                          </Box>
                        )}
                        {msg.card.description && (
                          <Box sx={{ mb: 0.75 }}>
                            <Typography sx={{ fontSize: 10, color: C.textMuted }}>Description</Typography>
                            <Typography sx={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.45 }}>{msg.card.description}</Typography>
                          </Box>
                        )}
                        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.75 }}>
                          {msg.card.priority && (
                            <Chip size="small" label={PRIORITY_LABEL[msg.card.priority]}
                              sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: priorityColors[msg.card.priority].bg, color: priorityColors[msg.card.priority].text, border: `1px solid ${priorityColors[msg.card.priority].border}` }} />
                          )}
                          {msg.card.category && (
                            <Chip size="small" label={CATEGORY_LABEL[msg.card.category]}
                              sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: C.accentLight, color: C.accent, border: `1px solid ${C.accentMid}` }} />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Chips */}
                    {msg.chips && msg.chips.length > 0 && (
                      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", maxWidth: "90%", opacity: chipsActive ? 1 : 0.4, pointerEvents: chipsActive ? "auto" : "none" }}>
                        {msg.chips.map((chip, ci) => (
                          <Box key={ci} onClick={() => chipsActive && handleChip(chip)} sx={{
                            cursor: chipsActive ? "pointer" : "default",
                            px: 1.5, py: "5px", borderRadius: "20px",
                            border: `1.5px solid ${chip.borderColor || C.border}`,
                            bgcolor: chip.bgcolor || C.bg,
                            color: chip.textColor || C.textPrimary,
                            fontSize: 12, fontWeight: 600, lineHeight: 1.4,
                            userSelect: "none", transition: "all 0.15s",
                            "&:hover": chipsActive ? { filter: "brightness(0.93)", transform: "translateY(-1px)" } : {},
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
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                  <Box sx={{ px: 1.5, py: 1, borderRadius: "16px 16px 16px 4px", bgcolor: C.bgInput, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={11} sx={{ color: C.accent }} />
                    <Typography sx={{ fontSize: 12, color: C.textMuted }}>En train de réfléchir…</Typography>
                  </Box>
                </Box>
              )}
              <div ref={bottomRef} />
            </Box>

            {/* Input */}
            <Box sx={{ px: 1.5, py: 1.25, borderTop: `1px solid ${C.border}`, bgcolor: C.bg, display: "flex", gap: 1, alignItems: "flex-end" }}>
              <TextField
                multiline maxRows={4} fullWidth size="small"
                placeholder={mode === "ticket" ? "Décrivez votre problème…" : "Envoyer un message…"}
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px", fontSize: 13, bgcolor: C.bgInput,
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover fieldset": { borderColor: C.accent + "60" },
                    "&.Mui-focused fieldset": { borderColor: C.accent },
                  },
                }}
              />
              <IconButton onClick={handleSend} disabled={!input.trim() || loading}
                sx={{
                  bgcolor: C.accent, color: "#fff",
                  width: 38, height: 38, borderRadius: "12px", flexShrink: 0,
                  "&:hover": { bgcolor: C.accentHover },
                  "&.Mui-disabled": { bgcolor: C.border, color: C.textMuted },
                  transition: "all 0.15s",
                }}>
                <span style={{ fontSize: 16 }}>➤</span>
              </IconButton>
            </Box>

          </Box>
        </Box>
      </Collapse>

      {/* FAB */}
      <Fab onClick={() => setOpen(v => !v)} sx={{
        background: open ? "linear-gradient(135deg, #475569, #334155)" : "linear-gradient(135deg, #2563eb, #1e40af)",
        color: "#fff", width: 54, height: 54, boxShadow: C.shadowMd,
        "&:hover": { filter: "brightness(1.1)", transform: "scale(1.05)" },
        transition: "all 0.2s ease", fontSize: open ? 18 : 22,
      }}>
        {open ? "✕" : "✦"}
      </Fab>

    </Box>
  );
};