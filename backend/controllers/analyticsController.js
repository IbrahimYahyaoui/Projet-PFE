// backend/controllers/analyticsController.js
const Ticket      = require('../schemas/ticket');
const User        = require('../schemas/user');
const Project     = require('../schemas/project');
const ProjectTask = require('../schemas/projectTask');
const Team        = require('../schemas/team');

// ── Helpers ──

const calcAvgResolution = (tickets) => {
  if (!tickets.length) return 0;
  const total = tickets.reduce((acc, t) => {
    const end = t.resolvedAt || t.updatedAt;
    return acc + (new Date(end) - new Date(t.createdAt));
  }, 0);
  return Math.round((total / tickets.length / 3600000) * 10) / 10;
};

// ── GET /api/analytics — admin full view ──
const getAdminAnalytics = async (startDate) => {
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
    Ticket.find({ status: { $in: ['resolved', 'closed'] }, createdAt: { $gte: startDate } }).select('createdAt resolvedAt updatedAt'),
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
    User.find({ role: { $in: ['tech', 'leader'] } }).select('name email role avatar'),
  ]);

  const avgResolutionTime = calcAvgResolution(resolvedWithTime);

  const techPerformance = await Promise.all(
    techs.map(async (tech) => {
      const [assigned, resolved, active, resolvedList] = await Promise.all([
        Ticket.countDocuments({ assignedTo: tech._id, createdAt: { $gte: startDate } }),
        Ticket.countDocuments({ assignedTo: tech._id, status: { $in: ['resolved', 'closed'] }, createdAt: { $gte: startDate } }),
        Ticket.countDocuments({ assignedTo: tech._id, status: { $in: ['assigned', 'in_progress', 'waiting'] } }),
        Ticket.find({ assignedTo: tech._id, status: { $in: ['resolved', 'closed'] }, createdAt: { $gte: startDate } }).select('createdAt resolvedAt updatedAt'),
      ]);
      return {
        _id: tech._id, name: tech.name, email: tech.email, role: tech.role, avatar: tech.avatar,
        assigned, resolved, active,
        successRate: assigned > 0 ? Math.round((resolved / assigned) * 100) : 0,
        avgResolutionTime: calcAvgResolution(resolvedList),
      };
    })
  );
  techPerformance.sort((a, b) => b.successRate - a.successRate);

  return {
    scope: 'global',
    kpis: {
      totalTickets, resolvedTickets, openTickets, inProgressTickets, waitingTickets,
      resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
      avgResolutionTime, slaBreachedCount, escalatedCount,
      slaComplianceRate: totalTickets > 0 ? Math.round(((totalTickets - slaBreachedCount) / totalTickets) * 100) : 100,
    },
    ticketsByDay, statusDistribution, priorityDistribution, categoryDistribution, techPerformance,
  };
};

// ── Leader: scoped to their team ──
const getLeaderAnalytics = async (userId, startDate) => {
  const team = await Team.findOne({ $or: [{ leaderId: userId }, { members: userId }] });
  const teamFilter = team ? { teamId: team._id, createdAt: { $gte: startDate } } : { createdAt: { $gte: startDate }, _id: null };

  const [totalTickets, resolvedTickets, openTickets, inProgressTickets, waitingTickets, slaBreachedCount, resolvedWithTime, ticketsByDay, statusDistribution] = await Promise.all([
    Ticket.countDocuments(teamFilter),
    Ticket.countDocuments({ ...teamFilter, status: { $in: ['resolved', 'closed'] } }),
    Ticket.countDocuments({ ...teamFilter, status: 'open' }),
    Ticket.countDocuments({ ...teamFilter, status: 'in_progress' }),
    Ticket.countDocuments({ ...teamFilter, status: 'waiting' }),
    Ticket.countDocuments({ ...teamFilter, slaBreached: true }),
    Ticket.find({ ...teamFilter, status: { $in: ['resolved', 'closed'] } }).select('createdAt resolvedAt updatedAt'),
    Ticket.aggregate([
      { $match: teamFilter },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, created: { $sum: 1 }, resolved: { $sum: { $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]),
    Ticket.aggregate([
      { $match: teamFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const avgResolutionTime = calcAvgResolution(resolvedWithTime);

  // Team member performance
  const members = team ? await User.find({ _id: { $in: team.members } }).select('name email role avatar') : [];
  const techPerformance = await Promise.all(
    members.map(async (m) => {
      const [assigned, resolved, active, resolvedList] = await Promise.all([
        Ticket.countDocuments({ assignedTo: m._id, createdAt: { $gte: startDate } }),
        Ticket.countDocuments({ assignedTo: m._id, status: { $in: ['resolved', 'closed'] }, createdAt: { $gte: startDate } }),
        Ticket.countDocuments({ assignedTo: m._id, status: { $in: ['assigned', 'in_progress', 'waiting'] } }),
        Ticket.find({ assignedTo: m._id, status: { $in: ['resolved', 'closed'] }, createdAt: { $gte: startDate } }).select('createdAt resolvedAt updatedAt'),
      ]);
      return {
        _id: m._id, name: m.name, email: m.email, role: m.role, avatar: m.avatar,
        assigned, resolved, active,
        successRate: assigned > 0 ? Math.round((resolved / assigned) * 100) : 0,
        avgResolutionTime: calcAvgResolution(resolvedList),
      };
    })
  );
  techPerformance.sort((a, b) => b.successRate - a.successRate);

  return {
    scope: 'team',
    teamName: team?.name ?? null,
    kpis: {
      totalTickets, resolvedTickets, openTickets, inProgressTickets, waitingTickets,
      resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
      avgResolutionTime, slaBreachedCount, escalatedCount: 0,
      slaComplianceRate: totalTickets > 0 ? Math.round(((totalTickets - slaBreachedCount) / totalTickets) * 100) : 100,
    },
    ticketsByDay, statusDistribution, priorityDistribution: [], categoryDistribution: [], techPerformance,
  };
};

// ── Tech: ses tickets assignés ──
const getTechAnalytics = async (userId, startDate) => {
  const myTickets = await Ticket.find({ assignedTo: userId, createdAt: { $gte: startDate } });
  const resolvedList = await Ticket.find({
    assignedTo: userId,
    status: { $in: ['resolved', 'closed'] },
    createdAt: { $gte: startDate },
  }).select('createdAt resolvedAt updatedAt');

  return {
    scope: 'personal',
    kpis: {
      totalTickets:      myTickets.length,
      resolvedTickets:   myTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
      inProgressTickets: myTickets.filter(t => t.status === 'in_progress').length,
      waitingTickets:    myTickets.filter(t => t.status === 'waiting').length,
      avgResolutionTime: calcAvgResolution(resolvedList),
      resolutionRate: myTickets.length > 0
        ? Math.round((myTickets.filter(t => ['resolved','closed'].includes(t.status)).length / myTickets.length) * 100) : 0,
    },
  };
};

// ── Employé: ses tickets soumis ──
const getUserAnalytics = async (userId) => {
  const myTickets = await Ticket.find({ createdBy: userId });
  const total    = myTickets.length;
  const resolved = myTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;
  return {
    scope: 'personal',
    kpis: {
      totalTickets:      total,
      resolvedTickets:   resolved,
      openTickets:       myTickets.filter(t => t.status === 'open').length,
      inProgressTickets: myTickets.filter(t => t.status === 'in_progress').length,
      waitingTickets:    myTickets.filter(t => t.status === 'waiting').length,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    },
  };
};

// ── GET /api/analytics ──
const getAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 3600000);
    const { role, id } = req.user;

    // FIX 7 — données filtrées selon le rôle (pas de 403 pour aucun rôle)
    let data;
    if (role === 'admin')       data = await getAdminAnalytics(startDate);
    else if (role === 'leader') data = await getLeaderAnalytics(id, startDate);
    else if (role === 'tech')   data = await getTechAnalytics(id, startDate);
    else                        data = await getUserAnalytics(id);  // role === 'user'

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/analytics/projects ──
const getProjectAnalytics = async (req, res) => {
  try {
    const { role, id } = req.user;

    // FIX 7 — employé : aucune donnée projet
    if (role === 'user') {
      return res.json({ scope: 'personal', totalProjects: 0, totalTasks: 0, doneTasks: 0, overdueTasks: 0, completionRate: 0, statusBreakdown: [], projects: [] });
    }

    // Filtre projet selon le rôle
    let projectFilter = {};
    if (role === 'tech')        projectFilter = { members: id };
    else if (role === 'leader') projectFilter = { $or: [{ managerId: id }, { members: id }, { createdBy: id }] };
    // admin : pas de filtre

    const projects = await Project.find(projectFilter).select('_id name status priority progress');
    const projectIds = projects.map(p => p._id);

    const [totalTasks, doneTasks, overdueTasks, statusBreakdown] = await Promise.all([
      ProjectTask.countDocuments({ projectId: { $in: projectIds } }),
      ProjectTask.countDocuments({ projectId: { $in: projectIds }, status: 'done' }),
      ProjectTask.countDocuments({ projectId: { $in: projectIds }, status: { $nin: ['done'] }, dueDate: { $lt: new Date() } }),
      Project.aggregate([
        { $match: projectFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    res.json({
      scope: role === 'admin' ? 'global' : 'own',
      totalProjects: projects.length, totalTasks, doneTasks, overdueTasks, completionRate, statusBreakdown, projects,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAnalytics, getProjectAnalytics };
