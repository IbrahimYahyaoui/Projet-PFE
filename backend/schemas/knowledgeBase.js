// backend/schemas/knowledgeBase.js
const mongoose = require('mongoose');

const commentSubSchema = new mongoose.Schema({
  content:   { type: String, required: true, trim: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const ratingEntrySubSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score:  { type: Number, min: 1, max: 5 },
  },
  { _id: false }
);

const knowledgeBaseSchema = new mongoose.Schema(
  {
    // ── Existing fields (unchanged) ──
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['hardware', 'software', 'network', 'access', 'other', 'general'],
      default: 'general',
    },
    tags:         { type: [String], default: [] },
    sourceTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    views:        { type: Number, default: 0 },
    helpful:      { type: Number, default: 0 }, // kept for backward compat

    // ── Phase 2 Sprint 1 — new fields ──
    subcategory: { type: String, default: '' },

    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    // existing documents inherit 'published' via default

    visibility: {
      roles:   { type: [String], enum: ['admin', 'leader', 'tech', 'user'], default: ['admin', 'leader', 'tech', 'user'] },
      teamIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
      // teamIds empty = visible to all eligible roles; non-empty = restricted to those teams + admins
    },

    comments: [commentSubSchema],

    reactions: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      type:   { type: String, enum: ['like', 'helpful', 'outdated'], required: true },
    }],

    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    rating: {
      average: { type: Number, default: 0 },
      count:   { type: Number, default: 0 },
      entries: [ratingEntrySubSchema],
    },
  },
  { timestamps: true }
);

// NOTE: if the old text index ({ title, content, tags }) exists in MongoDB,
// drop it manually before starting the server:
//   db.knowledgebases.dropIndex("title_text_content_text_tags_text")
knowledgeBaseSchema.index({ title: 'text', content: 'text', tags: 'text', subcategory: 'text' });
knowledgeBaseSchema.index({ category: 1, createdAt: -1 });
knowledgeBaseSchema.index({ status: 1 });
knowledgeBaseSchema.index({ favorites: 1 });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
