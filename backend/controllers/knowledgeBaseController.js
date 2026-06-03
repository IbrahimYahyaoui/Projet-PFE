// backend/controllers/knowledgeBaseController.js
const KnowledgeBase = require('../schemas/knowledgeBase');

// ── GET all articles (paginated + filterable) ──
const getAllArticles = async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [articles, total] = await Promise.all([
      KnowledgeBase.find(filter)
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      KnowledgeBase.countDocuments(filter),
    ]);

    res.json({ articles, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET search articles ──
const searchArticles = async (req, res) => {
  try {
    const { q, category } = req.query;
    if (!q?.trim()) return res.json({ articles: [] });

    const filter = { $text: { $search: q } };
    if (category && category !== 'all') filter.category = category;

    const articles = await KnowledgeBase.find(filter, { score: { $meta: 'textScore' } })
      .populate('createdBy', 'name role')
      .sort({ score: { $meta: 'textScore' } })
      .limit(10);

    res.json({ articles });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET article by ID ──
const getArticleById = async (req, res) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('updatedBy', 'name role')
      .populate('sourceTicket', 'title category');
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── CREATE article (admin or leader) ──
const createArticle = async (req, res) => {
  try {
    const { title, content, category, tags, sourceTicket } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const article = await KnowledgeBase.create({
      title: title.trim(),
      content: content.trim(),
      category: category || 'general',
      tags: Array.isArray(tags) ? tags : [],
      sourceTicket: sourceTicket || null,
      createdBy: req.user.id,
    });
    await article.populate('createdBy', 'name role');
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── UPDATE article ──
const updateArticle = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const article = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { title, content, category, tags, updatedBy: req.user.id },
      { new: true }
    )
      .populate('createdBy', 'name role')
      .populate('updatedBy', 'name role');

    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE article (admin only) ──
const deleteArticle = async (req, res) => {
  try {
    const article = await KnowledgeBase.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Increment views ──
const incrementViews = async (req, res) => {
  try {
    await KnowledgeBase.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Mark helpful ──
const markHelpful = async (req, res) => {
  try {
    const article = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpful: 1 } },
      { new: true }
    );
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json({ helpful: article.helpful });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllArticles,
  searchArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  incrementViews,
  markHelpful,
};
