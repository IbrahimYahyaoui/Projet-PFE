// backend/controllers/ticketController.js
const Ticket       = require("../schemas/ticket");
const History      = require("../schemas/history");
const Team         = require("../schemas/team");
const User         = require("../schemas/user");
const Project      = require("../schemas/project");
const Notification = require("../schemas/notification");
const { createNotification, notifyMany } = require("../utils/notifications");

// ── SLA hours per priority ──
const SLA_HOURS = { critical: 4, high: 24, medium: 72, low: 168 };

const calcSlaDeadline = (priority) => {
  const hours = SLA_HOURS[priority] ?? 72;
  return new Date(Date.now() + hours * 3600000);
};

const createHistory = async (ticketId, userId, action, oldValue = null, newValue = null) => {
  try {
    await History.create({ ticketId, userId, action, oldValue, newValue });
  } catch (err) {
    console.error("History error:", err.message);
  }
};

// Keep relatedProject ↔ Project.relatedTickets in sync
const syncTicketProject = async (ticketId, oldProjectId, newProjectId) => {
  const oldId = oldProjectId?.toString();
  const newId = newProjectId?.toString();
  if (oldId && oldId !== newId) {
    await Project.findByIdAndUpdate(oldId, { $pull: { relatedTickets: ticketId } });
  }
  if (newId && newId !== oldId) {
    await Project.findByIdAndUpdate(newId, { $addToSet: { relatedTickets: ticketId } });
  }
};

// ════════════════════════════════════════════════════
// GET endpoints
// ════════════════════════════════════════════════════

const getAllTickets = async (req, res) => {
  try {
    // FIX 5 — Seuls admin et leader peuvent voir tous les tickets
    if (!['admin', 'leader'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { status, priority, category, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .populate("assignedBy", "name email role")
        .populate({ path: 'teamId', select: 'name category tag color leaderId', populate: { path: 'leaderId', select: 'name email' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Ticket.countDocuments(filter),
    ]);
    res.json({ tickets, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin queue: open tickets not yet assigned to a team + team workload
const getAdminQueue = async (req, res) => {
  try {
    // FIX 5 — File admin : accès admin uniquement
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès admin requis' });
    }

    const tickets = await Ticket.find({ status: 'open', teamId: null })
      .populate("createdBy", "name email role")
      .sort({ priority: 1, createdAt: 1 });

    const teams = await Team.find()
      .populate('leaderId', 'name email')
      .populate('members', 'name');

    const teamsWithLoad = await Promise.all(teams.map(async (team) => {
      const activeTickets = await Ticket.countDocuments({
        teamId: team._id,
        status: { $nin: ['resolved', 'closed'] },
      });
      return {
        _id: team._id,
        name: team.name,
        category: team.category,
        tag: team.tag,
        color: team.color,
        leader: team.leaderId,
        memberCount: team.members.length,
        activeTickets,
      };
    }));

    res.json({ tickets, teams: teamsWithLoad });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// SLA alerts: tickets where deadline < now + 2h and not resolved
const getSlaAlerts = async (req, res) => {
  try {
    // FIX 5 — Alertes SLA : admin et leader uniquement
    if (!['admin', 'leader'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const twoHoursLater = new Date(Date.now() + 2 * 3600000);
    const tickets = await Ticket.find({
      slaDeadline: { $ne: null, $lt: twoHoursLater },
      status: { $nin: ['resolved', 'closed'] },
    })
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("teamId", "name tag")
      .sort({ slaDeadline: 1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ createdBy: req.user.id })
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate({ path: 'teamId', select: 'name category tag color leaderId', populate: { path: 'leaderId', select: 'name email' } })
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getAssignedTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedTo: req.user.id })
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate({ path: 'teamId', select: 'name category tag color leaderId', populate: { path: 'leaderId', select: 'name email' } })
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Team tickets — uses teamId (not category) for accuracy
const getTeamTickets = async (req, res) => {
  try {
    const team = await Team.findOne({
      $or: [{ leaderId: req.user.id }, { members: req.user.id }],
    });
    if (!team) return res.status(404).json({ message: "Équipe non trouvée" });

    const tickets = await Ticket.find({ teamId: team._id })
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// CORRECTION 2 — Contrôle d'accès : chaque rôle ne voit que les tickets auxquels il a droit
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate({ path: 'teamId', select: 'name category tag color leaderId', populate: { path: 'leaderId', select: 'name email' } })
      .populate("relatedProject", "name status")
      .populate("comments.userId", "name email role");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const { role, id: userId } = req.user;

    if (role !== 'admin') {
      let hasAccess = false;

      if (role === 'user') {
        hasAccess = ticket.createdBy?._id?.toString() === userId;
      } else if (role === 'tech') {
        hasAccess = ticket.assignedTo?._id?.toString() === userId;
        if (!hasAccess && ticket.teamId) {
          const team = await Team.findOne({ _id: ticket.teamId._id, $or: [{ leaderId: userId }, { members: userId }] });
          hasAccess = !!team;
        }
      } else if (role === 'leader') {
        if (ticket.teamId) {
          const team = await Team.findOne({ _id: ticket.teamId._id, $or: [{ leaderId: userId }, { members: userId }] });
          hasAccess = !!team;
        }
      }

      if (!hasAccess) return res.status(403).json({ message: "Accès refusé à ce ticket" });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ════════════════════════════════════════════════════
// CREATE
// ════════════════════════════════════════════════════

const createTicket = async (req, res) => {
  try {
    if (req.user.role === 'tech') {
      return res.status(403).json({ message: "Les techniciens ne peuvent pas créer de tickets" });
    }

    const { title, description, priority = 'medium', category = 'other' } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    // Auto-suggest team by category (admin still confirms)
    const suggestedTeam = await Team.findOne({ category });

    const ticket = await Ticket.create({
      title,
      description,
      priority,
      category,
      createdBy: req.user.id,
      teamId: null, // admin must confirm via assignToTeam
      status: 'open',
      slaDeadline: calcSlaDeadline(priority),
    });

    await ticket.populate("createdBy", "name email role");
    await createHistory(ticket._id, req.user.id, 'created', null, title);

    // Notify all admins
    const admins = await User.find({ role: 'admin' }).select('_id');
    await notifyMany(
      admins.map(a => a._id),
      {
        type: 'new_ticket',
        message: `Nouveau ticket : "${title}" (${priority}) — catégorie ${category}`,
        triggeredBy: req.user.id,
        ticketId: ticket._id,
      }
    );

    // Also hint the likely team leader if team was found
    if (suggestedTeam?.leaderId) {
      await createNotification({
        userId: suggestedTeam.leaderId,
        type: 'new_ticket',
        message: `Ticket potentiellement pour votre équipe : "${title}"`,
        triggeredBy: req.user.id,
        ticketId: ticket._id,
      });
    }

    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ════════════════════════════════════════════════════
// STEP 1: Admin assigns ticket to a Team
// ════════════════════════════════════════════════════

const assignToTeam = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin only" });
    }

    const { teamId } = req.body;
    if (!teamId) return res.status(400).json({ message: "teamId is required" });

    const team = await Team.findById(teamId).populate('leaderId', 'name email');
    if (!team) return res.status(404).json({ message: "Team not found" });

    const oldTicket = await Ticket.findById(req.params.id);
    if (!oldTicket) return res.status(404).json({ message: "Ticket not found" });

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { teamId, status: 'assigned', escalationLevel: 0, escalatedAt: null },
      { new: true }
    )
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate({ path: 'teamId', select: 'name category tag color leaderId', populate: { path: 'leaderId', select: 'name email' } });

    await createHistory(ticket._id, req.user.id, 'status_changed', 'open', 'assigned');
    await createHistory(ticket._id, req.user.id, 'assigned', oldTicket.teamId?.toString() ?? null, teamId);

    // Notify team leader
    if (team.leaderId) {
      await createNotification({
        userId: team.leaderId._id,
        type: 'team_assigned',
        message: `Votre équipe "${team.name}" a reçu le ticket : "${ticket.title}"`,
        triggeredBy: req.user.id,
        ticketId: ticket._id,
      });
    }

    // Notify ticket creator
    await createNotification({
      userId: ticket.createdBy._id,
      type: 'team_assigned',
      message: `Votre ticket "${ticket.title}" a été attribué à l'équipe ${team.name}`,
      triggeredBy: req.user.id,
      ticketId: ticket._id,
    });

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ════════════════════════════════════════════════════
// STEP 2: Leader assigns ticket to a Technician
// ════════════════════════════════════════════════════

const assignTicket = async (req, res) => {
  try {
    const role = req.user.role;
    if (role !== 'leader' && role !== 'admin') {
      return res.status(403).json({ message: "Leader ou Admin requis" });
    }

    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ message: "assignedTo is required" });

    const oldTicket = await Ticket.findById(req.params.id).populate("assignedTo", "name");
    if (!oldTicket) return res.status(404).json({ message: "Ticket not found" });

    const team = await Team.findById(oldTicket.teamId);
    const isMember = team?.members?.some(m => m.toString() === assignedTo) || team?.leaderId?.toString() === assignedTo;
    if (!isMember) {
      return res.status(400).json({ message: "Ce technicien n'appartient pas à l'équipe assignée à ce ticket" });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignedTo, assignedBy: req.user.id, status: 'assigned' },
      { new: true }
    )
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("teamId", "name tag");

    await createHistory(
      ticket._id, req.user.id, 'assigned',
      oldTicket.assignedTo?.name ?? null,
      ticket.assignedTo?.name ?? null
    );

    // Notify assigned tech
    await createNotification({
      userId: assignedTo,
      type: 'assigned',
      message: `Vous avez été assigné au ticket : "${ticket.title}"`,
      triggeredBy: req.user.id,
      ticketId: ticket._id,
    });

    // Notify ticket creator
    await createNotification({
      userId: ticket.createdBy._id,
      type: 'status_changed',
      message: `Votre ticket "${ticket.title}" a été assigné à un technicien`,
      triggeredBy: req.user.id,
      ticketId: ticket._id,
    });

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ════════════════════════════════════════════════════
// UPDATE ticket (status, priority, waitingReason, relatedProject)
// ════════════════════════════════════════════════════

const updateTicket = async (req, res) => {
  try {
    const { status, priority, category, waitingReason, relatedProject } = req.body;
    const role = req.user.role;

    const oldTicket = await Ticket.findById(req.params.id)
      .populate("assignedTo", "name _id")
      .populate("createdBy", "name _id");
    if (!oldTicket) return res.status(404).json({ message: "Ticket not found" });

    if (role === 'user') {
      return res.status(403).json({ message: "Vous ne pouvez pas modifier le statut" });
    }

    if (role === 'tech') {
      const allowed = ['in_progress', 'waiting', 'resolved'];
      if (status && !allowed.includes(status)) {
        return res.status(403).json({ message: "Action non autorisée" });
      }
      if (oldTicket.assignedTo?._id?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Ce ticket n'est pas assigné à vous" });
      }
    }

    if (role === 'leader') {
      if (!oldTicket.teamId) {
        return res.status(400).json({ message: "Ticket non assigné à une équipe" });
      }
      const team = await Team.findById(oldTicket.teamId);
      if (team?.leaderId?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Seul le leader de l'équipe assignée à ce ticket peut faire cela" });
      }
    }

    if (status === 'closed') {
      if (role !== 'admin' && role !== 'leader') {
        return res.status(403).json({ message: "Seul l'admin ou le leader peut clôturer un ticket" });
      }
    }

    // Réouverture closed → resolved : admin uniquement (Tableau 2.3 du rapport)
    if (oldTicket.status === 'closed' && status === 'resolved' && role !== 'admin') {
      return res.status(403).json({ message: "Seul l'admin peut rouvrir un ticket fermé" });
    }

    const updateData = {};
    if (status)          updateData.status   = status;
    if (priority)        updateData.priority = priority;
    if (category)        updateData.category = category;
    if (relatedProject !== undefined) updateData.relatedProject = relatedProject || null;
    if (status === 'waiting' && waitingReason) updateData.waitingReason = waitingReason;

    // SLA pause: entering waiting → record start
    if (status === 'waiting' && oldTicket.status !== 'waiting') {
      updateData.waitingSince = new Date();
    }
    // SLA resume: leaving waiting → accumulate elapsed wait time + extend SLA deadline
    if (oldTicket.status === 'waiting' && status && status !== 'waiting') {
      updateData.waitingSince = null;
      if (oldTicket.waitingSince) {
        const elapsedMs = Date.now() - new Date(oldTicket.waitingSince).getTime();
        const elapsedMin = Math.round(elapsedMs / 60000);
        updateData.totalWaitingTime = (oldTicket.totalWaitingTime || 0) + elapsedMin;
        // Extend SLA deadline by the same amount
        if (oldTicket.slaDeadline) {
          updateData.slaDeadline = new Date(new Date(oldTicket.slaDeadline).getTime() + elapsedMs);
        }
      }
    }

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      if (oldTicket.slaDeadline && new Date() > oldTicket.slaDeadline) {
        updateData.slaBreached = true;
      }
    }
    if (status === 'closed') {
      updateData.closedAt = new Date();
    }
    if (priority && priority !== oldTicket.priority) {
      updateData.slaDeadline = calcSlaDeadline(priority);
    }

    // Sync project relation before update
    if (relatedProject !== undefined) {
      await syncTicketProject(req.params.id, oldTicket.relatedProject, relatedProject || null);
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("teamId", "name tag");

    if (status && status !== oldTicket.status) {
      await createHistory(ticket._id, req.user.id, 'status_changed', oldTicket.status, status);

      await createNotification({
        userId: ticket.createdBy._id,
        type: 'status_changed',
        message: `Statut du ticket "${ticket.title}" → ${status}`,
        triggeredBy: req.user.id,
        ticketId: ticket._id,
      });

      if (status === 'resolved') {
        const team = await Team.findById(ticket.teamId);
        if (team?.leaderId) {
          await createNotification({
            userId: team.leaderId,
            type: 'resolved',
            message: `Ticket résolu : "${ticket.title}"`,
            triggeredBy: req.user.id,
            ticketId: ticket._id,
          });
        }
      }
    }

    if (priority && priority !== oldTicket.priority) {
      await createHistory(ticket._id, req.user.id, 'priority_changed', oldTicket.priority, priority);
    }

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ════════════════════════════════════════════════════
// ESCALATE
// ════════════════════════════════════════════════════

const escalateTicket = async (req, res) => {
  try {
    const role = req.user.role;
    if (!['admin', 'leader'].includes(role)) {
      return res.status(403).json({ message: "Admin ou Leader requis" });
    }

    const ticket = await Ticket.findById(req.params.id).populate("teamId");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const newLevel = Math.min((ticket.escalationLevel ?? 0) + 1, 2);
    await Ticket.findByIdAndUpdate(req.params.id, { escalationLevel: newLevel, escalatedAt: new Date() });
    await createHistory(ticket._id, req.user.id, 'status_changed', `escalation:${ticket.escalationLevel}`, `escalation:${newLevel}`);

    const admins = await User.find({ role: 'admin' }).select('_id');
    const team   = ticket.teamId ? await Team.findById(ticket.teamId) : null;

    const recipients = [
      ...(newLevel >= 2 ? admins.map(a => a._id.toString()) : []),
      team?.leaderId?.toString(),
    ].filter(Boolean);

    await notifyMany(recipients, {
      type: 'escalated',
      message: `Ticket escaladé (niveau ${newLevel}) : "${ticket.title}"`,
      triggeredBy: req.user.id,
      ticketId: ticket._id,
    });

    res.json({ escalationLevel: newLevel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ════════════════════════════════════════════════════
// DELETE / COMMENT
// ════════════════════════════════════════════════════

const deleteTicket = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin only" });
    }
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Cascade: remove from linked project
    if (ticket.relatedProject) {
      await Project.findByIdAndUpdate(ticket.relatedProject, { $pull: { relatedTickets: ticket._id } });
    }

    await Promise.all([
      Ticket.findByIdAndDelete(req.params.id),
      History.deleteMany({ ticketId: req.params.id }),
      Notification.deleteMany({ ticketId: req.params.id }),
    ]);

    res.json({ message: "Ticket deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // CORRECTION 3 — Contrôle d'accès : seuls les acteurs du ticket peuvent commenter
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
      if (!hasAccess) return res.status(403).json({ message: "Vous n'avez pas accès à ce ticket" });
    }

    ticket.comments.push({ content, userId: req.user.id });
    await ticket.save();
    await ticket.populate("comments.userId", "name email role");

    await createHistory(ticket._id, req.user.id, 'commented', null, content);

    // Notify creator
    await createNotification({
      userId: ticket.createdBy,
      type: 'commented',
      message: `${req.user.name} a commenté votre ticket "${ticket.title}"`,
      triggeredBy: req.user.id,
      ticketId: ticket._id,
    });

    // Notify assigned tech (if different)
    if (ticket.assignedTo && ticket.assignedTo.toString() !== req.user.id) {
      await createNotification({
        userId: ticket.assignedTo,
        type: 'commented',
        message: `${req.user.name} a commenté le ticket "${ticket.title}"`,
        triggeredBy: req.user.id,
        ticketId: ticket._id,
      });
    }

    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
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
};
