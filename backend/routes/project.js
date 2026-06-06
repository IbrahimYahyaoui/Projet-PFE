// backend/routes/project.js
const express = require('express');
const {
  getAllProjects, getProjectById, createProject, updateProject, deleteProject,
  addMember, removeMember, getProjectTasks, createTask, updateTask, deleteTask,
  addComment, getProjectStats,
} = require('../controllers/projectController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const Project = require('../schemas/project');

// Middleware : accès lecture au projet (admin, leader membre, tech membre)
const verifyProjectAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet non trouvé' });
    const isMember = project.members.some(m => m.toString() === req.user.id) ||
      project.managerId?.toString() === req.user.id;
    if (!isMember) return res.status(403).json({ message: "Accès refusé" });
    next();
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// Middleware : leader du projet uniquement (pas admin)
const verifyProjectLeader = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet non trouvé' });
    const isManager = project.managerId?.toString() === req.user.id ||
      project.createdBy?.toString() === req.user.id;
    if (req.user.role !== 'leader' || !isManager) {
      return res.status(403).json({ message: "Seul le leader responsable du projet peut faire cela" });
    }
    next();
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

const router = express.Router();

// Projets — CRUD
router.get('/stats', verifyToken, verifyAdmin, getProjectStats);
router.get('/',      verifyToken, getAllProjects);
router.get('/:id',   verifyToken, verifyProjectAccess, getProjectById);

// Admin seul : créer, modifier infos, supprimer
router.post('/',      verifyToken, verifyAdmin, createProject);
router.put('/:id',    verifyToken, verifyAdmin, updateProject);
router.delete('/:id', verifyToken, verifyAdmin, deleteProject);

// Leader seul : gérer les membres
router.post('/:id/members',           verifyToken, verifyProjectLeader, addMember);
router.delete('/:id/members/:userId', verifyToken, verifyProjectLeader, removeMember);

// Tâches
router.get('/:id/tasks',  verifyToken, verifyProjectAccess, getProjectTasks);
// Leader seul : créer et supprimer des tâches
router.post('/:id/tasks',           verifyToken, verifyProjectLeader, createTask);
router.delete('/:id/tasks/:taskId', verifyToken, verifyProjectLeader, deleteTask);
// Modifier une tâche : leader (titre/priorité/assigné) ou tech (statut uniquement)
router.put('/:id/tasks/:taskId', verifyToken, verifyProjectAccess, updateTask);
// Commenter : tous les membres + admin
router.post('/:id/tasks/:taskId/comments', verifyToken, verifyProjectAccess, addComment);

module.exports = router;
