// backend/schemas/knowledgeBase.js
const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['hardware', 'software', 'network', 'access', 'other', 'general'],
      default: 'general',
    },
    tags: {
      type: [String],
      default: [],
    },
    sourceTicket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
    helpful: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Full-text search index
knowledgeBaseSchema.index({ title: 'text', content: 'text', tags: 'text' });
knowledgeBaseSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
