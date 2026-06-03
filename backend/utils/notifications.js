// backend/utils/notifications.js
// Shared helper used by all controllers to create notifications
const Notification = require('../schemas/notification');

/**
 * Create a notification.
 * Silently skips if userId equals triggeredBy (no self-notifications).
 *
 * @param {Object} opts
 * @param {string} opts.userId        - recipient
 * @param {string} opts.type          - notification type (see enum in schema)
 * @param {string} opts.message       - human-readable message
 * @param {string} opts.triggeredBy   - actor who caused the event
 * @param {string} [opts.ticketId]
 * @param {string} [opts.projectId]
 * @param {string} [opts.taskId]
 */
const createNotification = async ({
  userId,
  type,
  message,
  triggeredBy,
  ticketId = null,
  projectId = null,
  taskId = null,
}) => {
  try {
    if (!userId || userId.toString() === triggeredBy.toString()) return;
    await Notification.create({ userId, type, message, triggeredBy, ticketId, projectId, taskId });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

/**
 * Notify multiple users at once (de-duplicates against triggeredBy).
 */
const notifyMany = async (userIds, opts) => {
  const unique = [...new Set(
    userIds
      .filter(Boolean)
      .map(id => id.toString())
      .filter(id => id !== opts.triggeredBy.toString())
  )];
  await Promise.all(unique.map(userId => createNotification({ ...opts, userId })));
};

module.exports = { createNotification, notifyMany };
