// backend/routes/project.js
const express = require('express');
const {
  getAllProjects, getProjectById, createProject, updateProject, deleteProject,
  addMember, removeMember, getProjectTasks, createTask, updateTask, deleteTask,
  addComment, getProjectStats,
} = require('../controllers/projectController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats',                    verifyToken, getProjectStats);
router.get('/',                         verifyToken, getAllProjects);
router.get('/:id',                      verifyToken, getProjectById);
router.post('/',                        verifyToken, createProject);
router.put('/:id',                      verifyToken, updateProject);
router.delete('/:id',                   verifyToken, deleteProject);
router.post('/:id/members',             verifyToken, addMember);
router.delete('/:id/members/:userId',   verifyToken, removeMember);
router.get('/:id/tasks',                verifyToken, getProjectTasks);
router.post('/:id/tasks',               verifyToken, createTask);
router.put('/:id/tasks/:taskId',        verifyToken, updateTask);
router.delete('/:id/tasks/:taskId',     verifyToken, deleteTask);
router.post('/:id/tasks/:taskId/comments', verifyToken, addComment);

module.exports = router;