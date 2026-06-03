// backend/controllers/analyticsController.js
const Ticket      = require('../schemas/ticket');
const User        = require('../schemas/user');
const Project     = require('../schemas/project');
const ProjectTask = require('../schemas/projectTask');

const getAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days      = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 3600000);

    const [
      totalTickets,
      resolvedTickets,
      openTickets,
      inProgressTickets,
      waitingTickets,
      slaBreachedCount,
      escalatedCount,
      resolvedWithTime,
      ticketsByDay,
      statusDistribution,
      priorityDistribution,
      categoryDistribution,
      techs,
    ] = await Promise.all([
      Ticket.countDocuments({ createdAt: { $gte: startDate } }),
      Ticket.countDocuments({ createdAt: { $gte: startDate }, status: { $in: ['resolved', 'closed'] } }),
      Ticket.countDocuments({ createdAt: { $gte: startDate }, status: 'open' }),
      Ticket.countDocuments({ createdAt: { $gte: startDate }, status: 'in_progress' }),
      Ticket.countDocuments({ createdAt: { $gte: startDate }, status: 'waiting' }),
      Ticket.countDocuments({ createdAt: { $gte: startDate }, slaBreached: true }),
      Ticket.countDocuments({ createdAt: { $gte: startDate }, escalationLevel: { $gt: 0 } }),
      Ticket.find({ status: { $in: ['resolved', 'closed'] }, createdAt: { $gte: startDate } }).select('createdAt updatedAt'),
      Ticket.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, created: { $sum: 1 }, resolved: { $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] } } } },
        { $sort: { _id: 1 } },
      ]),
      Ticket.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.find({ role: { $in: ['tech', 'leader'] } }).select('name email role'),
    ]);

    const avgResolutionTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((acc, t) => acc + (new Date(t.updatedAt) - new Date(t.createdAt)), 0)
        / resolvedWithTime.length / 3600000
      : 0;

    // Tech performance
    const techPerformance = await Promise.all(
      techs.map(async (tech) => {
        const [assigned, resolved, active, resolvedList] = await Promise.all([
          Ticket.countDocuments({ assignedTo: tech._id, createdAt: { $gte: startDate } }),
          Ticket.countDocuments({ assignedTo: tech._id, status: { $in: ['resolved', 'closed'] }, createdAt: { $gte: startDate } }),
          Ticket.countDocuments({ assignedTo: tech._id, status: { $in: ['assigned', 'in_progress', 'waiting'] } }),
          Ticket.find({ assignedTo: tech._id, status: { $in: ['resolved', 'closed'] }, createdAt: { $gte: startDate } }).select('createdAt updatedAt'),
        ]);
        const avgTime = resolvedList.length > 0
          ? resolvedList.reduce((a, t) => a + (new Date(t.updatedAt) - new Date(t.createdAt)), 0) / resolvedList.length / 3600000
          : 0;
        return {
          _id: tech._id, name: tech.name, email: tech.email, role: tech.role,
          assigned, resolved, active,
          successRate: assigned > 0 ? Math.round((resolved / assigned) * 100) : 0,
          avgResolutionTime: Math.round(avgTime * 10) / 10,
        };
      })
    );
    techPerformance.sort((a, b) => b.successRate - a.successRate);

    res.json({
      kpis: {
        totalTickets,
        resolvedTickets,
        openTickets,
        inProgressTickets,
        waitingTickets,
        resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        slaBreachedCount,
        escalatedCount,
        slaComplianceRate: totalTickets > 0 ? Math.round(((totalTickets - slaBreachedCount) / totalTickets) * 100) : 100,
      },
      ticketsByDay,
      statusDistribution,
      priorityDistribution,
      categoryDistribution,
      techPerformance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/analytics/projects ──
const getProjectAnalytics = async (req, res) => {
  try {
    const [totalProjects, projects, totalTasks, doneTasks, overdueTasks] = await Promise.all([
      Project.countDocuments(),
      Project.find().select('name status priority progress'),
      ProjectTask.countDocuments(),
      ProjectTask.countDocuments({ status: 'done' }),
      ProjectTask.countDocuments({ status: { $nin: ['done'] }, dueDate: { $lt: new Date() } }),
    ]);

    const statusBreakdown = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    res.json({
      totalProjects,
      totalTasks,
      doneTasks,
      overdueTasks,
      completionRate,
      statusBreakdown,
      projects,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAnalytics, getProjectAnalytics };
