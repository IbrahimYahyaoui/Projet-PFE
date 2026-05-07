// backend/controllers/historyController.js
const History = require('../schemas/history');

// ── GET historique d'un ticket ──
const getTicketHistory = async (req, res) => {
  try {
    const history = await History.find({ ticketId: req.params.id })
      .populate('userId', 'name role')
      .sort({ createdAt: 1 }); // chronologique
    res.json(history);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getTicketHistory };