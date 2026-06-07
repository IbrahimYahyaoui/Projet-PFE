const User = require("../schemas/user");

// ── Récupérer le profil ──
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Mettre à jour le profil ──
// CORRECTION 5 — Accepte aussi la mise à jour de l'email (avec vérification d'unicité)
const updateProfile = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name)   user.name   = name;
    if (avatar) user.avatar = avatar;

    if (email && email.trim().toLowerCase() !== user.email) {
      const taken = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: req.params.id } });
      if (taken) return res.status(400).json({ message: "Cet email est déjà utilisé" });
      user.email = email.trim().toLowerCase();
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Changer le mot de passe ──
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/profile/:id/settings
const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('settings');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ settings: user.settings ?? {} });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/profile/:id/settings
const updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { notifications, appearance, preferences } = req.body;
    if (!user.settings) user.settings = {};
    if (notifications) {
      user.settings.notifications = { ...user.settings.notifications, ...notifications };
    }
    if (appearance) {
      user.settings.appearance = { ...user.settings.appearance, ...appearance };
    }
    if (preferences) {
      user.settings.preferences = { ...user.settings.preferences, ...preferences };
    }
    user.markModified('settings');
    await user.save();
    res.json({ message: 'Settings updated', settings: user.settings });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfileStats = async (req, res) => {
  try {
    const Ticket = require('../schemas/ticket');
    const userId = req.params.id;
    const user = await User.findById(userId).select('role');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let stats = {};

    if (user.role === 'admin') {
      const [total, resolved, open, slaBreached] = await Promise.all([
        Ticket.countDocuments({}),
        Ticket.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
        Ticket.countDocuments({ status: 'open' }),
        Ticket.countDocuments({ slaBreached: true }),
      ]);
      stats = { total, resolved, open, slaBreached, label: 'Plateforme' };
    }
    else if (user.role === 'leader') {
      const Team = require('../schemas/team');
      const team = await Team.findOne({ $or: [{ leaderId: userId }, { members: userId }] }).select('name');
      if (team) {
        const [total, resolved, open] = await Promise.all([
          Ticket.countDocuments({ teamId: team._id }),
          Ticket.countDocuments({ teamId: team._id, status: { $in: ['resolved', 'closed'] } }),
          Ticket.countDocuments({ teamId: team._id, status: 'open' }),
        ]);
        stats = { total, resolved, open, label: team.name };
      }
    }
    else if (user.role === 'tech') {
      const [total, resolved, inProgress] = await Promise.all([
        Ticket.countDocuments({ assignedTo: userId }),
        Ticket.countDocuments({ assignedTo: userId, status: { $in: ['resolved', 'closed'] } }),
        Ticket.countDocuments({ assignedTo: userId, status: 'in_progress' }),
      ]);
      stats = { total, resolved, inProgress, label: 'Mes tickets' };
    }
    else {
      const [total, resolved, open] = await Promise.all([
        Ticket.countDocuments({ createdBy: userId }),
        Ticket.countDocuments({ createdBy: userId, status: { $in: ['resolved', 'closed'] } }),
        Ticket.countDocuments({ createdBy: userId, status: 'open' }),
      ]);
      stats = { total, resolved, open, label: 'Mes tickets' };
    }

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getSettings,
  updateSettings,
  getProfileStats,
};