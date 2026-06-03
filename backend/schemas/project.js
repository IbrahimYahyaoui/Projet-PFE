// backend/schemas/project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['planning', 'in_progress', 'at_risk', 'completed', 'on_hold'],
      default: 'planning',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    color: { type: String, default: '#5FC2BA' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    relatedTickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);