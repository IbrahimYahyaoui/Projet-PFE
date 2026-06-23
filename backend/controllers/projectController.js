// backend/controllers/projectController.js
const Project = require('../schemas/project');
const ProjectTask = require('../schemas/projectTask');
const User = require('../schemas/user');
const Team = require('../schemas/team');

// ── GET tous les projets (filtrés par rôle) ──
const getAllProjects = async (req, res) => {
  try {
    const { role, id } = req.user;

    // FIX 6 — employé ne voit aucun projet
    if (role === 'user') return res.json([]);

    let filter = {};
    if (role === 'leader') {
      // leader : projets qu'il manage ou dont il est membre
      filter = { $or: [{ managerId: id }, { members: id }, { createdBy: id }] };
    } else if (role === 'tech') {
      // tech : uniquement les projets dont il est membre
      filter = { members: id };
    }
    // admin : filter vide = tous les projets

    const projects = await Project.find(filter)
      .populate('createdBy', 'name email role')
      .populate('managerId', 'name email role')
      .populate('members', 'name email role')
      .populate('teamId', 'name color tag')
      .sort({ createdAt: -1 });

    // Ajouter stats pour chaque projet
    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
        const totalTasks = await ProjectTask.countDocuments({ projectId: p._id });
        const doneTasks  = await ProjectTask.countDocuments({ projectId: p._id, status: 'done' });
        const progress   = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
        return { ...p.toObject(), progress, totalTasks, doneTasks };
      })
    );

    res.json(projectsWithStats);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET projet by ID ──
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('managerId', 'name email role')
      .populate('members', 'name email role');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const totalTasks = await ProjectTask.countDocuments({ projectId: project._id });
    const doneTasks = await ProjectTask.countDocuments({ projectId: project._id, status: 'done' });
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    res.json({ ...project.toObject(), progress, totalTasks, doneTasks });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── CREATE projet ──
const createProject = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Seul l'admin peut créer un projet" });
    }
    const { name, description, priority, startDate, endDate, color, teamId } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });

    let projectMembers = [];
    let projectManager = null;
    let resolvedTeamId = teamId || null;

    if (teamId) {
      const team = await Team.findById(teamId).populate('members', '_id').populate('leaderId', '_id');
      if (team) {
        const memberIds = team.members.map(m => m._id.toString());
        const leaderId  = team.leaderId?._id?.toString();
        const allIds    = new Set([...memberIds, ...(leaderId ? [leaderId] : [])]);
        projectMembers  = Array.from(allIds);
        projectManager  = team.leaderId?._id || null;
      }
    }

    const project = await Project.create({
      name:        name.trim(),
      description: description?.trim() || '',
      priority:    priority || 'medium',
      startDate:   startDate || null,
      endDate:     endDate   || null,
      color:       color     || '#1C2942',
      managerId:   projectManager,
      createdBy:   req.user.id,
      members:     projectMembers,
      teamId:      resolvedTeamId,
    });

    await project.populate('createdBy', 'name email role');
    await project.populate('managerId', 'name email role');
    await project.populate('members', 'name email role');
    await project.populate('teamId', 'name color tag');
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── UPDATE projet (admin uniquement) ──
const updateProject = async (req, res) => {
  try {
    const existing = await Project.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Project not found' });

    const { name, description, status, priority, startDate, endDate, color, managerId } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status, priority, startDate, endDate, color, managerId },
      { new: true }
    )
      .populate('createdBy', 'name email role')
      .populate('managerId', 'name email role')
      .populate('members', 'name email role');

    res.json(project);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE projet ──
const deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await ProjectTask.deleteMany({ projectId: req.params.id });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── ADD membre ──
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.members.includes(userId)) return res.status(400).json({ message: 'Already a member' });
    project.members.push(userId);
    await project.save();
    res.json({ message: 'Member added' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── REMOVE membre ──
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.members = project.members.filter(m => m.toString() !== req.params.userId);
    await project.save();
    res.json({ message: 'Member removed' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET tasks d'un projet ──
const getProjectTasks = async (req, res) => {
  try {
    const tasks = await ProjectTask.find({ projectId: req.params.id })
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('comments.userId', 'name')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── CREATE task ──
const createTask = async (req, res) => {
  try {
    const { title, description, priority, assignedTo, dueDate, status } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    const task = await ProjectTask.create({
      projectId: req.params.id,
      title: title.trim(),
      description: description?.trim() || '',
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      status: status || 'todo',
      createdBy: req.user.id,
    });

    await task.populate('assignedTo', 'name email role');
    await task.populate('createdBy', 'name email role');
    res.status(201).json(task);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── UPDATE task ──
const updateTask = async (req, res) => {
  try {
    const { role, id } = req.user;
    const task = await ProjectTask.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // TECH : uniquement le statut de ses propres tâches
    if (role === 'tech') {
      const isAssigned = task.assignedTo?.toString() === id;
      if (!isAssigned) {
        return res.status(403).json({ message: 'Cette tâche ne vous est pas assignée' });
      }
      if (!req.body.status) {
        return res.status(400).json({ message: 'status requis' });
      }
      const validStatuses = ['todo', 'in_progress', 'review', 'done'];
      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: 'Statut invalide' });
      }
      const updated = await ProjectTask.findByIdAndUpdate(
        req.params.taskId,
        { status: req.body.status },
        { new: true }
      ).populate('assignedTo', 'name email role').populate('createdBy', 'name email role');
      return res.json(updated);
    }

    // LEADER : peut modifier tout SAUF le statut
    if (role === 'leader') {
      if (req.body.status !== undefined && req.body.status !== task.status) {
        return res.status(403).json({
          message: "Le leader ne change pas le statut. C'est le rôle du technicien assigné."
        });
      }
      const { title, description, priority, assignedTo, dueDate } = req.body;
      const updated = await ProjectTask.findByIdAndUpdate(
        req.params.taskId,
        { ...(title && { title }), ...(description !== undefined && { description }),
          ...(priority && { priority }), ...(assignedTo !== undefined && { assignedTo }),
          ...(dueDate !== undefined && { dueDate }) },
        { new: true }
      ).populate('assignedTo', 'name email role').populate('createdBy', 'name email role');
      return res.json(updated);
    }

    return res.status(403).json({ message: 'Non autorisé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE task ──
const deleteTask = async (req, res) => {
  try {
    await ProjectTask.findByIdAndDelete(req.params.taskId);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── ADD comment ──
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });
    const task = await ProjectTask.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.comments.push({ content: content.trim(), userId: req.user.id });
    await task.save();
    await task.populate('comments.userId', 'name');
    res.status(201).json(task);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET stats globales projets ──
const getProjectStats = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const totalTasks = await ProjectTask.countDocuments();
    const doneTasks = await ProjectTask.countDocuments({ status: 'done' });
    const overdueTasks = await ProjectTask.countDocuments({
      status: { $nin: ['done'] },
      dueDate: { $lt: new Date() },
    });
    const totalMembers = await User.countDocuments({ role: { $in: ['admin', 'tech', 'user'] } });

    res.json({ totalProjects, totalTasks, doneTasks, overdueTasks, totalMembers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  getProjectStats,
};