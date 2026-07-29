/**
 * src/notification/notification.routes.js
 * Available to any signed-in user (candidate or company) — each request
 * only ever touches its own notifications, scoped by req.user._id.
 */
const { Router } = require('express');
const { authenticate } = require('../auth/auth.middleware');
const controller = require('./notification.controller');

const router = Router();

router.use(authenticate);

router.get('/',              controller.listNotifications);
router.get('/unread-count',  controller.unreadCount);
router.patch('/:id/read',    controller.markRead);
router.patch('/read-all',    controller.markAllRead);

module.exports = router;