// frontend/src/pages/AIAssistant.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, TextField, IconButton, CircularProgress, Chip, Divider, Tooltip } from "@mui/material";
import { C } from "../theme";
import { api } from "../api";
import { getCurrentUser } from "../hooks/useAuth";

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
interface KBResult { _id: string; title: string; category: string; }

const pColors: Record<Priority, { bg: string; text: string; border: string }> = {
  low:      { bg: "rgba(34,197,94,.10)",   text: "#16a34a", border: "rgba(34,197,94,.25)" },
  medium:   { bg: "rgba(59,130,246,.10)",  text: "#2563eb", border: "rgba(59,130,246,.25)" },
  high:     { bg: "rgba(249,115,22,.10)",  text: "#ea580c", border: "rgba(249,115,22,.25)" },
  critical: { bg: "rgba(239,68,68,.08)",   text: "#dc2626", border: "rgba(239,68,68,.20)" },
};

const PRIORITY_CHIPS: ActionChip[] = [
  { label: "Faible",    value: "low",      bgcolor: pColors.low.bg,      textColor: pColors.low.text,      borderColor: pColors.low.border      },
  { label: "Moyenne",   value: "medium",   bgcolor: pColors.medium.bg,   textColor: pColors.medium.text,   borderColor: pColors.medium.border   },
  { label: "Haute",     value: "high",     bgcolor: pColors.high.bg,     textColor: pColors.high.text,     borderColor: pColors.high.border     },
  { label: "Critique",  value: "critical", bgcolor: pColors.critical.bg, textColor: pColors.critical.text, borderColor: pColors.critical.border },
];
const CATEGORY_CHIPS: ActionChip[] = [
  { label: "Matériel", value: "hardware", bgcolor: C.accentLight, textColor: C.accent, borderColor: C.accentMid },
  { label: "Logiciel", value: "software", bgcolor: C.accentLight, textColor: C.accent, borderColor: C.accentMid },
  { label: "Réseau",   value: "network",  bgcolor: C.accentLight, textColor: C.accent, borderColor: C.accentMid },
  { label: "Accès",    value: "access",   bgcolor: C.accentLight, textColor: C.accent, borderColor: C.accentMid },
  { label: "Autre",    value: "other",    bgcolor: C.accentLight, textColor: C.accent, borderColor: C.accentMid },
];
const CONFIRM_CHIPS: ActionChip[] = [
  { label: "Créer le ticket", value: "confirm", bgcolor: "rgba(34,197,94,.10)", textColor: "#16a34a", borderColor: "rgba(34,197,94,.25)" },
  { label: "Annuler",         value: "cancel",  bgcolor: "rgba(239,68,68,.08)", textColor: "#dc2626", borderColor: "rgba(239,68,68,.20)" },
];

const FIELD_QUESTION: Record<TicketField, string> = {
  title:       "Quel titre donneriez-vous à ce ticket ?",
  description: "Pouvez-vous décrire le problème plus en détail ?",
  priority:    "Quelle est la priorité de ce ticket ?",
  category:    "Dans quelle catégorie se situe ce problème ?",
};

const nextMissing = (d: TicketDraft): TicketField | null => {
  if (!d.title)       return "title";
  if (!d.description) return "description";
  if (!d.priority)    return "priority";
  if (!d.category)    return "category";
  return null;
};

const ROLE_SUGGESTIONS: Record<string, { icon: string; label: string; msg: string }[]> = {
  admin: [
    { icon: "ti ti-chart-bar", label: "Résumé des SLA",       msg: "Donne-moi un résumé des alertes SLA actuelles" },
    { icon: "ti ti-inbox",     label: "File d'attente",        msg: "Quels tickets sont en attente d'assignation ?" },
    { icon: "ti ti-users",     label: "Charge des équipes",    msg: "Comment se répartit la charge de travail entre les équipes ?" },
    { icon: "ti ti-ticket",    label: "Créer un ticket",       msg: "Je veux créer un nouveau ticket de support" },
  ],
  leader: [
    { icon: "ti ti-user-check",  label: "Assigner tickets",   msg: "Quels tickets dois-je assigner à mon équipe ?" },
    { icon: "ti ti-chart-line",  label: "Performance équipe",  msg: "Comment se porte la performance de mon équipe ?" },
    { icon: "ti ti-alert-triangle", label: "Escalades",        msg: "Y a-t-il des tickets escaladés qui nécessitent mon attention ?" },
    { icon: "ti ti-ticket",    label: "Créer un ticket",       msg: "Je veux créer un nouveau ticket" },
  ],
  tech: [
    { icon: "ti ti-list-check",  label: "Mes tickets",        msg: "Quels sont mes tickets assignés en cours ?" },
    { icon: "ti ti-tool",        label: "Dépannage",           msg: "J'ai besoin d'aide pour diagnostiquer un problème technique" },
    { icon: "ti ti-book",        label: "Base de connaissances", msg: "Cherche-moi des articles sur la résolution de tickets réseau" },
    { icon: "ti ti-ticket",      label: "Créer un ticket",     msg: "Je veux créer un nouveau ticket" },
  ],
  user: [
    { icon: "ti ti-ticket",      label: "Créer un ticket",    msg: "Je veux créer un nouveau ticket de support" },
    { icon: "ti ti-clock",       label: "Mes tickets",         msg: "Quels sont mes tickets en cours ?" },
    { icon: "ti ti-help",        label: "Comment ça marche ?", msg: "Comment fonctionne le système de tickets ?" },
    { icon: "ti ti-urgent",      label: "Problème urgent",     msg: "J'ai un problème urgent qui bloque mon travail" },
  ],
};

const CAT_COLORS: Record<string, string> = { hardware: "#EA580C", software: "#2563EB", network: "#16A34A", access: "#7C3AED", general: C.accent, other: "#64748B" };

const BASE_RULES =
  "Tu es l'assistant IA de TicketFlow, une plateforme de gestion de tickets IT. " +
  "Tu aides les utilisateurs à gérer leurs tickets de support, projets et équipes. " +
  "Sois professionnel, bienveillant et concis. " +
  "RÈGLE LANGUE CRITIQUE : Détecte automatiquement la langue du message et réponds TOUJOURS dans cette même langue. " +
  "IMPORTANT : L'utilisateur est déjà authentifié — ne lui demande JAMAIS de prouver son identité. " +
  "RÈGLE CRITIQUE TICKETS : Tu n'as JAMAIS accès aux tickets réels et tu ne peux PAS créer de tickets toi-même. " +
  "Ne simule JAMAIS la création d'un ticket. Quand l'utilisateur a besoin d'un ticket, active le mode ticket. " +
  "À la fin de chaque réponse pertinente, propose 2-3 suggestions : [SUGGESTIONS: suggestion1 | suggestion2 | suggestion3].";

export default function AIAssistant() {
  const navigate  = useNavigate();
  const user      = getCurrentUser();
  const role      = user?.role ?? "user";
  const userName  = user?.name?.split(" ")[0] ?? "vous";

  const [mode,       setMode]       = useState<"chat" | "ticket">("chat");
  const [msgs,       setMsgs]       = useState<Msg[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [chatCtx,    setChatCtx]    = useState<string | undefined>(undefined);
  const [draft,      setDraft]      = useState<TicketDraft>({});
  const [awaitField, setAwaitField] = useState<TicketField | null>(null);
  const [historyId,  setHistoryId]  = useState<string | null>(null);
  const [histories,  setHistories]  = useState<HistoryItem[]>([]);
  const [copiedIdx,  setCopiedIdx]  = useState<number | null>(null);
  const [kbResults,  setKbResults]  = useState<KBResult[]>([]);
  const [companyCtx, setCompanyCtx] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistories();
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/ai/company-context`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.contextString) setCompanyCtx(d.contextString); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const buildRules = useCallback(() => {
    let rules = BASE_RULES;
    if (user) rules += `\n\n--- Utilisateur connecté ---\nNom: ${user.name}\nEmail: ${user.email}\nRôle: ${role}`;
    if (companyCtx) rules += `\n\n--- Contexte entreprise ---\n${companyCtx}`;
    return rules;
  }, [companyCtx, user, role]);

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

  const addMsg  = (m: Msg)       => setMsgs(p => [...p, m]);
  const addMsgs = (...ms: Msg[]) => setMsgs(p => [...p, ...ms]);

  const loadHistories = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API}/chat-history`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setHistories(data);
    } catch { /* ignore */ }
  };

  const openHistory = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API}/chat-history/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.messages) {
        setMsgs(data.messages.map((m: { role: string; text: string }) => ({ role: m.role as "user" | "ai", text: m.text })));
        setHistoryId(id);
        setMode("chat");
        setChatCtx(undefined);
        setKbResults([]);
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
    setKbResults([]);
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
        if (data._id) { setHistoryId(data._id); loadHistories(); }
      }
    } catch { /* ignore */ }
  };

  const sendChat = async (text: string) => {
    addMsg({ role: "user", text });
    setLoading(true);
    setKbResults([]);
    try {
      // CORRECTION 7 — la route /api/ai/chat exige verifyToken → envoyer le token
      const token = localStorage.getItem("token");
      const res  = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          rules: buildRules(),
          context: chatCtx,
          userContext: { role, currentPage: "ai-assistant" },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Requête échouée");
      const { clean, chips } = parseSuggestions(data.reply);
      const aiMsg: Msg = { role: "ai", text: clean, ...(chips.length > 0 && { chips }) };
      const updated = [...msgs, { role: "user" as const, text }, aiMsg];
      setMsgs(updated);
      setChatCtx(data.context);
      if (data.kbResults) setKbResults(data.kbResults);
      await saveHistory(updated);
    } catch (err: any) {
      addMsg({ role: "ai", text: `Erreur : ${err.message}` });
    } finally { setLoading(false); }
  };

  const askNext = (d: TicketDraft): Msg => {
    const field = nextMissing(d);
    if (!field) {
      return { role: "ai", text: "Voici le résumé de votre ticket. Voulez-vous le créer ?", card: d, chips: CONFIRM_CHIPS };
    }
    setAwaitField(field);
    return {
      role: "ai",
      text: FIELD_QUESTION[field],
      chips: field === "priority" ? PRIORITY_CHIPS : field === "category" ? CATEGORY_CHIPS : undefined,
    };
  };

  const startTicket = () => {
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
      if (extracted.suggestedArticles?.length) setKbResults(extracted.suggestedArticles);
      const newDraft: TicketDraft = { title: extracted.title, description: extracted.description, priority: extracted.priority, category: extracted.category };
      setDraft(newDraft);
      addMsg(askNext(newDraft));
    } catch (err: any) {
      addMsg({ role: "ai", text: `Erreur : ${err.message}` });
    } finally { setLoading(false); }
  };

  const answerTextField = (text: string) => {
    if (!awaitField) return;
    const newDraft = { ...draft, [awaitField]: text };
    setDraft(newDraft);
    setAwaitField(null);
    addMsg({ role: "user", text });
    addMsg(askNext(newDraft));
  };

  const createTicket = async () => {
    setLoading(true);
    addMsg({ role: "user", text: "Confirmer & Créer" });
    try {
      const data = await api.post<any>("/api/tickets", draft);
      addMsg({ role: "ai", text: `Ticket créé avec succès ! "${data.title}" est maintenant ouvert et l'équipe a été notifiée.`, success: true });
      setMode("chat");
      setDraft({});
      setAwaitField(null);
    } catch (err: any) {
      addMsg({ role: "ai", text: `Échec de création : ${err.message}` });
    } finally { setLoading(false); }
  };

  const handleChip = (chip: ActionChip) => {
    if (loading) return;
    if (chip.value.startsWith("__suggestion__")) { sendChat(chip.label); return; }
    if (chip.value === "confirm") { createTicket(); return; }
    if (chip.value === "cancel") {
      addMsgs({ role: "user", text: "Annuler" }, { role: "ai", text: "Création annulée. Comment puis-je vous aider ?" });
      setMode("chat"); setDraft({}); setAwaitField(null);
      return;
    }
    if (["low","medium","high","critical"].includes(chip.value)) {
      const newDraft = { ...draft, priority: chip.value as Priority };
      setDraft(newDraft); setAwaitField(null);
      addMsg({ role: "user", text: chip.label });
      addMsg(askNext(newDraft));
      return;
    }
    if (["hardware","software","network","access","other"].includes(chip.value)) {
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

  const copyMsg = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const lastIdx = msgs.length - 1;
  const suggestions = ROLE_SUGGESTIONS[role] ?? ROLE_SUGGESTIONS.user;

  return (
    <Box sx={{ height: "calc(100vh - 108px)", display: "flex", bgcolor: C.bgPage, overflow: "hidden" }}>

      {/* ── LEFT SIDEBAR ── */}
      <Box sx={{ width: 260, bgcolor: "#fff", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Header */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 2, borderBottom: `1px solid ${C.border}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: "10px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentHover})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box component="i" className="ti ti-robot" sx={{ fontSize: 18, color: "#fff" }} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>TicketFlow AI</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>Assistant IA</Typography>
            </Box>
          </Box>
          <Box
            onClick={newConversation}
            sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, borderRadius: "10px", bgcolor: C.accent, cursor: "pointer", "&:hover": { bgcolor: C.accentHover }, transition: "background 0.15s" }}
          >
            <Box component="i" className="ti ti-plus" sx={{ fontSize: 15, color: "#fff" }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: "#fff" }}>Nouvelle conversation</Typography>
          </Box>
        </Box>

        {/* Quick actions */}
        <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>
            Actions rapides
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {suggestions.map(s => (
              <Box
                key={s.msg}
                onClick={() => { if (mode !== "chat") newConversation(); sendChat(s.msg); }}
                sx={{ display: "flex", alignItems: "center", gap: 1.2, px: 1.5, py: 0.9, borderRadius: "8px", cursor: "pointer", "&:hover": { bgcolor: C.bgPage }, transition: "background 0.12s" }}
              >
                <Box component="i" className={s.icon} sx={{ fontSize: 14, color: C.accent, flexShrink: 0 }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary, lineHeight: 1.3 }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ borderColor: C.border, mx: 2 }} />

        {/* History */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>
            Historique
          </Typography>
        </Box>
        <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, pb: 2, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: C.border, borderRadius: 2 } }}>
          {histories.length === 0 ? (
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textMuted, textAlign: "center", py: 2 }}>
              Aucun historique
            </Typography>
          ) : histories.map(h => (
            <Box
              key={h._id}
              onClick={() => openHistory(h._id)}
              sx={{ px: 1.5, py: 0.9, borderRadius: "8px", cursor: "pointer", mb: 0.4, bgcolor: historyId === h._id ? C.accentLight : "transparent", "&:hover": { bgcolor: C.bgPage }, transition: "background 0.12s" }}
            >
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: historyId === h._id ? 600 : 400, color: historyId === h._id ? C.accent : C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {h.title}
              </Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted }}>
                {new Date(h.updatedAt).toLocaleDateString("fr-FR")}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── MAIN CHAT AREA ── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <Box sx={{ px: 3, py: 1.5, bgcolor: "#fff", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary }}>
              {mode === "ticket" ? "Création de ticket assistée" : "Conversation"}
            </Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>
              {mode === "ticket" ? "L'IA va extraire automatiquement les informations du ticket" : `Bonjour ${userName} — comment puis-je vous aider ?`}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {mode === "chat" && (
              <Box
                onClick={startTicket}
                sx={{ display: "flex", alignItems: "center", gap: 0.8, px: 1.5, py: 0.7, borderRadius: "8px", border: `1px solid ${C.border}`, cursor: "pointer", "&:hover": { bgcolor: C.bgPage }, transition: "background 0.12s" }}
              >
                <Box component="i" className="ti ti-ticket" sx={{ fontSize: 14, color: C.accent }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textSecondary }}>Créer un ticket</Typography>
              </Box>
            )}
            {mode === "ticket" && (
              <Box
                onClick={() => { setMode("chat"); setMsgs([]); setDraft({}); setAwaitField(null); }}
                sx={{ display: "flex", alignItems: "center", gap: 0.8, px: 1.5, py: 0.7, borderRadius: "8px", border: `1px solid ${C.border}`, cursor: "pointer", "&:hover": { bgcolor: C.bgPage }, transition: "background 0.12s" }}
              >
                <Box component="i" className="ti ti-arrow-left" sx={{ fontSize: 14, color: C.textMuted }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textSecondary }}>Retour au chat</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 4, py: 3, display: "flex", flexDirection: "column", gap: 2, "&::-webkit-scrollbar": { width: 6 }, "&::-webkit-scrollbar-thumb": { bgcolor: C.border, borderRadius: 3 } }}>

          {/* Welcome screen */}
          {msgs.length === 0 && !loading && (
            <Box sx={{ maxWidth: 560, mx: "auto", width: "100%", mt: 4 }}>
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Box sx={{ width: 60, height: 60, borderRadius: "18px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentHover})`, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2, boxShadow: `0 8px 24px ${C.accent}40` }}>
                  <Box component="i" className="ti ti-robot" sx={{ fontSize: 28, color: "#fff" }} />
                </Box>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 800, color: C.textPrimary, mb: 0.5 }}>
                  Bonjour {userName} !
                </Typography>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted, lineHeight: 1.6 }}>
                  Je suis votre assistant IA TicketFlow. Je peux vous aider à gérer vos tickets,<br />trouver des solutions et analyser vos données.
                </Typography>
              </Box>

              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
                Par où commencer ?
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                {suggestions.map(s => (
                  <Box
                    key={s.msg}
                    onClick={() => sendChat(s.msg)}
                    sx={{ p: 2, borderRadius: "12px", border: `1px solid ${C.border}`, bgcolor: "#fff", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 1.5, "&:hover": { borderColor: C.accent, bgcolor: C.accentLight }, transition: "all 0.15s" }}
                  >
                    <Box component="i" className={s.icon} sx={{ fontSize: 18, color: C.accent, mt: 0.2, flexShrink: 0 }} />
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 500, color: C.textPrimary, lineHeight: 1.4 }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Messages list */}
          {msgs.map((msg, i) => {
            const chipsActive = i === lastIdx && !loading;
            const isUser = msg.role === "user";
            return (
              <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 0.75, maxWidth: 700, ...(isUser ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }) }}>

                {/* Avatar + bubble */}
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flexDirection: isUser ? "row-reverse" : "row" }}>
                  {!isUser && (
                    <Box sx={{ width: 30, height: 30, borderRadius: "9px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentHover})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.3 }}>
                      <Box component="i" className="ti ti-robot" sx={{ fontSize: 14, color: "#fff" }} />
                    </Box>
                  )}
                  <Box sx={{ position: "relative", "&:hover .copy-btn": { opacity: 1 } }}>
                    <Box sx={{
                      px: 2, py: 1.25,
                      borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      bgcolor: isUser ? C.accent : msg.success ? "rgba(34,197,94,.08)" : "#fff",
                      border: !isUser ? `1px solid ${msg.success ? "rgba(34,197,94,.25)" : C.border}` : "none",
                      boxShadow: C.shadow,
                      maxWidth: 480,
                    }}>
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: 1.65, whiteSpace: "pre-wrap", color: isUser ? "#fff" : msg.success ? "#16a34a" : C.textPrimary }}>
                        {msg.text}
                      </Typography>
                    </Box>
                    {!isUser && (
                      <Tooltip title={copiedIdx === i ? "Copié !" : "Copier"}>
                        <Box
                          className="copy-btn"
                          onClick={() => copyMsg(msg.text, i)}
                          sx={{ position: "absolute", top: 6, right: -32, width: 24, height: 24, borderRadius: "7px", bgcolor: "#fff", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0, transition: "all 0.15s", "&:hover": { bgcolor: C.accentLight, borderColor: C.accent } }}
                        >
                          <Box component="i" className={copiedIdx === i ? "ti ti-check" : "ti ti-copy"} sx={{ fontSize: 12, color: copiedIdx === i ? C.success : C.textMuted }} />
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Ticket preview card */}
                {msg.card && (
                  <Box sx={{ ml: 5.5, p: 2, bgcolor: "#fff", border: `1px solid ${C.border}`, borderRadius: "12px", minWidth: 280, maxWidth: 400 }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.2 }}>
                      Aperçu du ticket
                    </Typography>
                    {msg.card.title && (
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: C.textPrimary, mb: 0.5 }}>{msg.card.title}</Typography>
                    )}
                    {msg.card.description && (
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: C.textSecondary, lineHeight: 1.5, mb: 1 }}>{msg.card.description}</Typography>
                    )}
                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                      {msg.card.priority && (
                        <Chip size="small" label={msg.card.priority}
                          sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: pColors[msg.card.priority].bg, color: pColors[msg.card.priority].text, border: `1px solid ${pColors[msg.card.priority].border}` }} />
                      )}
                      {msg.card.category && (
                        <Chip size="small" label={msg.card.category}
                          sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: C.accentLight, color: C.accent, border: `1px solid ${C.accentMid}` }} />
                      )}
                    </Box>
                  </Box>
                )}

                {/* Chips */}
                {msg.chips && msg.chips.length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", ml: !isUser ? 5.5 : 0, opacity: chipsActive ? 1 : 0.4, pointerEvents: chipsActive ? "auto" : "none" }}>
                    {msg.chips.map((chip, ci) => (
                      <Box
                        key={ci}
                        onClick={() => chipsActive && handleChip(chip)}
                        sx={{ cursor: chipsActive ? "pointer" : "default", px: 1.5, py: "5px", borderRadius: "20px", border: `1.5px solid ${chip.borderColor || C.border}`, bgcolor: chip.bgcolor || "#fff", color: chip.textColor || C.textPrimary, fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, userSelect: "none", transition: "all 0.15s", "&:hover": chipsActive ? { filter: "brightness(0.93)", transform: "translateY(-1px)" } : {} }}
                      >
                        {chip.label}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            );
          })}

          {loading && (
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, alignSelf: "flex-start" }}>
              <Box sx={{ width: 30, height: 30, borderRadius: "9px", background: `linear-gradient(135deg, ${C.accent}, ${C.accentHover})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Box component="i" className="ti ti-robot" sx={{ fontSize: 14, color: "#fff" }} />
              </Box>
              <Box sx={{ px: 2, py: 1.25, borderRadius: "16px 16px 16px 4px", bgcolor: "#fff", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={12} sx={{ color: C.accent }} />
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: C.textMuted }}>En train de réfléchir…</Typography>
              </Box>
            </Box>
          )}
          <div ref={bottomRef} />
        </Box>

        {/* Input */}
        <Box sx={{ px: 3, py: 2, bgcolor: "#fff", borderTop: `1px solid ${C.border}` }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end", maxWidth: 700, mx: "auto" }}>
            <TextField
              multiline maxRows={5} fullWidth size="small"
              placeholder={mode === "ticket" ? "Décrivez votre problème en détail…" : "Posez votre question ou décrivez votre besoin…"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", fontFamily: "Inter, sans-serif", fontSize: "14px", bgcolor: C.bgPage, "& fieldset": { borderColor: C.border }, "&:hover fieldset": { borderColor: C.accent + "80" }, "&.Mui-focused fieldset": { borderColor: C.accent } } }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!input.trim() || loading}
              sx={{ bgcolor: C.accent, color: "#fff", width: 44, height: 44, borderRadius: "12px", flexShrink: 0, "&:hover": { bgcolor: C.accentHover }, "&.Mui-disabled": { bgcolor: C.border, color: C.textMuted }, transition: "all 0.15s" }}
            >
              <Box component="i" className="ti ti-send" sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: C.textMuted, textAlign: "center", mt: 1 }}>
            Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne
          </Typography>
        </Box>
      </Box>

      {/* ── RIGHT PANEL: KB suggestions ── */}
      {kbResults.length > 0 && (
        <Box sx={{ width: 260, bgcolor: "#fff", borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, borderBottom: `1px solid ${C.border}` }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Box component="i" className="ti ti-sparkles" sx={{ fontSize: 15, color: C.accent }} />
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: C.textPrimary }}>Articles suggérés</Typography>
            </Box>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.textMuted }}>
              Solutions potentielles de la base de connaissances
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {kbResults.map(article => (
              <Box
                key={article._id}
                onClick={() => navigate(`/knowledge-base/${article._id}`)}
                sx={{ p: 1.5, borderRadius: "10px", border: `1px solid ${C.border}`, cursor: "pointer", "&:hover": { borderColor: CAT_COLORS[article.category] ?? C.accent, bgcolor: C.bgPage }, transition: "all 0.15s" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: CAT_COLORS[article.category] ?? C.accent, flexShrink: 0 }} />
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: CAT_COLORS[article.category] ?? C.accent, fontWeight: 700, textTransform: "capitalize" }}>{article.category}</Typography>
                </Box>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: C.textPrimary, lineHeight: 1.4 }}>{article.title}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${C.border}` }}>
            <Box onClick={() => navigate("/knowledge-base")} sx={{ display: "flex", alignItems: "center", gap: 0.8, cursor: "pointer" }}>
              <Box component="i" className="ti ti-books" sx={{ fontSize: 13, color: C.accent }} />
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: C.accent, fontWeight: 600 }}>Voir toute la base de connaissances</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
