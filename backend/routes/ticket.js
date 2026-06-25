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
const Ticket = require('../schemas/ticket');
const Team = require('../schemas/team');

// Middleware : leader de l'équipe assignée au ticket, ou admin
const verifyTeamLeaderOfTicket = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!ticket.teamId) return res.status(400).json({ message: 'Ticket non assigné à une équipe' });
    const team = await Team.findById(ticket.teamId);
    const isLeader = team?.leaderId?.toString() === req.user.id;
    if (req.user.role !== 'leader' || !isLeader) {
      return res.status(403).json({ message: "Seul le leader de l'équipe assignée à ce ticket peut faire cela" });
    }
    next();
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

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
router.put('/:id/assign',    verifyToken, verifyTeamLeaderOfTicket, assignTicket);
router.put('/:id/escalate',  verifyToken, verifyTeamLeaderOfTicket, escalateTicket);
router.put('/:id',           verifyToken, updateTicket);
router.delete('/:id',        verifyToken, deleteTicket);
router.post('/:id/comment',  verifyToken, addComment);

module.exports = router;
