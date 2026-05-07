// backend/controllers/ticketController.js
const Ticket = require("../schemas/ticket");
const Notification = require("../schemas/notification");
const History = require("../schemas/history");

// ── Helper notification ──
const createNotification = async (userId, type, ticketId, message, triggeredBy) => {
  try {
    if (userId.toString() === triggeredBy.toString()) return;
    await Notification.create({ userId, type, ticketId, message, triggeredBy });
  } catch (err) {
    console.log("Notification error:", err);
  }
};

// ── Helper history ──
const createHistory = async (ticketId, userId, action, oldValue = null, newValue = null) => {
  try {
    await History.create({ ticketId, userId, action, oldValue, newValue });
  } catch (err) {
    console.log("History error:", err);
  }
};

const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

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

const getAssignedTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedTo: req.user.id })
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("comments.userId", "name email role");
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json(ticket);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const createTicket = async (req, res) => {
  try {
    const { title, description, priority, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const ticket = new Ticket({
      title,
      description,
      priority,
      category,
      createdBy: req.user.id,
    });

    await ticket.save();
    await ticket.populate("createdBy", "name email role");

    // ✅ History : ticket créé
    await createHistory(ticket._id, req.user.id, 'created', null, title);

    res.status(201).json(ticket);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateTicket = async (req, res) => {
  try {
    const { status, priority, category, assignedTo } = req.body;

    const oldTicket = await Ticket.findById(req.params.id)
      .populate("assignedTo", "name");
    if (!oldTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status, priority, category, assignedTo },
      { new: true }
    )
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role");

    // ✅ History : status changé
    if (status && status !== oldTicket.status) {
      await createHistory(ticket._id, req.user.id, 'status_changed', oldTicket.status, status);
    }

    // ✅ History : priorité changée
    if (priority && priority !== oldTicket.priority) {
      await createHistory(ticket._id, req.user.id, 'priority_changed', oldTicket.priority, priority);
    }

    // ✅ History : assignation
    if (assignedTo && assignedTo !== oldTicket.assignedTo?._id?.toString()) {
      await createHistory(ticket._id, req.user.id, 'assigned', oldTicket.assignedTo?.name ?? null, ticket.assignedTo?.name ?? null);

      // Notification
      await createNotification(
        assignedTo, 'assigned', ticket._id,
        `Vous avez été assigné au ticket "${ticket.title}"`,
        req.user.id
      );
    }

    // ✅ History : désassignation
    if (!assignedTo && oldTicket.assignedTo) {
      await createHistory(ticket._id, req.user.id, 'unassigned', oldTicket.assignedTo?.name, null);
    }

    // ✅ Notification status changé
    if (status && status !== oldTicket.status) {
      await createNotification(
        ticket.createdBy._id, 'status_changed', ticket._id,
        `Le statut de votre ticket "${ticket.title}" a changé : ${oldTicket.status} → ${status}`,
        req.user.id
      );
    }

    res.json(ticket);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.comments.push({ content, userId: req.user.id });
    await ticket.save();
    await ticket.populate("comments.userId", "name email role");

    // ✅ History : commentaire ajouté
    await createHistory(ticket._id, req.user.id, 'commented', null, content);

    // ✅ Notifications
    await createNotification(
      ticket.createdBy, 'commented', ticket._id,
      `${req.user.name} a commenté votre ticket "${ticket.title}"`,
      req.user.id
    );

    if (ticket.assignedTo && ticket.assignedTo.toString() !== req.user.id) {
      await createNotification(
        ticket.assignedTo, 'commented', ticket._id,
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
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  addComment,
};