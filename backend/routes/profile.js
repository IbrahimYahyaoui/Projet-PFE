const express = require("express");
const { getProfile, updateProfile, changePassword } = require("../controllers/profileController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Toutes les routes profile nécessitent d'être connecté
router.get("/:id", verifyToken, getProfile);
router.put("/:id", verifyToken, updateProfile);
router.put("/:id/password", verifyToken, changePassword);

module.exports = router;