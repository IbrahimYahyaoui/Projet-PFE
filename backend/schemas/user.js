// backend/schemas/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'tech', 'leader'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    settings: {
      notifications: {
        email_new:      { type: Boolean, default: true  },
        email_assign:   { type: Boolean, default: true  },
        email_resolved: { type: Boolean, default: false },
        email_comment:  { type: Boolean, default: true  },
      },
      appearance: {
        compact:    { type: Boolean, default: false },
        animations: { type: Boolean, default: true  },
        sidebar:    { type: Boolean, default: false },
      },
      preferences: {
        language:   { type: String, default: "fr"           },
        timezone:   { type: String, default: "Africa/Tunis" },
        dateFormat: { type: String, default: "DD/MM/YYYY"   },
      },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);