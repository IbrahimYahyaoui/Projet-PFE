// backend/controllers/historyController.js
const History = require('../schemas/history');
const Ticket  = require('../schemas/ticket');
const Team    = require('../schemas/team');

// ── GET historique d'un ticket ──
// CORRECTION — même contrôle d'accès que getTicketById (ticketController.js)
const getTicketHistory = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const { role, id: userId } = req.user;

    if (role !== 'admin') {
      let hasAccess = false;

      if (role === 'user') {
        hasAccess = ticket.createdBy?.toString() === userId;
      } else if (role === 'tech') {
        hasAccess = ticket.assignedTo?.toString() === userId;
        if (!hasAccess && ticket.teamId) {
          const team = await Team.findOne({ _id: ticket.teamId, $or: [{ leaderId: userId }, { members: userId }] });
          hasAccess = !!team;
        }
      } else if (role === 'leader') {
        if (ticket.teamId) {
          const team = await Team.findOne({ _id: ticket.teamId, $or: [{ leaderId: userId }, { members: userId }] });
          hasAccess = !!team;
        }
      }

      if (!hasAccess) return res.status(403).json({ message: "Accès refusé à ce ticket" });
    }

    const history = await History.find({ ticketId: req.params.id })
      .populate('userId', 'name role avatar')
      .sort({ createdAt: 1 }); // chronologique
    res.json(history);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getTicketHistory };