// backend/routes/project.js
const express = require('express');
const {
  getAllProjects, getProjectById, createProject, updateProject, deleteProject,
  addMember, removeMember, getProjectTasks, createTask, updateTask, deleteTask,
  addComment, getProjectStats,
} = require('../controllers/projectController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const Project = require('../schemas/project');

// FIX 6 — Admin ou Leader uniquement
const verifyManagerOrAdmin = (req, res, next) => {
  if (['admin', 'leader'].includes(req.user.role)) return next();
  return res.status(403).json({ message: 'Admin ou Leader requis' });
};

// FIX 6 — Membre du projet, leader ou admin
const verifyProjectAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet non trouvé' });
    const isMember = project.members.some(m => m.toString() === req.user.id) ||
      project.managerId?.toString() === req.user.id;
    if (!isMember) return res.status(403).json({ message: "Accès refusé : vous n'êtes pas membre de ce projet" });
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const router = express.Router();

router.get('/stats',    verifyToken, verifyManagerOrAdmin, getProjectStats);
router.get('/',         verifyToken, getAllProjects);          // controller filtre par rôle
router.get('/:id',      verifyToken, verifyProjectAccess, getProjectById);

router.post('/',        verifyToken, verifyManagerOrAdmin, createProject);
router.put('/:id',      verifyToken, verifyManagerOrAdmin, updateProject);
router.delete('/:id',   verifyToken, verifyAdmin,          deleteProject); // admin seulement

router.post('/:id/members',           verifyToken, verifyManagerOrAdmin, addMember);
router.delete('/:id/members/:userId', verifyToken, verifyManagerOrAdmin, removeMember);

router.get('/:id/tasks',              verifyToken, verifyProjectAccess, getProjectTasks);
router.post('/:id/tasks',             verifyToken, verifyManagerOrAdmin, createTask);
router.put('/:id/tasks/:taskId',      verifyToken, verifyProjectAccess,  updateTask); // controller restreint tech
router.delete('/:id/tasks/:taskId',   verifyToken, verifyManagerOrAdmin, deleteTask);
router.post('/:id/tasks/:taskId/comments', verifyToken, verifyProjectAccess, addComment);

module.exports = router;
