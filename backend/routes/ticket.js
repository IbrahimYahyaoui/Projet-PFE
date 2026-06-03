// backend/routes/ticket.js
const express = require('express');
const {
  getAllTickets,
  getAdminQueue,
  getSlaAlerts,
  getMyTickets,
  getAssignedTickets,
  getTeamTickets,
  getTicketById,
  createTicket,
  assignToTeam,
  assignTicket,
  updateTicket,
  escalateTicket,
  deleteTicket,
  addComment,
} = require('../controllers/ticketController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// List endpoints
router.get('/all',           verifyToken, getAllTickets);
router.get('/admin-queue',   verifyToken, getAdminQueue);
router.get('/sla-alerts',    verifyToken, getSlaAlerts);
router.get('/my',            verifyToken, getMyTickets);
router.get('/assigned',      verifyToken, getAssignedTickets);
router.get('/team',          verifyToken, getTeamTickets);

// Single ticket
router.get('/:id',           verifyToken, getTicketById);

// Mutations
router.post('/',             verifyToken, createTicket);
router.put('/:id/assign-team', verifyToken, assignToTeam);
router.put('/:id/assign',    verifyToken, assignTicket);
router.put('/:id/escalate',  verifyToken, escalateTicket);
router.put('/:id',           verifyToken, updateTicket);
router.delete('/:id',        verifyToken, deleteTicket);
router.post('/:id/comment',  verifyToken, addComment);

module.exports = router;
