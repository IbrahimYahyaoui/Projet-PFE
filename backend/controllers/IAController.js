const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const CompanyContext = require("../schemas/companyContext");

const getModel = () =>
  new ChatGoogleGenerativeAI({
    model: "gemini-3.1-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.3,
  });

// ── Build a readable context string from stored fields ──
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

// ── GET /api/ai/company-context ──
const getCompanyContext = async (req, res) => {
  try {
    const doc = await CompanyContext.findOne();
    res.json({
      fields: doc || {},
      contextString: buildContextString(doc),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load company context" });
  }
};

// ── PUT /api/ai/company-context (admin only) ──
const saveCompanyContext = async (req, res) => {
  const {
    name, industry, description, services,
    supportPolicies, commonIssues, escalationProcess, additionalInstructions,
  } = req.body || {};
  try {
    const doc = await CompanyContext.findOneAndUpdate(
      {},
      {
        name:                   name                   ?? "",
        industry:               industry               ?? "",
        description:            description            ?? "",
        services:               services               ?? "",
        supportPolicies:        supportPolicies        ?? "",
        commonIssues:           commonIssues           ?? "",
        escalationProcess:      escalationProcess      ?? "",
        additionalInstructions: additionalInstructions ?? "",
        updatedBy: req.user.id,
      },
      { upsert: true, returnDocument: "after" }
    );
    res.json({ fields: doc, contextString: buildContextString(doc) });
  } catch (err) {
    res.status(500).json({ error: "Failed to save company context" });
  }
};

// ── POST /api/ai/chat ──
const chat = async (req, res) => {
  const { message, context, rules } = req.body || {};
  if (!message) return res.status(400).json({ error: "message is required" });
  if (!rules)   return res.status(400).json({ error: "rules are required" });

  try {
    const model    = getModel();
    const messages = [];

    if (context) {
      messages.push(new SystemMessage(`${rules}\n\nConversation so far:\n${context}`));
    } else {
      messages.push(new SystemMessage(rules));
    }
    messages.push(new HumanMessage(message));

    const response = await model.invoke(messages);
    const newContext = (context ? context + "\n" : "") +
      `User: ${message}\nAI: ${response.content}`;

    res.json({ reply: response.content, context: newContext });
  } catch (err) {
    console.error("AI chat error:", err.message);
    res.status(500).json({ error: "AI request failed", details: err.message });
  }
};

// ── POST /api/ai/extract-ticket ──
// Called ONCE with the user's first message. Returns whatever fields can be extracted.
// The frontend handles the rest with a local state machine — no AI loop.
const extractTicket = async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "message is required" });

  const systemPrompt = `Extract support ticket information from the user message.
Return ONLY a JSON object — no markdown, no explanation.

{
  "title":       string | null,
  "description": string | null,
  "priority":    "low"|"medium"|"high"|"critical"|null,
  "category":    "hardware"|"software"|"network"|"access"|"other"|null
}

Rules:
- title: short (≤10 words) summary of the issue, or null if unclear
- description: the problem in the user's own words (can be the full message), or null
- priority inference: urgent/blocked/cannot work/asap/production down → "critical"; broken/error/not working/important → "high"; slow/minor/inconvenient → "low"; unclear → null
- category inference: printer/keyboard/mouse/monitor/laptop/hardware → "hardware"; app/software/install/update/crash/program → "software"; internet/wifi/vpn/network/email/connection → "network"; login/password/access/permission/account → "access"; other clear tech issue → "other"; unclear → null
- Only extract what is explicitly stated or strongly implied. Return null for anything uncertain.`;

  try {
    const model    = getModel();
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(message),
    ]);

    const content   = response.content.toString().trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");

    const parsed = JSON.parse(jsonMatch[0]);
    // Return only non-null fields
    const result = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v !== null && v !== undefined && v !== "") result[k] = v;
    }
    res.json(result);
  } catch (err) {
    console.error("Extract ticket error:", err.message);
    res.status(500).json({ error: "Extraction failed", details: err.message });
  }
};

// ── POST /api/ai/translate ──
const translateText = async (req, res) => {
  const { text, targetLanguage } = req.body || {};
  if (!text || !targetLanguage)
    return res.status(400).json({ error: "text and targetLanguage are required" });

  try {
    const model    = getModel();
    const response = await model.invoke([
      new SystemMessage(`You are a professional translator. Translate the given text to ${targetLanguage}. Return only the translated text, no explanations.`),
      new HumanMessage(text),
    ]);
    res.json({ translatedText: response.content, targetLanguage });
  } catch (err) {
    console.error("Translation error:", err.message);
    res.status(500).json({ error: "Translation failed", details: err.message });
  }
};

module.exports = { getCompanyContext, saveCompanyContext, chat, extractTicket, translateText };
