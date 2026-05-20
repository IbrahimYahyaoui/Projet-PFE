// backend/controllers/ticketController.js
const Ticket = require("../schemas/ticket");
const Notification = require("../schemas/notification");
const History = require("../schemas/history");
const Team = require("../schemas/team");

// ── Helpers ──
const createNotification = async (userId, type, ticketId, message, triggeredBy) => {
  try {
    if (!userId || userId.toString() === triggeredBy.toString()) return;
    await Notification.create({ userId, type, ticketId, message, triggeredBy });
  } catch (err) {
    console.log("Notification error:", err);
  }
};

const createHistory = async (ticketId, userId, action, oldValue = null, newValue = null) => {
  try {
    await History.create({ ticketId, userId, action, oldValue, newValue });
  } catch (err) {
    console.log("History error:", err);
  }
};

// ── GET all tickets (admin only) ──
const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("teamId", "name category")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── GET my tickets (employé) ──
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ createdBy: req.user.id })
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── GET assigned tickets (technicien) ──
const getAssignedTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedTo: req.user.id })
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── GET team tickets (leader) ──
const getTeamTickets = async (req, res) => {
  try {
    const team = await Team.findOne({
      $or: [
        { leaderId: req.user.id },
        { members: req.user.id }
      ]
    });

    if (!team) {
      return res.status(404).json({ message: "Équipe non trouvée" });
    }

    const tickets = await Ticket.find({ category: team.category })
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── GET ticket by ID ──
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("teamId", "name category")
      .populate("comments.userId", "name email role");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json(ticket);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── CREATE ticket (employé) ──
const createTicket = async (req, res) => {
  try {
    const { title, description, priority, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    // Trouver l'équipe correspondante à la catégorie
    const team = await Team.findOne({ category });

    const ticket = new Ticket({
      title,
      description,
      priority: priority || 'medium',
      category: category || 'other',
      createdBy: req.user.id,
      teamId: team?._id || null,
      status: 'open',
    });

    await ticket.save();
    await ticket.populate("createdBy", "name email role");

    await createHistory(ticket._id, req.user.id, 'created', null, title);

    // Notifier le leader de l'équipe
    if (team?.leaderId) {
      await createNotification(
        team.leaderId,
        'new_ticket',
        ticket._id,
        `Nouveau ticket "${title}" dans votre équipe`,
        req.user.id
      );
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── ASSIGN ticket (leader) ──
const assignTicket = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const role = req.user.role;

    if (role !== 'leader' && role !== 'admin') {
      return res.status(403).json({ message: "Seul un leader peut assigner des tickets" });
    }

    const oldTicket = await Ticket.findById(req.params.id).populate("assignedTo", "name");
    if (!oldTicket) return res.status(404).json({ message: "Ticket not found" });

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo,
        assignedBy: req.user.id,
        status: 'assigned',
      },
      { new: true }
    )
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role");

    // History
    await createHistory(
      ticket._id, req.user.id, 'assigned',
      oldTicket.assignedTo?.name ?? null,
      ticket.assignedTo?.name ?? null
    );

    // Notifier le technicien assigné
    await createNotification(
      assignedTo,
      'assigned',
      ticket._id,
      `Vous avez été assigné au ticket "${ticket.title}"`,
      req.user.id
    );

    // Notifier l'employé créateur
    await createNotification(
      ticket.createdBy._id,
      'status_changed',
      ticket._id,
      `Votre ticket "${ticket.title}" a été assigné à un technicien`,
      req.user.id
    );

    res.json(ticket);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── UPDATE ticket status ──
const updateTicket = async (req, res) => {
  try {
    const { status, priority, category } = req.body;
    const role = req.user.role;

    const oldTicket = await Ticket.findById(req.params.id)
      .populate("assignedTo", "name")
      .populate("createdBy", "name");

    if (!oldTicket) return res.status(404).json({ message: "Ticket not found" });

    // Vérifier les permissions selon le rôle
    if (role === 'user') {
      return res.status(403).json({ message: "Vous ne pouvez pas modifier le statut" });
    }

    // Technicien peut seulement changer in_progress et resolved
    if (role === 'tech') {
      if (status && !['in_progress', 'resolved'].includes(status)) {
        return res.status(403).json({ message: "Action non autorisée" });
      }
      // Vérifier que c'est son ticket
      if (oldTicket.assignedTo?._id?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Ce ticket n'est pas assigné à vous" });
      }
    }

    const updateData = {};
    if (status)   updateData.status   = status;
    if (priority) updateData.priority = priority;
    if (category) updateData.category = category;
    if (status === 'resolved') updateData.resolvedAt = new Date();

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role");

    // History status
    if (status && status !== oldTicket.status) {
      await createHistory(ticket._id, req.user.id, 'status_changed', oldTicket.status, status);

      // Notifier le créateur
      await createNotification(
        ticket.createdBy._id,
        'status_changed',
        ticket._id,
        `Le statut de votre ticket "${ticket.title}" est passé à : ${status}`,
        req.user.id
      );

      // Notifier le leader si résolu
      if (status === 'resolved') {
        const team = await Team.findById(ticket.teamId);
        if (team?.leaderId) {
          await createNotification(
            team.leaderId,
            'resolved',
            ticket._id,
            `Le ticket "${ticket.title}" a été résolu`,
            req.user.id
          );
        }
      }
    }

    // History priority
    if (priority && priority !== oldTicket.priority) {
      await createHistory(ticket._id, req.user.id, 'priority_changed', oldTicket.priority, priority);
    }

    res.json(ticket);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── DELETE ticket ──
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── ADD comment ──
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.comments.push({ content, userId: req.user.id });
    await ticket.save();
    await ticket.populate("comments.userId", "name email role");

    await createHistory(ticket._id, req.user.id, 'commented', null, content);

    // Notifier créateur
    await createNotification(
      ticket.createdBy,
      'commented',
      ticket._id,
      `${req.user.name} a commenté votre ticket "${ticket.title}"`,
      req.user.id
    );

    // Notifier technicien assigné
    if (ticket.assignedTo && ticket.assignedTo.toString() !== req.user.id) {
      await createNotification(
        ticket.assignedTo,
        'commented',
        ticket._id,
        `${req.user.name} a commenté le ticket "${ticket.title}"`,
        req.user.id
      );
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
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
};