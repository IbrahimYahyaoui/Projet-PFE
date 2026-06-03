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
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/',                        verifyToken, getAllUsers);
router.get('/me',                      verifyToken, getMe);
router.get('/technicians',             verifyToken, getTechnicians);
router.post('/',                       verifyToken, createUser);
router.put('/:id',                     verifyToken, updateUser);
router.delete('/:id',                  verifyToken, deleteUser);
router.patch('/:id/toggle-active',     verifyToken, toggleActive);
router.post('/:id/reset-password',     verifyToken, resetPassword);

module.exports = router;
