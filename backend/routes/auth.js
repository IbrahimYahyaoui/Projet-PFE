const express = require("express");
const { login, register } = require("../controllers/authController");

const router = express.Router();

// ── Route POST /api/auth/login ──
router.post("/login", login);

// ── Route POST /api/auth/register ──
router.post("/register", register);

module.exports = router;
