// backend/routes/analytics.js
const express = require('express');
const { getAnalytics, getProjectAnalytics } = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/authMiddleware');

// FIX 7 — Tous les rôles authentifiés peuvent appeler analytics
// mais le controller filtre les données selon le rôle
const router = express.Router();

router.get('/',         verifyToken, getAnalytics);
router.get('/projects', verifyToken, getProjectAnalytics);

module.exports = router;
