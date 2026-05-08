// backend/routes/analytics.js
const express = require('express');
const { getAnalytics } = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, getAnalytics);

module.exports = router;