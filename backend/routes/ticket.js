const express = require("express");
const {
  getAllTickets,
  getMyTickets,
  getAssignedTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  addComment,
} = require("../controllers/ticketController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes admin seulement
router.get("/all", verifyToken, verifyAdmin, getAllTickets);
router.delete("/:id", verifyToken, verifyAdmin, deleteTicket);

// Routes protégées (connexion requise)
router.get("/my", verifyToken, getMyTickets);
router.get("/assigned", verifyToken, getAssignedTickets);
router.get("/:id", verifyToken, getTicketById);
router.post("/", verifyToken, createTicket);
router.put("/:id", verifyToken, updateTicket);
router.post("/:id/comments", verifyToken, addComment);

module.exports = router;
