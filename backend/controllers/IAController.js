// backend/controllers/IAController.js
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const CompanyContext  = require("../schemas/companyContext");
const KnowledgeBase   = require("../schemas/knowledgeBase");
const Project         = require("../schemas/project");
const ProjectTask     = require("../schemas/projectTask");

const getModel = () =>
  new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.3,
  });

// ── Build company context string ──
const buildContextString = (doc) => {
  if (!doc) return "";
  const parts = [];
  if (doc.name)                   parts.push(`Company: ${doc.name}`);
  if (doc.industry)               parts.push(`Industry: ${doc.industry}`);
  if (doc.description)            parts.push(`About: ${doc.description}`);
  if (doc.services)               parts.push(`Products/Services: ${doc.services}`);
  if (doc.supportPolicies)        parts.push(`Support policies: ${doc.supportPolicies}`);
  if (doc.commonIssues)           parts.push(`Common issues & resolutions: ${doc.commonIssues}`);
  if (doc.escalationProcess)      parts.push(`Escalation process: ${doc.escalationProcess}`);
  if (doc.additionalInstructions) parts.push(`Additional instructions: ${doc.additionalInstructions}`);
  return parts.join("\n");
};

// ── Role-specific tone instructions ──
const getRoleTone = (role) => {
  switch (role) {
    case 'admin':
      return 'You are speaking with a platform Administrator. Provide strategic, complete, and detailed information. Include technical details, metrics, and management options.';
    case 'leader':
      return 'You are speaking with a Team Leader. Focus on team management, ticket routing, workload balancing, and escalation guidance.';
    case 'tech':
      return 'You are speaking with a Technician. Provide clear step-by-step troubleshooting, technical solutions, and diagnostic approaches.';
    default:
      return 'You are speaking with an Employee. Use simple, friendly language. Avoid technical jargon. Guide them through the process step by step.';
  }
};

// ── GET /api/ai/company-context ──
const getCompanyContext = async (req, res) => {
  try {
    const doc = await CompanyContext.findOne();
    res.json({ fields: doc || {}, contextString: buildContextString(doc) });
  } catch {
    res.status(500).json({ error: "Failed to load company context" });
  }
};

// ── PUT /api/ai/company-context (admin only) ──
const saveCompanyContext = async (req, res) => {
  const { name, industry, description, services, supportPolicies, commonIssues, escalationProcess, additionalInstructions } = req.body || {};
  try {
    const doc = await CompanyContext.findOneAndUpdate(
      {},
      { name: name ?? "", industry: industry ?? "", description: description ?? "", services: services ?? "", supportPolicies: supportPolicies ?? "", commonIssues: commonIssues ?? "", escalationProcess: escalationProcess ?? "", additionalInstructions: additionalInstructions ?? "", updatedBy: req.user.id },
      { upsert: true, returnDocument: "after" }
    );
    res.json({ fields: doc, contextString: buildContextString(doc) });
  } catch {
    res.status(500).json({ error: "Failed to save company context" });
  }
};

// ── POST /api/ai/chat ──
const chat = async (req, res) => {
  const { message, context, rules, userContext } = req.body || {};
  if (!message) return res.status(400).json({ error: "message is required" });

  try {
    const companyDoc = await CompanyContext.findOne();
    const companyStr = buildContextString(companyDoc);
    const roleTone   = getRoleTone(userContext?.role ?? req.user?.role ?? 'user');

    const systemParts = [
      "You are the TuskFlow AI Support Assistant — an enterprise IT support platform.",
      roleTone,
      companyStr ? `\n[Company Context]\n${companyStr}` : '',
      rules ? `\n[Additional Rules]\n${rules}` : '',
      context ? `\n[Conversation so far]\n${context}` : '',
      userContext?.currentPage ? `\nUser is currently on: ${userContext.currentPage}` : '',
      userContext?.teamName    ? `\nUser's team: ${userContext.teamName}` : '',
    ].filter(Boolean).join('\n');

    const model    = getModel();
    const response = await model.invoke([new SystemMessage(systemParts), new HumanMessage(message)]);
    const newContext = (context ? context + "\n" : "") + `User: ${message}\nAI: ${response.content}`;

    res.json({ reply: response.content, context: newContext });
  } catch (err) {
    console.error("AI chat error:", err.message);
    res.status(500).json({ error: "AI request failed", details: err.message });
  }
};

// ── POST /api/ai/extract-ticket ──
const extractTicket = async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "message is required" });

  // Search knowledge base for related articles first
  let suggestedArticles = [];
  try {
    suggestedArticles = await KnowledgeBase.find(
      { $text: { $search: message } },
      { score: { $meta: 'textScore' }, title: 1, category: 1, _id: 1 }
    ).sort({ score: { $meta: 'textScore' } }).limit(3);
  } catch {
    // text index may not exist yet — safe to ignore
  }

  const systemPrompt = `Extract support ticket information from the user message.
Return ONLY a JSON object — no markdown, no explanation.

{
  "title":       string | null,
  "description": string | null,
  "priority":    "low"|"medium"|"high"|"critical"|null,
  "category":    "hardware"|"software"|"network"|"access"|"other"|null
}

Rules:
- title: short (≤10 words) summary, or null if unclear
- description: the problem in the user's own words, or null
- priority: urgent/blocked/cannot work/production down → "critical"; broken/error → "high"; slow/minor → "low"; unclear → null
- category: printer/keyboard/mouse/hardware → "hardware"; app/software/crash → "software"; internet/wifi/vpn/network → "network"; login/password/access → "access"; other → "other"; unclear → null
- Only extract what is stated or strongly implied. Return null for anything uncertain.`;

  try {
    const model    = getModel();
    const response = await model.invoke([new SystemMessage(systemPrompt), new HumanMessage(message)]);
    const content  = response.content.toString().trim();
    const match    = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in AI response");

    const parsed = JSON.parse(match[0]);
    const result = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v !== null && v !== undefined && v !== "") result[k] = v;
    }

    res.json({ ...result, suggestedArticles });
  } catch (err) {
    console.error("Extract ticket error:", err.message);
    res.status(500).json({ error: "Extraction failed", details: err.message });
  }
};

// ── POST /api/ai/translate ──
const translateText = async (req, res) => {
  const { text, targetLanguage } = req.body || {};
  if (!text || !targetLanguage) return res.status(400).json({ error: "text and targetLanguage are required" });

  try {
    const model    = getModel();
    const response = await model.invoke([
      new SystemMessage(`You are a professional translator. Translate the text to ${targetLanguage}. Return only the translated text.`),
      new HumanMessage(text),
    ]);
    res.json({ translatedText: response.content, targetLanguage });
  } catch (err) {
    res.status(500).json({ error: "Translation failed", details: err.message });
  }
};

// ── POST /api/ai/troubleshoot ──
const suggestTroubleshooting = async (req, res) => {
  const { ticketDescription, category } = req.body || {};
  if (!ticketDescription) return res.status(400).json({ error: "ticketDescription is required" });

  const systemPrompt = `You are an expert IT support engineer. A technician needs troubleshooting help.
Category: ${category || 'general'}
Provide a structured troubleshooting guide with:
1. Most likely root causes (top 3)
2. Step-by-step diagnostic steps
3. Recommended solutions
4. When to escalate

Be concise and practical. Use numbered steps. Focus on actionable advice.`;

  try {
    const model    = getModel();
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Ticket: ${ticketDescription}`),
    ]);
    res.json({ guide: response.content });
  } catch (err) {
    res.status(500).json({ error: "Troubleshoot failed", details: err.message });
  }
};

// ── POST /api/ai/project-summary ──
const generateProjectSummary = async (req, res) => {
  const { projectId } = req.body || {};
  if (!projectId) return res.status(400).json({ error: "projectId is required" });

  try {
    const project = await Project.findById(projectId).populate('managerId', 'name').populate('members', 'name');
    if (!project) return res.status(404).json({ error: "Project not found" });

    const tasks     = await ProjectTask.find({ projectId });
    const done      = tasks.filter(t => t.status === 'done').length;
    const overdue   = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    const inProg    = tasks.filter(t => t.status === 'in_progress').length;

    const projectData = `
Project: ${project.name}
Status: ${project.status}
Priority: ${project.priority}
Progress: ${done}/${tasks.length} tasks done
In progress: ${inProg}, Overdue: ${overdue}
Manager: ${project.managerId?.name ?? 'N/A'}
Team size: ${project.members?.length ?? 0}
Description: ${project.description}
    `.trim();

    const model    = getModel();
    const response = await model.invoke([
      new SystemMessage("You are a project management assistant. Generate a concise executive summary and risk assessment for this project. Include: current status, key risks, and recommended next actions. Keep it under 200 words."),
      new HumanMessage(projectData),
    ]);
    res.json({ summary: response.content, stats: { total: tasks.length, done, inProg, overdue } });
  } catch (err) {
    res.status(500).json({ error: "Summary failed", details: err.message });
  }
};

// ── POST /api/ai/search-knowledge ──
const searchKnowledge = async (req, res) => {
  const { query } = req.body || {};
  if (!query?.trim()) return res.json({ articles: [] });

  try {
    // Try MongoDB text search first
    let articles = [];
    try {
      articles = await KnowledgeBase.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' }, title: 1, content: 1, category: 1, _id: 1 }
      ).sort({ score: { $meta: 'textScore' } }).limit(5);
    } catch {
      // fallback regex search
      articles = await KnowledgeBase.find({
        $or: [
          { title:   { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
        ],
      }).limit(5).select('title category _id');
    }
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: "Knowledge search failed", details: err.message });
  }
};

module.exports = {
  getCompanyContext,
  saveCompanyContext,
  chat,
  extractTicket,
  translateText,
  suggestTroubleshooting,
  generateProjectSummary,
  searchKnowledge,
};
