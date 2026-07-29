/**
 * src/notification/notification.controller.js
 * Same shape for candidates and companies — `req.user._id` is always the
 * recipient, so one set of routes serves both sides of the platform.
 */
const notificationService = require('./notification.service');
const { sendSuccess } = require('../utils/response');

/* GET /api/notifications?category=&page=&limit= */
const listNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.list(req.user._id, req.query);
    sendSuccess(res, { data: result });
  } catch (err) { next(err); }
};

/* GET /api/notifications/unread-count */
const unreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    sendSuccess(res, { data: { unreadCount: count } });
  } catch (err) { next(err); }
};

/* PATCH /api/notifications/:id/read */
const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.user._id, req.params.id);
    sendSuccess(res, { message: 'Notification marked as read.', data: { notification } });
  } catch (err) { next(err); }
};

/* PATCH /api/notifications/read-all */
const markAllRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllRead(req.user._id);
    sendSuccess(res, { message: 'All notifications marked as read.', data: result });
  } catch (err) { next(err); }
};

module.exports = { listNotifications, unreadCount, markRead, markAllRead };