// backend/schemas/ticket.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'pending', 'assigned', 'in_progress', 'waiting', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['hardware', 'software', 'network', 'access', 'other'],
      default: 'other',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    // SLA
    slaDeadline: { type: Date, default: null },
    slaBreached: { type: Boolean, default: false },
    // Escalation
    escalationLevel: { type: Number, default: 0 }, // 0=none 1=leader 2=admin
    escalatedAt: { type: Date, default: null },
    // Waiting / SLA pause
    waitingReason: { type: String, default: '' },
    waitingSince: { type: Date, default: null },       // set when status → waiting
    totalWaitingTime: { type: Number, default: 0 },    // cumulative minutes paused
    // Project link
    relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);