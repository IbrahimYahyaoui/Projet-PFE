// backend/routes/history.js
const express = require('express');
const { getTicketHistory } = require('../controllers/historyController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:id', verifyToken, getTicketHistory);

module.exports = router;