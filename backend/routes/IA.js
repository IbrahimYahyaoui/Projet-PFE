const express = require("express");
const {
  getCompanyContext,
  saveCompanyContext,
  chat,
  extractTicket,
  translateText,
} = require("../controllers/IAController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Company context — all authenticated users can read, only admin can write
router.get("/company-context",  verifyToken,              getCompanyContext);
router.put("/company-context",  verifyToken, verifyAdmin, saveCompanyContext);

// AI chat
router.post("/chat",           chat);
router.post("/extract-ticket", extractTicket);
router.post("/translate",      translateText);

module.exports = router;
