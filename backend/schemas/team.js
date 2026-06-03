// backend/schemas/team.js
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['hardware', 'software', 'network', 'access', 'other', 'general'],
      default: 'general',
    },
    color: {
      type: String,
      default: '#5FC2BA',
    },
    tag: {
      type: String,
      enum: ['HARD', 'NET', 'SOFT', 'ACCESS', 'GEN'],
      default: 'GEN',
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);