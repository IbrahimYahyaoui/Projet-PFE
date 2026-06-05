const express = require("express");
const { login } = require("../controllers/authController");

const router = express.Router();

// ── Route POST /api/auth/login ──
router.post("/login", login);

// /register is disabled — user creation is admin-only via /api/users

module.exports = router;
