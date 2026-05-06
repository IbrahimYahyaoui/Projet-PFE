// backend/routes/notification.js
const express = require('express');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, getMyNotifications);
router.put('/read-all', verifyToken, markAllAsRead);
router.put('/:id', verifyToken, markAsRead);
router.delete('/delete-all', verifyToken, deleteAllNotifications);
router.delete('/:id', verifyToken, deleteNotification);

module.exports = router;