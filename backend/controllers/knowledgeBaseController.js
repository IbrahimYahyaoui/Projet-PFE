// backend/controllers/knowledgeBaseController.js
const KnowledgeBase = require('../schemas/knowledgeBase');
const Team = require('../schemas/team');

// ── Visibility filter builder ──
const buildVisibilityFilter = async (role, userId) => {
  if (role === 'admin') return {};
  const base = { status: 'published', 'visibility.roles': role };
  if (role === 'user') return { ...base, 'visibility.teamIds': { $size: 0 } };
  const team = await Team.findOne({ $or: [{ leaderId: userId }, { members: userId }] }).select('_id');
  if (team) {
    return {
      ...base,
      $or: [{ 'visibility.teamIds': { $size: 0 } }, { 'visibility.teamIds': team._id }],
    };
  }
  return { ...base, 'visibility.teamIds': { $size: 0 } };
};

// ── Enrich article with per-user virtual fields ──
const enrichArticle = (article, userId) => {
  const obj = typeof article.toObject === 'function' ? article.toObject() : article;
  return {
    ...obj,
    isFavorited: obj.favorites?.some(id => id?.toString() === userId) ?? false,
    userReaction: obj.reactions?.find(r => r.userId?.toString() === userId)?.type ?? null,
    reactionCounts: {
      like:     obj.reactions?.filter(r => r.type === 'like').length    ?? 0,
      helpful:  obj.reactions?.filter(r => r.type === 'helpful').length  ?? 0,
      outdated: obj.reactions?.filter(r => r.type === 'outdated').length ?? 0,
    },
  };
};

// ── GET all articles (paginated + filterable) ──
const getAllArticles = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { category, subcategory, tag, status, page = 1, limit = 20 } = req.query;

    const visFilter = await buildVisibilityFilter(role, userId);
    const filter = { ...visFilter };

    if (status && ['admin', 'leader'].includes(role)) filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (subcategory?.trim()) filter.subcategory = { $regex: subcategory.trim(), $options: 'i' };
    if (tag?.trim()) filter.tags = tag.trim().toLowerCase();

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [articles, total] = await Promise.all([
      KnowledgeBase.find(filter)
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      KnowledgeBase.countDocuments(filter),
    ]);

    res.json({
      articles: articles.map(a => enrichArticle(a, userId)),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET search articles ──
const searchArticles = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { q, category } = req.query;
    if (!q?.trim()) return res.json({ articles: [] });

    const visFilter = await buildVisibilityFilter(role, userId);
    const filter = { ...visFilter, $text: { $search: q } };
    if (category && category !== 'all') filter.category = category;

    const articles = await KnowledgeBase.find(filter, { score: { $meta: 'textScore' } })
      .populate('createdBy', 'name role')
      .sort({ score: { $meta: 'textScore' } })
      .limit(10);

    res.json({ articles: articles.map(a => enrichArticle(a, userId)) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET suggestions (typeahead, min 3 chars) ──
const getSuggestions = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { q } = req.query;
    if (!q?.trim() || q.trim().length < 3) return res.json([]);

    const visFilter = await buildVisibilityFilter(role, userId);
    const filter = { ...visFilter, $text: { $search: q } };

    const articles = await KnowledgeBase.find(filter, { score: { $meta: 'textScore' } })
      .select('title category subcategory')
      .sort({ score: { $meta: 'textScore' } })
      .limit(5);

    res.json(articles);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET my favorites ──
const getMyFavorites = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const visFilter = await buildVisibilityFilter(role, userId);
    const filter = { ...visFilter, favorites: userId };

    const articles = await KnowledgeBase.find(filter)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      articles: articles.map(a => enrichArticle(a, userId)),
      total: articles.length,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET article by ID ──
const getArticleById = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const article = await KnowledgeBase.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('updatedBy', 'name role')
      .populate('sourceTicket', 'title category')
      .populate('comments.userId', 'name role');

    if (!article) return res.status(404).json({ message: 'Article not found' });

    if (role !== 'admin') {
      if (article.status !== 'published') return res.status(403).json({ message: 'Article non publié' });
      if (!article.visibility.roles.includes(role)) return res.status(403).json({ message: 'Accès interdit' });
      if (article.visibility.teamIds.length > 0) {
        const team = await Team.findOne({ $or: [{ leaderId: userId }, { members: userId }] }).select('_id');
        const hasAccess = team && article.visibility.teamIds.some(t => t.toString() === team._id.toString());
        if (!hasAccess) return res.status(403).json({ message: 'Accès interdit à votre équipe' });
      }
    }

    res.json(enrichArticle(article, userId));
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── CREATE article (admin or leader) ──
const createArticle = async (req, res) => {
  try {
    const { title, content, category, tags, sourceTicket, subcategory, status, visibility } = req.body;
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
      subcategory: subcategory?.trim() || '',
      status: status || 'published',
      ...(visibility ? { visibility } : {}),
    });
    await article.populate('createdBy', 'name role');
    res.status(201).json(article);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── UPDATE article ──
const updateArticle = async (req, res) => {
  try {
    const { title, content, category, tags, subcategory, status, visibility } = req.body;
    const update = { title, content, category, tags, updatedBy: req.user.id };
    if (subcategory !== undefined) update.subcategory = subcategory;
    if (status      !== undefined) update.status      = status;
    if (visibility  !== undefined) update.visibility  = visibility;

    const article = await KnowledgeBase.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('createdBy', 'name role')
      .populate('updatedBy', 'name role');

    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (err) {
    console.log(err);
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
    console.log(err);
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

// ── Mark helpful (legacy backward compat) ──
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

// ── ADD comment ──
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });

    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    article.comments.push({ content: content.trim(), userId: req.user.id });
    await article.save();
    await article.populate('comments.userId', 'name role');

    const newComment = article.comments[article.comments.length - 1];
    res.status(201).json(newComment);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE comment (own comment or admin) ──
const deleteComment = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const comment = article.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (role !== 'admin' && comment.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    comment.deleteOne();
    await article.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── React to article (toggle) ──
const reactToArticle = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { type } = req.body;
    if (!['like', 'helpful', 'outdated'].includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const existing = article.reactions.find(r => r.userId.toString() === userId);
    if (existing) {
      if (existing.type === type) {
        article.reactions = article.reactions.filter(r => r.userId.toString() !== userId);
      } else {
        existing.type = type;
      }
    } else {
      article.reactions.push({ userId, type });
    }

    await article.save();
    res.json(enrichArticle(article, userId));
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Toggle favorite ──
const toggleFavorite = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const idx = article.favorites.findIndex(id => id.toString() === userId);
    if (idx !== -1) {
      article.favorites.splice(idx, 1);
    } else {
      article.favorites.push(userId);
    }

    await article.save();
    res.json({ isFavorited: idx === -1 });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Rate article ──
const rateArticle = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const score = parseInt(req.body.score);
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Score must be 1–5' });
    }

    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const existing = article.rating.entries.find(e => e.userId?.toString() === userId);
    if (existing) {
      existing.score = score;
    } else {
      article.rating.entries.push({ userId, score });
    }

    const count = article.rating.entries.length;
    const sum   = article.rating.entries.reduce((acc, e) => acc + e.score, 0);
    article.rating.average = Math.round((sum / count) * 10) / 10;
    article.rating.count   = count;

    await article.save();
    res.json({ average: article.rating.average, count: article.rating.count, userScore: score });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
