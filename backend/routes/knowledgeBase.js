// backend/routes/knowledgeBase.js
const express = require('express');
const {
  getAllArticles,
  searchArticles,
  getSuggestions,
  getMyFavorites,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  incrementViews,
  markHelpful,
  addComment,
  deleteComment,
  reactToArticle,
  toggleFavorite,
  rateArticle,
} = require('../controllers/knowledgeBaseController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const verifyLeaderOrAdmin = (req, res, next) => {
  if (!['admin', 'leader'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin or Leader required' });
  }
  next();
};

const router = express.Router();

// ── Collection routes (before /:id to avoid shadowing) ──
router.get('/',            verifyToken, getAllArticles);
router.get('/search',      verifyToken, searchArticles);
router.get('/suggestions', verifyToken, getSuggestions);
router.get('/favorites',   verifyToken, getMyFavorites);
router.post('/',           verifyToken, verifyLeaderOrAdmin, createArticle);

// ── Per-article routes ──
router.get('/:id',                          verifyToken, getArticleById);
router.put('/:id',                          verifyToken, verifyLeaderOrAdmin, updateArticle);
router.delete('/:id',                       verifyToken, verifyAdmin, deleteArticle);
router.put('/:id/view',                     verifyToken, incrementViews);
router.put('/:id/helpful',                  verifyToken, markHelpful);
router.put('/:id/react',                    verifyToken, reactToArticle);
router.put('/:id/favorite',                 verifyToken, toggleFavorite);
router.post('/:id/rate',                    verifyToken, rateArticle);
router.post('/:id/comments',               verifyToken, addComment);
router.delete('/:id/comments/:commentId',  verifyToken, deleteComment);

module.exports = router;
