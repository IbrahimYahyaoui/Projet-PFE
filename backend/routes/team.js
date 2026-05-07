const express = require('express');
const router = express.Router();
const {
  createTeam,
  getMyTeam,
  addMember,
  removeMember,
  deleteTeam,
  getMemberTickets,
  getMessages,
  sendMessage,
  getAvailableUsers,
} = require('../controllers/teamController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/',                   verifyToken, createTeam);
router.get('/',                    verifyToken, getMyTeam);
router.post('/members',            verifyToken, addMember);
router.delete('/members/:userId',  verifyToken, removeMember);
router.delete('/',                 verifyToken, deleteTeam);
router.get('/members/:id/tickets', verifyToken, getMemberTickets);
router.get('/messages',            verifyToken, getMessages);
router.post('/messages',           verifyToken, sendMessage);
router.get('/available-users',     verifyToken, getAvailableUsers);

module.exports = router;