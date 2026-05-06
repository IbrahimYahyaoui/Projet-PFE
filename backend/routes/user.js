const express = require("express");
const { getAllUsers, getMe, updateUser, createUser, deleteUser } = require("../controllers/userController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// ── Mon profil ──
router.get("/me", verifyToken, getMe);

// ── Tous les users (connecté) ──
router.get("/", verifyToken, getAllUsers);

// ── Admin seulement ──
router.post("/", verifyToken, verifyAdmin, createUser);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, verifyAdmin, deleteUser);

module.exports = router;