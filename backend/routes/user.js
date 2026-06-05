// backend/routes/user.js
const express = require('express');
const {
  getAllUsers,
  getMe,
  updateUser,
  createUser,
  deleteUser,
  toggleActive,
  resetPassword,
  getTechnicians,
  getAvailableTechs,
} = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// FIX 3 — Lecture de ses propres données : tout utilisateur connecté
router.get('/me',              verifyToken,              getMe);
router.get('/technicians',     verifyToken,              getTechnicians);
router.get('/available-techs', verifyToken,              getAvailableTechs);

// FIX 3 — Administration : admin uniquement
router.get('/',                verifyToken, verifyAdmin, getAllUsers);
router.post('/',               verifyToken, verifyAdmin, createUser);
router.put('/:id',             verifyToken, verifyAdmin, updateUser);
router.delete('/:id',          verifyToken, verifyAdmin, deleteUser);
router.patch('/:id/toggle-active',  verifyToken, verifyAdmin, toggleActive);
router.post('/:id/reset-password',  verifyToken, verifyAdmin, resetPassword);

module.exports = router;
