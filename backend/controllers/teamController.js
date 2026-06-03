// backend/controllers/teamController.js
const Team   = require('../schemas/team');
const User   = require('../schemas/user');
const Ticket = require('../schemas/ticket');

// ── Workload helper ──
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

// ── GET my team ──
const getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({
      $or: [{ leaderId: req.user.id }, { members: req.user.id }],
    })
      .populate('leaderId', 'name email role')
      .populate('members', 'name email role');

    if (!team) return res.status(404).json({ message: 'Aucune équipe trouvée' });

    const membersWithStats = await Promise.all(team.members.map(getMemberWorkload));

    // Stats use teamId now
    const teamTickets = await Ticket.find({ teamId: team._id });
    const stats = {
      totalTickets: teamTickets.length,
      openTickets:  teamTickets.filter(t => t.status === 'open').length,
      inProgress:   teamTickets.filter(t => t.status === 'in_progress').length,
      waiting:      teamTickets.filter(t => t.status === 'waiting').length,
      resolved:     teamTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
      totalMembers: team.members.length,
      slaBreached:  teamTickets.filter(t => t.slaBreached).length,
    };

    res.json({ team, members: membersWithStats, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET all teams (admin) ──
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('leaderId', 'name email role')
      .populate('members', 'name email role');

    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const tickets  = await Ticket.find({ teamId: team._id });
        return {
          ...team.toObject(),
          stats: {
            total:      tickets.length,
            open:       tickets.filter(t => t.status === 'open').length,
            inProgress: tickets.filter(t => t.status === 'in_progress').length,
            waiting:    tickets.filter(t => t.status === 'waiting').length,
            resolved:   tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
            slaBreached:tickets.filter(t => t.slaBreached).length,
            members:    team.members.length,
          },
        };
      })
    );

    res.json(teamsWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET team tickets (by teamId) ──
const getTeamTickets = async (req, res) => {
  try {
    const team = await Team.findOne({
      $or: [{ leaderId: req.user.id }, { members: req.user.id }],
    });
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

// ── GET workload for a specific team (used before assignment) ──
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

// ── CREATE team ──
const createTeam = async (req, res) => {
  try {
    const { name, description, category, color, tag, memberIds, leaderId } = req.body;
    if (!name || !category) return res.status(400).json({ message: 'Nom et catégorie requis' });

    const resolvedLeaderId = leaderId || req.user.id;

    const team = await Team.create({
      name,
      description,
      category,
      color: color || '#5FC2BA',
      tag: tag || 'GEN',
      leaderId: resolvedLeaderId,
      members: memberIds?.length ? memberIds : [resolvedLeaderId],
    });

    await team.populate('leaderId', 'name email role');
    await team.populate('members', 'name email role');
    res.status(201).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── UPDATE team ──
const updateTeam = async (req, res) => {
  try {
    const { name, description, category, color, tag, leaderId } = req.body;
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { name, description, category, color, tag, leaderId },
      { new: true }
    )
      .populate('leaderId', 'name email role')
      .populate('members', 'name email role');

    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── ADD member ──
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });
    if (team.members.map(m => m.toString()).includes(userId)) {
      return res.status(400).json({ message: 'Membre déjà dans l\'équipe' });
    }
    team.members.push(userId);
    await team.save();
    await team.populate('members', 'name email role');
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── REMOVE member ──
const removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });
    team.members = team.members.filter(m => m.toString() !== req.params.userId);
    await team.save();
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE team ──
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });
    res.json({ message: 'Équipe supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyTeam,
  getAllTeams,
  getTeamTickets,
  getTeamWorkload,
  createTeam,
  updateTeam,
  addMember,
  removeMember,
  deleteTeam,
};
