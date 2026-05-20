// backend/controllers/teamController.js
const Team   = require('../schemas/team');
const User   = require('../schemas/user');
const Ticket = require('../schemas/ticket');

// ── GET mon équipe ──
const getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ members: req.user.id })
      .populate('leaderId', 'name email role')
      .populate('members', 'name email role');

    if (!team) {
      return res.status(404).json({ message: 'Aucune équipe trouvée' });
    }

    // Stats membres
    const membersWithStats = await Promise.all(
      team.members.map(async (member) => {
        const assigned = await Ticket.countDocuments({ assignedTo: member._id });
        const resolved = await Ticket.countDocuments({
          assignedTo: member._id,
          status: { $in: ['resolved', 'closed'] },
        });
        const active = await Ticket.countDocuments({
          assignedTo: member._id,
          status: { $in: ['open', 'in_progress'] },
        });

        const chargePercent = assigned > 0 ? Math.round((active / assigned) * 100) : 0;
        const availability =
          chargePercent >= 80 ? 'overloaded' :
          chargePercent >= 50 ? 'busy' : 'available';

        return {
          _id:          member._id,
          name:         member.name,
          email:        member.email,
          role:         member.role,
          assigned,
          resolved,
          active,
          chargePercent,
          availability,
        };
      })
    );

    // Stats équipe
    const teamTickets = await Ticket.find({ category: team.category });
    const stats = {
      totalTickets:  teamTickets.length,
      openTickets:   teamTickets.filter(t => t.status === 'open').length,
      inProgress:    teamTickets.filter(t => t.status === 'in_progress').length,
      resolved:      teamTickets.filter(t => ['resolved','closed'].includes(t.status)).length,
      totalMembers:  team.members.length,
    };

    res.json({ team, members: membersWithStats, stats });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET toutes les équipes (admin) ──
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('leaderId', 'name email role')
      .populate('members', 'name email role');

    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const tickets  = await Ticket.find({ category: team.category });
        const open     = tickets.filter(t => t.status === 'open').length;
        const inProg   = tickets.filter(t => t.status === 'in_progress').length;
        const resolved = tickets.filter(t => ['resolved','closed'].includes(t.status)).length;

        return {
          ...team.toObject(),
          stats: {
            total:    tickets.length,
            open,
            inProgress: inProg,
            resolved,
            members: team.members.length,
          },
        };
      })
    );

    res.json(teamsWithStats);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET tickets de mon équipe ──
const getTeamTickets = async (req, res) => {
  try {
    const team = await Team.findOne({ members: req.user.id });
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    const tickets = await Ticket.find({ category: team.category })
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── CREATE équipe ──
const createTeam = async (req, res) => {
  try {
    const { name, description, category, color, memberIds } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: 'Nom et catégorie requis' });
    }

    const team = new Team({
      name,
      description,
      category,
      color: color || '#5FC2BA',
      leaderId: req.user.id,
      members: memberIds || [req.user.id],
    });

    await team.save();
    await team.populate('leaderId', 'name email role');
    await team.populate('members', 'name email role');

    res.status(201).json(team);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── UPDATE équipe ──
const updateTeam = async (req, res) => {
  try {
    const { name, description, category, color } = req.body;
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { name, description, category, color },
      { new: true }
    )
      .populate('leaderId', 'name email role')
      .populate('members', 'name email role');

    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });
    res.json(team);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── ADD member ──
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    if (team.members.includes(userId)) {
      return res.status(400).json({ message: 'Membre déjà dans l\'équipe' });
    }

    team.members.push(userId);
    await team.save();
    await team.populate('members', 'name email role');
    res.json(team);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── REMOVE member ──
const removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    team.members = team.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await team.save();
    res.json(team);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE équipe ──
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });
    res.json({ message: 'Équipe supprimée' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyTeam,
  getAllTeams,
  getTeamTickets,
  createTeam,
  updateTeam,
  addMember,
  removeMember,
  deleteTeam,
};