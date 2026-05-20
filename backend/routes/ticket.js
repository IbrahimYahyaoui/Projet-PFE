// backend/routes/ticket.js
const express = require('express');
const {
  getAllTickets,
  getMyTickets,
  getAssignedTickets,
  getTeamTickets,
  getTicketById,
  createTicket,
  assignTicket,
  updateTicket,
  deleteTicket,
  addComment,
} = require('../controllers/ticketController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/all',          verifyToken, getAllTickets);
router.get('/my',           verifyToken, getMyTickets);
router.get('/assigned',     verifyToken, getAssignedTickets);
router.get('/team',         verifyToken, getTeamTickets);
router.get('/:id',          verifyToken, getTicketById);
router.post('/',            verifyToken, createTicket);
router.put('/:id/assign',   verifyToken, assignTicket);
router.put('/:id',          verifyToken, updateTicket);
router.delete('/:id',       verifyToken, deleteTicket);
router.post('/:id/comment', verifyToken, addComment);

module.exports = router;