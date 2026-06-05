// backend/routes/analytics.js
const express = require('express');
const { getAnalytics, getProjectAnalytics } = require('../controllers/analyticsController');
const { verifyToken, verifyAnalyticsAccess } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/',        verifyToken, verifyAnalyticsAccess, getAnalytics);
router.get('/projects',verifyToken, verifyAnalyticsAccess, getProjectAnalytics);

module.exports = router;
