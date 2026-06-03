// backend/routes/team.js
const express = require('express');
const {
  getMyTeam,
  getAllTeams,
  getTeamTickets,
  getTeamWorkload,
  createTeam,
  updateTeam,
  addMember,
  removeMember,
  deleteTeam,
} = require('../controllers/teamController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/all',                    verifyToken, getAllTeams);
router.get('/my',                     verifyToken, getMyTeam);
router.get('/my/tickets',             verifyToken, getTeamTickets);
router.get('/:id/workload',           verifyToken, getTeamWorkload);
router.post('/',                      verifyToken, createTeam);
router.put('/:id',                    verifyToken, updateTeam);
router.post('/:id/members',           verifyToken, addMember);
router.delete('/:id/members/:userId', verifyToken, removeMember);
router.delete('/:id',                 verifyToken, deleteTeam);

module.exports = router;
