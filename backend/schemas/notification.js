// backend/schemas/notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'assigned',
        'commented',
        'status_changed',
        'created',
        'new_ticket',
        'team_assigned',
        'escalated',
        'sla_warning',
        'sla_breached',
        'resolved',
        'task_assigned',
        'project_update',
        'reassigned',
        'waiting',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    // Optional refs — at least one should be set
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTask',
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast per-user unread queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
