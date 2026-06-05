// backend/routes/project.js
const express = require('express');
const {
  getAllProjects, getProjectById, createProject, updateProject, deleteProject,
  addMember, removeMember, getProjectTasks, createTask, updateTask, deleteTask,
  addComment, getProjectStats,
} = require('../controllers/projectController');
const { verifyToken, verifyManagerOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Read access: all authenticated users with canSeeProjects permission (enforced frontend + role filter backend)
router.get('/stats',                    verifyToken, getProjectStats);
router.get('/',                         verifyToken, getAllProjects);
router.get('/:id',                      verifyToken, getProjectById);

// Write access: admin or leader only for project management
router.post('/',                        verifyToken, verifyManagerOrAdmin, createProject);
router.put('/:id',                      verifyToken, updateProject);       // controller checks ownership
router.delete('/:id',                   verifyToken, verifyManagerOrAdmin, deleteProject);
router.post('/:id/members',             verifyToken, verifyManagerOrAdmin, addMember);
router.delete('/:id/members/:userId',   verifyToken, verifyManagerOrAdmin, removeMember);

// Task access: members can read, write is role-restricted in controller
router.get('/:id/tasks',                verifyToken, getProjectTasks);
router.post('/:id/tasks',               verifyToken, verifyManagerOrAdmin, createTask);
router.put('/:id/tasks/:taskId',        verifyToken, updateTask);          // controller restricts tech
router.delete('/:id/tasks/:taskId',     verifyToken, verifyManagerOrAdmin, deleteTask);
router.post('/:id/tasks/:taskId/comments', verifyToken, addComment);

module.exports = router;