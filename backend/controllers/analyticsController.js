// backend/controllers/analyticsController.js
const Ticket = require('../schemas/ticket');
const User = require('../schemas/user');

const getAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 3600000);

    // ── KPIs globaux ──
    const totalTickets = await Ticket.countDocuments({ createdAt: { $gte: startDate } });
    const resolvedTickets = await Ticket.countDocuments({
      createdAt: { $gte: startDate },
      status: { $in: ['resolved', 'closed'] },
    });
    const openTickets = await Ticket.countDocuments({
      createdAt: { $gte: startDate },
      status: 'open',
    });
    const inProgressTickets = await Ticket.countDocuments({
      createdAt: { $gte: startDate },
      status: 'in_progress',
    });

    // ── Temps moyen de résolution (en heures) ──
    const resolvedWithTime = await Ticket.find({
      status: { $in: ['resolved', 'closed'] },
      createdAt: { $gte: startDate },
    }).select('createdAt updatedAt');

    const avgResolutionTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((acc, t) => {
          return acc + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime());
        }, 0) / resolvedWithTime.length / 3600000
      : 0;

    // ── Tickets par jour ──
    const ticketsByDay = await Ticket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          created: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // ── Distribution par statut ──
    const statusDistribution = await Ticket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // ── Distribution par priorité ──
    const priorityDistribution = await Ticket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    // ── Distribution par catégorie ──
    const categoryDistribution = await Ticket.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // ── Performance par technicien ──
    const techs = await User.find({ role: { $in: ['tech', 'admin'] } }).select('name email role');
    const techPerformance = await Promise.all(
      techs.map(async (tech) => {
        const assigned = await Ticket.countDocuments({
          assignedTo: tech._id,
          createdAt: { $gte: startDate },
        });
        const resolved = await Ticket.countDocuments({
          assignedTo: tech._id,
          status: { $in: ['resolved', 'closed'] },
          createdAt: { $gte: startDate },
        });
        const late = await Ticket.countDocuments({
          assignedTo: tech._id,
          status: { $nin: ['resolved', 'closed'] },
          createdAt: { $lt: new Date(Date.now() - 72 * 3600000) },
        });

        const resolvedTicketsForTech = await Ticket.find({
          assignedTo: tech._id,
          status: { $in: ['resolved', 'closed'] },
          createdAt: { $gte: startDate },
        }).select('createdAt updatedAt');

        const avgTime = resolvedTicketsForTech.length > 0
          ? resolvedTicketsForTech.reduce((acc, t) => {
              return acc + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime());
            }, 0) / resolvedTicketsForTech.length / 3600000
          : 0;

        return {
          _id: tech._id,
          name: tech.name,
          email: tech.email,
          role: tech.role,
          assigned,
          resolved,
          late,
          successRate: assigned > 0 ? Math.round((resolved / assigned) * 100) : 0,
          avgResolutionTime: Math.round(avgTime * 10) / 10,
        };
      })
    );

    // Trier par taux de succès
    techPerformance.sort((a, b) => b.successRate - a.successRate);

    res.json({
      kpis: {
        totalTickets,
        resolvedTickets,
        openTickets,
        inProgressTickets,
        resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      },
      ticketsByDay,
      statusDistribution,
      priorityDistribution,
      categoryDistribution,
      techPerformance,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAnalytics };