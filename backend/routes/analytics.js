// backend/routes/analytics.js
const express = require('express');
const { getAnalytics, getProjectAnalytics } = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/',        verifyToken, getAnalytics);
router.get('/projects',verifyToken, getProjectAnalytics);

module.exports = router;
