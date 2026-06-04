// backend/controllers/teamController.js
const Team   = require('../schemas/team');
const User   = require('../schemas/user');
const Ticket = require('../schemas/ticket');

// ── Workload helper ──────────────────────────────────────────────────────────
const getMemberWorkload = async (member) => {
  const [assigned, resolved, active] = await Promise.all([
    Ticket.countDocuments({ assignedTo: member._id }),
    Ticket.countDocuments({ assignedTo: member._id, status: { $in: ['resolved', 'closed'] } }),
    Ticket.countDocuments({ assignedTo: member._id, status: { $in: ['assigned', 'in_progress', 'waiting'] } }),
  ]);
  const chargePercent = assigned > 0 ? Math.round((active / assigned) * 100) : 0;
  const availability  = chargePercent >= 80 ? 'overloaded' : chargePercent >= 50 ? 'busy' : 'available';
  return { _id: member._id, name: member.name, email: member.email, role: member.role, assigned, resolved, active, chargePercent, availability };
};

const buildTeamStats = async (teamId, members) => {
  const teamTickets = await Ticket.find({ teamId });
  return {
    totalTickets:   teamTickets.length,
    openTickets:    teamTickets.filter(t => t.status === 'open').length,
    pendingTickets: teamTickets.filter(t => t.status === 'pending').length,
    inProgress:     teamTickets.filter(t => t.status === 'in_progress').length,
    waiting:        teamTickets.filter(t => t.status === 'waiting').length,
    resolved:       teamTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
    totalMembers:   members.length,
    slaBreached:    teamTickets.filter(t => t.slaBreached).length,
  };
};

// ── GET my team (leader / tech) ──────────────────────────────────────────────
const getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ $or: [{ leaderId: req.user.id }, { members: req.user.id }] })
      .populate('leaderId', 'name email role')
      .populate('members', 'name email role');

    if (!team) return res.status(404).json({ message: 'Aucune équipe trouvée' });

    const membersWithStats = await Promise.all(team.members.map(getMemberWorkload));
    const stats = await buildTeamStats(team._id, team.members);

    res.json({ team, members: membersWithStats, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET team by ID (admin) ───────────────────────────────────────────────────
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leaderId', 'name email role')
      .populate('members', 'name email role');

    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    const membersWithStats = await Promise.all(team.members.map(getMemberWorkload));
    const stats = await buildTeamStats(team._id, team.members);

    res.json({ team, members: membersWithStats, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET all teams with stats (admin) ────────────────────────────────────────
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('leaderId', 'name email role')
      .populate('members', 'name email role');

    const teamsWithStats = await Promise.all(teams.map(async (team) => {
      const tickets = await Ticket.find({ teamId: team._id });
      const activeCount = tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length;
      return {
        ...team.toObject(),
        stats: {
          total:       tickets.length,
          active:      activeCount,
          open:        tickets.filter(t => t.status === 'open').length,
          pending:     tickets.filter(t => t.status === 'pending').length,
          inProgress:  tickets.filter(t => t.status === 'in_progress').length,
          waiting:     tickets.filter(t => t.status === 'waiting').length,
          resolved:    tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
          slaBreached: tickets.filter(t => t.slaBreached).length,
          members:     team.members.length,
        },
      };
    }));

    res.json(teamsWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET team tickets (leader / tech) ─────────────────────────────────────────
const getTeamTickets = async (req, res) => {
  try {
    const team = await Team.findOne({ $or: [{ leaderId: req.user.id }, { members: req.user.id }] });
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    const tickets = await Ticket.find({ teamId: team._id })
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET workload for a specific team ─────────────────────────────────────────
const getTeamWorkload = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('members', 'name email role');
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    const workload = await Promise.all(team.members.map(getMemberWorkload));
    res.json({ teamId: team._id, teamName: team.name, members: workload });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── CREATE team — Admin only ──────────────────────────────────────────────────
const createTeam = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Seul l'administrateur peut créer une équipe" });
    }

    const { name, description, category, color, tag, memberIds, leaderId } = req.body;
    if (!name || !category || !leaderId) {
      return res.status(400).json({ message: 'Nom, catégorie et leader sont requis' });
    }

    const leader = await User.findById(leaderId);
    if (!leader || leader.role !== 'leader') {
      return res.status(400).json({ message: "Le leader doit être un utilisateur avec le rôle Team Leader" });
    }

    // Auto-add leader to members
    const memberSet = new Set((memberIds || []).map(String));
    memberSet.add(String(leaderId));

    const team = await Team.create({
      name,
      description: description || '',
      category,
      color: color || '#5FC2BA',
      tag: tag || 'OTHER',
      leaderId,
      members: [...memberSet],
    });

    await team.populate('leaderId', 'name email role');
    await team.populate('members', 'name email role');
    res.status(201).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── UPDATE team — Admin only ──────────────────────────────────────────────────
const updateTeam = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Seul l'administrateur peut modifier la structure d'une équipe" });
    }

    const { name, description, category, color, tag, leaderId } = req.body;

    if (leaderId) {
      const leader = await User.findById(leaderId);
      if (!leader || leader.role !== 'leader') {
        return res.status(400).json({ message: "Le leader doit être un utilisateur avec le rôle Team Leader" });
      }
    }

    const update = {};
    if (name        !== undefined) update.name        = name;
    if (description !== undefined) update.description = description;
    if (category    !== undefined) update.category    = category;
    if (color       !== undefined) update.color       = color;
    if (tag         !== undefined) update.tag         = tag;
    if (leaderId    !== undefined) update.leaderId    = leaderId;

    const team = await Team.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('leaderId', 'name email role')
      .populate('members', 'name email role');

    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    // Ensure new leader is in members list
    if (leaderId && !team.members.some(m => m._id.toString() === leaderId)) {
      await Team.findByIdAndUpdate(req.params.id, { $addToSet: { members: leaderId } });
    }

    res.json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── ADD member — Admin or Leader of THIS team ────────────────────────────────
const addMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    const isLeaderOfThisTeam = team.leaderId.toString() === req.user.id;
    if (req.user.role !== 'admin' && !isLeaderOfThisTeam) {
      return res.status(403).json({ message: "Seul l'admin ou le leader de cette équipe peut ajouter des membres" });
    }

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId requis' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (user.role !== 'tech') {
      return res.status(400).json({ message: 'Seuls les techniciens peuvent être ajoutés à une équipe' });
    }

    const existingTeam = await Team.findOne({ members: userId, _id: { $ne: req.params.id } });
    if (existingTeam) {
      return res.status(400).json({ message: `Ce technicien est déjà membre de l'équipe "${existingTeam.name}"` });
    }

    if (team.members.map(m => m.toString()).includes(userId)) {
      return res.status(400).json({ message: "Membre déjà dans l'équipe" });
    }

    team.members.push(userId);
    await team.save();
    await User.findByIdAndUpdate(userId, { teamId: team._id });

    await team.populate('leaderId', 'name email role');
    await team.populate('members', 'name email role');
    res.json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── REMOVE member — Admin or Leader of THIS team ─────────────────────────────
const removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    const isLeaderOfThisTeam = team.leaderId.toString() === req.user.id;
    if (req.user.role !== 'admin' && !isLeaderOfThisTeam) {
      return res.status(403).json({ message: "Seul l'admin ou le leader de cette équipe peut retirer des membres" });
    }

    if (req.params.userId === team.leaderId.toString()) {
      return res.status(400).json({ message: "Impossible de retirer le leader de son équipe" });
    }

    const activeTickets = await Ticket.countDocuments({
      assignedTo: req.params.userId,
      teamId: team._id,
      status: { $nin: ['resolved', 'closed'] },
    });

    team.members = team.members.filter(m => m.toString() !== req.params.userId);
    await team.save();
    await User.findByIdAndUpdate(req.params.userId, { $unset: { teamId: 1 } });

    const warning = activeTickets > 0
      ? `${activeTickets} ticket(s) actif(s) restent assignés à ce technicien`
      : null;

    res.json({ message: 'Membre retiré', warning });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE team — Admin only ──────────────────────────────────────────────────
const deleteTeam = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Seul l'administrateur peut supprimer une équipe" });
    }

    const activeTickets = await Ticket.countDocuments({
      teamId: req.params.id,
      status: { $nin: ['resolved', 'closed'] },
    });
    if (activeTickets > 0) {
      return res.status(400).json({
        message: `Impossible : ${activeTickets} ticket(s) actif(s) sont encore assignés à cette équipe. Réassignez-les d'abord.`,
      });
    }

    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    // Cleanup resolved/closed ticket references
    await Ticket.updateMany(
      { teamId: req.params.id, status: { $in: ['resolved', 'closed'] } },
      { $unset: { teamId: 1 } }
    );
    // Cleanup member teamId fields
    await User.updateMany({ teamId: req.params.id }, { $unset: { teamId: 1 } });

    res.json({ message: 'Équipe supprimée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyTeam,
  getTeamById,
  getAllTeams,
  getTeamTickets,
  getTeamWorkload,
  createTeam,
  updateTeam,
  addMember,
  removeMember,
  deleteTeam,
};
