// backend/routes/IA.js
const express = require("express");
const {
  getCompanyContext,
  saveCompanyContext,
  chat,
  extractTicket,
  translateText,
  suggestTroubleshooting,
  generateProjectSummary,
  searchKnowledge,
} = require("../controllers/IAController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Company context
router.get("/company-context",  verifyToken,              getCompanyContext);
router.put("/company-context",  verifyToken, verifyAdmin, saveCompanyContext);

// AI chat — all authenticated
router.post("/chat",            verifyToken, chat);
router.post("/extract-ticket",  verifyToken, extractTicket);
router.post("/translate",       verifyToken, translateText);
router.post("/troubleshoot",    verifyToken, suggestTroubleshooting);
router.post("/project-summary", verifyToken, generateProjectSummary);
router.post("/search-knowledge",verifyToken, searchKnowledge);

module.exports = router;
