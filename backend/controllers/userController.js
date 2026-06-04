// backend/controllers/userController.js
const User   = require("../schemas/user");
const crypto = require("crypto");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const generatePassword = () => crypto.randomBytes(6).toString("hex");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("teamId", "name tag color category");
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, role, password, phone, department } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: "Nom, email et rôle sont obligatoires" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Cet email existe déjà" });

    const isAutoPassword = !password || password.trim() === '';
    const finalPassword  = isAutoPassword ? generatePassword() : password;

    const user = new User({
      name, email, password: finalPassword, role,
      phone: phone || '', department: department || '',
    });
    await user.save();

    try {
      await resend.emails.send({
        from: "TicketFlow <onboarding@resend.dev>",
        to: email,
        subject: "Your TicketFlow Account",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;border:1px solid #e0e0e0;border-radius:12px;">
            <h2 style="color:#111;">Welcome to TicketFlow!</h2>
            <p style="color:#666;">Hi ${name}, your account has been created.</p>
            <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:20px 0;">
              <p style="margin:5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin:5px 0;"><strong>Password:</strong> ${finalPassword}</p>
              <p style="margin:5px 0;"><strong>Role:</strong> ${role}</p>
            </div>
            <p style="color:#666;font-size:13px;">Please change your password after first login.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.log("Email error:", emailErr);
    }

    const response = {
      id: user._id, name: user.name, email: user.email, role: user.role,
    };
    if (isAutoPassword) response.generatedPassword = finalPassword;

    res.status(201).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role, password, phone, department, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name)                              user.name       = name;
    if (email)                             user.email      = email;
    if (role)                              user.role       = role;
    if (password && password.trim() !== '') user.password  = password;
    if (phone      !== undefined)          user.phone      = phone;
    if (department !== undefined)          user.department = department;
    if (isActive   !== undefined)          user.isActive   = isActive;

    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Impossible de supprimer le dernier administrateur" });
      }
    }

    const Team = require('../schemas/team');
    const leadTeam = await Team.findOne({ leaderId: user._id });
    if (leadTeam) {
      return res.status(400).json({
        message: `Cet utilisateur est leader de l'équipe "${leadTeam.name}". Réassignez le leader avant de supprimer.`,
      });
    }

    const Ticket = require('../schemas/ticket');
    const openTickets = await Ticket.countDocuments({
      assignedTo: user._id,
      status: { $nin: ['resolved', 'closed'] },
    });

    await User.findByIdAndDelete(req.params.id);
    res.json({
      message: "User deleted successfully",
      warnings: openTickets > 0
        ? `${openTickets} ticket(s) ouvert(s) étaient assignés à cet utilisateur`
        : null,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === 'admin') {
      const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdmins <= 1 && user.isActive) {
        return res.status(400).json({ message: "Impossible de désactiver le dernier administrateur actif" });
      }
    }

    user.isActive = !user.isActive;
    await user.save();
    res.json({ id: user._id, isActive: user.isActive });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newPassword = req.body.password || generatePassword();
    user.password = newPassword;
    await user.save();

    try {
      await resend.emails.send({
        from: "TicketFlow <onboarding@resend.dev>",
        to: user.email,
        subject: "TicketFlow — Mot de passe réinitialisé",
        html: `<div style="font-family:Arial;max-width:500px;margin:0 auto;padding:30px;border:1px solid #e0e0e0;border-radius:12px;"><h2>Mot de passe réinitialisé</h2><p>Bonjour ${user.name},</p><p>Votre nouveau mot de passe : <strong>${newPassword}</strong></p><p style="font-size:13px;color:#666;">Veuillez le changer après connexion.</p></div>`,
      });
    } catch (emailErr) {
      console.log("Email error:", emailErr);
    }

    res.json({ message: "Mot de passe réinitialisé", generatedPassword: newPassword });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getTechnicians = async (req, res) => {
  try {
    if (req.user.role === 'leader') {
      const Team = require('../schemas/team');
      const team = await Team.findOne({ leaderId: req.user.id })
        .populate('members', 'name email role isActive');
      if (!team) return res.json([]);
      const techs = team.members.filter(m =>
        m.role === 'tech' && m.isActive && m._id.toString() !== req.user.id
      );
      return res.json(techs);
    }
    const techs = await User.find({ role: 'tech', isActive: true }).select('-password');
    res.json(techs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAvailableTechs = async (req, res) => {
  try {
    const Team = require('../schemas/team');
    const allTeams = await Team.find().select('members');
    const assignedIds = allTeams.flatMap(t => t.members.map(m => m.toString()));
    const techs = await User.find({
      role: 'tech',
      isActive: true,
      _id: { $nin: assignedIds },
    }).select('name email');
    res.json(techs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getMe,
  createUser,
  updateUser,
  deleteUser,
  toggleActive,
  resetPassword,
  getTechnicians,
  getAvailableTechs,
};
