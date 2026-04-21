const express = require("express");
const { getAllUsers, createUser, deleteUser } = require("../controllers/userController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes protégées (connexion requise)
router.get("/", verifyToken, getAllUsers);

// Routes admin seulement
router.post("/", verifyToken, verifyAdmin, createUser);
router.delete("/:id", verifyToken, verifyAdmin, deleteUser);

module.exports = router;