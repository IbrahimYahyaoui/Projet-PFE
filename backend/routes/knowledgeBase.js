// backend/routes/knowledgeBase.js
const express = require('express');
const {
  getAllArticles,
  searchArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  incrementViews,
  markHelpful,
} = require('../controllers/knowledgeBaseController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const verifyLeaderOrAdmin = (req, res, next) => {
  if (!['admin', 'leader'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin or Leader required' });
  }
  next();
};

const router = express.Router();

router.get('/',           verifyToken, getAllArticles);
router.get('/search',     verifyToken, searchArticles);
router.get('/:id',        verifyToken, getArticleById);
router.post('/',          verifyToken, verifyLeaderOrAdmin, createArticle);
router.put('/:id',        verifyToken, verifyLeaderOrAdmin, updateArticle);
router.delete('/:id',     verifyToken, verifyAdmin, deleteArticle);
router.put('/:id/view',   verifyToken, incrementViews);
router.put('/:id/helpful',verifyToken, markHelpful);

module.exports = router;
