const { GoogleGenerativeAI } = require("@google/generative-ai");
const CompanyContext = require("../schemas/companyContext");
const KnowledgeBase  = require("../schemas/knowledgeBase");
const Project        = require("../schemas/project");
const ProjectTask    = require("../schemas/projectTask");

const getModel = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

const buildContextString = (doc) => {
  if (!doc) return "";
  const trim = (s) => s ? s.slice(0, 300) : "";
  const parts = [];
  if (doc.name)                   parts.push(`Company: ${trim(doc.name)}`);
  if (doc.industry)               parts.push(`Industry: ${trim(doc.industry)}`);
  if (doc.description)            parts.push(`About: ${trim(doc.description)}`);
  if (doc.services)               parts.push(`Services: ${trim(doc.services)}`);
  if (doc.supportPolicies)        parts.push(`Support: ${trim(doc.supportPolicies)}`);
  if (doc.commonIssues)           parts.push(`Common issues: ${trim(doc.commonIssues)}`);
  if (doc.escalationProcess)      parts.push(`Escalation: ${trim(doc.escalationProcess)}`);
  if (doc.additionalInstructions) parts.push(`Instructions: ${trim(doc.additionalInstructions)}`);
  return parts.join("\n");
};

const getRoleTone = (role) => {
  const base = {
    admin: `Tu es TuskFlow AI. Tu parles avec l'Administrateur.
Règles STRICTES :
- Réponds TOUJOURS en français
- Sois COURT et DIRECT (maximum 5 lignes)
- Si on dit bonjour → réponds juste bonjour et demande comment tu peux aider
- Si on pose une question → réponds uniquement à cette question avec les données disponibles
- N'invente JAMAIS de données
- Ne fais jamais de longs rapports non demandés`,

    leader: `Tu es TuskFlow AI. Tu parles avec un Team Leader.
Règles STRICTES :
- Réponds TOUJOURS en français
- Sois COURT et DIRECT (maximum 5 lignes)
- Si on dit bonjour → réponds juste bonjour et demande comment tu peux aider
- Si on pose une question → réponds uniquement à cette question
- N'invente JAMAIS de données`,

    tech: `Tu es TuskFlow AI. Tu parles avec un Technicien.
Règles STRICTES :
- Réponds TOUJOURS en français
- Sois COURT et DIRECT (maximum 5 lignes)
- Si on dit bonjour → réponds juste bonjour et demande comment tu peux aider
- Le technicien NE crée PAS de tickets
- Aide uniquement avec le dépannage technique`,

    user: `Tu es TuskFlow AI. Tu parles avec un Employé.
Règles STRICTES :
- Réponds TOUJOURS en français
- Sois COURT et DIRECT (maximum 5 lignes)
- Si on dit bonjour → réponds juste bonjour et demande comment tu peux aider
- Pose des questions pour comprendre le problème
- Si aucune solution → propose de créer un ticket`,
  };
  return base[role] ?? base.user;
};

async function buildLiveContext(userId, role) {
  const lines = [];
  try {
    const Ticket = require('../schemas/ticket');
    if (role === 'admin') {
      const [total, open, breached] = await Promise.all([
        Ticket.countDocuments({}),
        Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
        Ticket.countDocuments({ slaBreached: true }),
      ]);
      lines.push(`[Stats] Total:${total} | Actifs:${open} | SLA dépassés:${breached}`);
      const unassigned = await Ticket.find(
        { teamId: null, status: { $nin: ['resolved','closed'] } },
        'title priority createdAt'
      ).limit(5).lean();
      if (unassigned.length) {
        lines.push(`Tickets sans équipe (${unassigned.length}) :`);
        unassigned.forEach(t => lines.push(`- ${t.title.slice(0,50)} | ${t.priority}`));
      } else {
        lines.push(`Tickets sans équipe : aucun`);
      }
    } else if (role === 'leader') {
      const Team = require('../schemas/team');
      const team = await Team.findOne({ $or: [{ leaderId: userId }, { members: userId }] }).select('name _id');
      if (team) {
        const [open, breached] = await Promise.all([
          Ticket.countDocuments({ teamId: team._id, status: { $in: ['open','in_progress'] } }),
          Ticket.countDocuments({ teamId: team._id, slaBreached: true }),
        ]);
        lines.push(`[Équipe: ${team.name}] Actifs:${open} | SLA:${breached}`);
      }
    } else if (role === 'tech') {
      const tickets = await Ticket.find({ assignedTo: userId, status: { $nin: ['resolved','closed'] } }, 'title priority slaBreached').limit(3).lean();
      if (tickets.length) tickets.forEach(t => lines.push(`- ${t.title.slice(0,50)} | ${t.priority}${t.slaBreached ? ' ⚠️' : ''}`));
    } else {
      const tickets = await Ticket.find({ createdBy: userId, status: { $nin: ['closed'] } }, 'title status').limit(3).lean();
      if (tickets.length) tickets.forEach(t => lines.push(`- ${t.title.slice(0,50)} | ${t.status}`));
    }
  } catch (e) { /* silently fail */ }
  return lines.join('\n').slice(0, 500);
}

const getCompanyContext = async (req, res) => {
  try {
    const doc = await CompanyContext.findOne();
    res.json({ fields: doc || {}, contextString: buildContextString(doc) });
  } catch {
    res.status(500).json({ error: "Failed to load company context" });
  }
};

const saveCompanyContext = async (req, res) => {
  const { name, industry, description, services, supportPolicies, commonIssues, escalationProcess, additionalInstructions } = req.body || {};
  try {
    const doc = await CompanyContext.findOneAndUpdate(
      {},
      { name: name ?? "", industry: industry ?? "", description: description ?? "", services: services ?? "", supportPolicies: supportPolicies ?? "", commonIssues: commonIssues ?? "", escalationProcess: escalationProcess ?? "", additionalInstructions: additionalInstructions ?? "" },
      { upsert: true, new: true }
    );
    res.json({ fields: doc, contextString: buildContextString(doc) });
  } catch {
    res.status(500).json({ error: "Failed to save company context" });
  }
};

const chat = async (req, res) => {
  const { message, context, userContext } = req.body || {};
  if (!message) return res.status(400).json({ error: "message is required" });
  try {
    const companyDoc = await CompanyContext.findOne();
    const companyStr = buildContextString(companyDoc);
    const roleTone   = getRoleTone(userContext?.role ?? req.user?.role ?? 'user');
    const liveCtx    = await buildLiveContext(req.user.id, userContext?.role ?? req.user?.role ?? 'user');

    const systemPrompt = [
      roleTone,
      companyStr ? `Contexte entreprise: ${companyStr}` : '',
      liveCtx    ? `Données: ${liveCtx}` : '',
    ].filter(Boolean).join('\n').slice(0, 1000);

    const fullMessage = `${systemPrompt}

DONNÉES RÉELLES DE LA PLATEFORME (utilise UNIQUEMENT ces données, n'invente rien) :
${liveCtx || "Aucune donnée disponible"}

RÈGLE IMPORTANTE : Tu as accès aux données ci-dessus. Ne dis JAMAIS que tu n'as pas accès aux données. Utilise uniquement les chiffres fournis. Si une donnée n'est pas dans le contexte, dis "Je n'ai pas cette information précise" mais n'invente jamais.

Question de l'utilisateur : ${message}`;

    const model  = getModel();
    const result = await model.generateContent(fullMessage);
    const reply  = result.response.text();
    const newContext = (context ? context + "\n" : "") + `User: ${message}\nAI: ${reply}`;

    res.json({ reply, context: newContext });
  } catch (err) {
    console.error("AI chat error:", err.message);
    res.status(500).json({ error: "AI request failed", details: err.message });
  }
};

const extractTicket = async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "message is required" });
  try {
    const model  = getModel();
    const prompt = `Extract support ticket info from this message. Return ONLY JSON with fields: title, description, priority (low/medium/high/critical), category (hardware/software/network/access/other). Message: "${message}"`;
    const result = await model.generateContent(prompt);
    const text   = result.response.text().replace(/```json|```/g, '').trim();
    const data   = JSON.parse(text);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Extraction failed", details: err.message });
  }
};

const translateText = async (req, res) => {
  const { text, targetLanguage } = req.body || {};
  if (!text) return res.status(400).json({ error: "text is required" });
  try {
    const model  = getModel();
    const result = await model.generateContent(`Translate to ${targetLanguage || 'French'}: "${text}"`);
    res.json({ translation: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: "Translation failed" });
  }
};

const suggestTroubleshooting = async (req, res) => {
  const { issue } = req.body || {};
  if (!issue) return res.status(400).json({ error: "issue is required" });
  try {
    const model  = getModel();
    const result = await model.generateContent(`Provide 3-5 troubleshooting steps in French for: "${issue}"`);
    res.json({ suggestions: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: "Troubleshooting failed" });
  }
};

const generateProjectSummary = async (req, res) => {
  const { projectId } = req.body || {};
  if (!projectId) return res.status(400).json({ error: "projectId is required" });
  try {
    const project = await Project.findById(projectId).populate('members', 'name').lean();
    if (!project) return res.status(404).json({ error: "Project not found" });
    const tasks   = await ProjectTask.find({ projectId }).lean();
    const done    = tasks.filter(t => t.status === 'done').length;
    const prompt  = `Summarize this project in French in 3 sentences: Name: ${project.name}, Progress: ${done}/${tasks.length} tasks done, Status: ${project.status}`;
    const model   = getModel();
    const result  = await model.generateContent(prompt);
    res.json({ summary: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: "Summary failed" });
  }
};

const searchKnowledge = async (req, res) => {
  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: "query is required" });
  try {
    const articles = await KnowledgeBase.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' }, title: 1, category: 1, _id: 1 }
    ).sort({ score: { $meta: 'textScore' } }).limit(3);
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
};

module.exports = {
  getCompanyContext, saveCompanyContext, chat, extractTicket,
  translateText, suggestTroubleshooting, generateProjectSummary, searchKnowledge,
};
