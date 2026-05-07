const Team = require('../schemas/team');
const User = require('../schemas/user');
const Ticket = require('../schemas/ticket');
const Message = require('../schemas/message');

const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Team name is required' });
    }
    const existingTeam = await Team.findOne({ leaderId: req.user.id });
    if (existingTeam) {
      return res.status(400).json({ message: 'Vous avez déjà une équipe' });
    }
    const team = await Team.create({
      name: name.trim(),
      description: description?.trim() || '',
      leaderId: req.user.id,
      members: [req.user.id],
    });
    await User.findByIdAndUpdate(req.user.id, { teamId: team._id });
    await team.populate('leaderId', 'name email role');
    res.status(201).json(team);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({
      $or: [{ leaderId: req.user.id }, { members: req.user.id }],
    })
      .populate('leaderId', 'name email role')
      .populate('members', 'name email role createdAt');

    if (!team) return res.json(null);

    const membersWithStats = await Promise.all(
      team.members.map(async (member) => {
        const assigned = await Ticket.countDocuments({
          assignedTo: member._id,
          status: { $nin: ['resolved', 'closed'] },
        });
        const resolved = await Ticket.countDocuments({
          assignedTo: member._id,
          status: { $in: ['resolved', 'closed'] },
        });

        let availability = 'available';
        if (assigned >= 7) availability = 'overloaded';
        else if (assigned >= 4) availability = 'busy';

        const chargePercent = Math.min(Math.round((assigned / 10) * 100), 100);

        return {
          _id: member._id,
          name: member.name,
          email: member.email,
          role: member.role,
          createdAt: member.createdAt,
          assigned,
          resolved,
          availability,
          chargePercent,
        };
      })
    );

    const memberIds = team.members.map((m) => m._id);
    const totalActive = await Ticket.countDocuments({
      assignedTo: { $in: memberIds },
      status: { $nin: ['resolved', 'closed'] },
    });
    const totalResolved = await Ticket.countDocuments({
      assignedTo: { $in: memberIds },
      status: { $in: ['resolved', 'closed'] },
    });
    const totalLate = await Ticket.countDocuments({
      assignedTo: { $in: memberIds },
      status: { $nin: ['resolved', 'closed'] },
      createdAt: { $lt: new Date(Date.now() - 72 * 3600000) },
    });

    res.json({
      team: {
        _id: team._id,
        name: team.name,
        description: team.description,
        leaderId: team.leaderId,
        createdAt: team.createdAt,
      },
      members: membersWithStats,
      stats: {
        totalActive,
        totalResolved,
        totalLate,
        totalMembers: membersWithStats.length,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findOne({ leaderId: req.user.id });
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    const userToAdd = await User.findById(userId);
    if (!userToAdd) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (userToAdd.teamId) return res.status(400).json({ message: 'Cet utilisateur est déjà dans une équipe' });
    if (team.members.includes(userId)) return res.status(400).json({ message: 'Déjà membre de cette équipe' });

    team.members.push(userId);
    await team.save();
    await User.findByIdAndUpdate(userId, { teamId: team._id });
    res.json({ message: 'Membre ajouté avec succès' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  try {
    const team = await Team.findOne({ leaderId: req.user.id });
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });
    if (req.params.userId === req.user.id) return res.status(400).json({ message: 'Vous ne pouvez pas vous retirer vous-même' });

    team.members = team.members.filter((m) => m.toString() !== req.params.userId);
    await team.save();
    await User.findByIdAndUpdate(req.params.userId, { teamId: null });
    res.json({ message: 'Membre retiré avec succès' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ leaderId: req.user.id });
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    await User.updateMany({ teamId: team._id }, { teamId: null });
    await Team.findByIdAndDelete(team._id);
    res.json({ message: 'Équipe supprimée' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMemberTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedTo: req.params.id })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(tickets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMessages = async (req, res) => {
  try {
    const team = await Team.findOne({
      $or: [{ leaderId: req.user.id }, { members: req.user.id }],
    });
    if (!team) return res.json([]);

    const messages = await Message.find({ teamId: team._id })
      .populate('userId', 'name role')
      .sort({ createdAt: 1 })
      .limit(50);
    res.json(messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content is required' });

    const team = await Team.findOne({
      $or: [{ leaderId: req.user.id }, { members: req.user.id }],
    });
    if (!team) return res.status(404).json({ message: 'Équipe non trouvée' });

    const message = await Message.create({
      teamId: team._id,
      userId: req.user.id,
      content: content.trim(),
    });
    await message.populate('userId', 'name role');
    res.status(201).json(message);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAvailableUsers = async (req, res) => {
  try {
    const users = await User.find({ teamId: null }).select('-password');
    const filtered = users.filter((u) => u._id.toString() !== req.user.id);
    res.json(filtered);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTeam,
  getMyTeam,
  addMember,
  removeMember,
  deleteTeam,
  getMemberTickets,
  getMessages,
  sendMessage,
  getAvailableUsers,
};