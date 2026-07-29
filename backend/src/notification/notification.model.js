/**
 * src/notification/notification.model.js
 *
 * One document per notification, owned by `recipientId` (the User who
 * should see it — candidate or company, doesn't matter which, the
 * frontend NotificationContext/Panel already render both the same way).
 *
 * `category` mirrors the CATEGORIES filter list already built into
 * NotificationPanel.jsx on the frontend ('Profile Activity',
 * 'Job Applications', 'System', 'Achievements'), and `icon`/`color`
 * mirror the NotificationIcon / colorMap tokens it already knows how to
 * render — so nothing on the frontend needs new UI, just real data.
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    /* Who/what this notification is about — never required, just handy
       for building a link or de-duplicating (see notification.service.js). */
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    jobId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Job',  default: null },

    /* Internal event type, e.g. 'profile_view', 'application_status',
       'new_application', 'application_submitted'. Used for de-duplication
       logic, not shown to the user directly. */
    type: { type: String, required: true },

    /* Drives the filter pills in NotificationPanel.jsx */
    category: {
      type: String,
      enum: ['Profile Activity', 'Job Applications', 'System', 'Achievements'],
      required: true,
    },

    title:  { type: String, required: true, trim: true },
    detail: { type: String, default: '' },

    /* Matches NotificationIcon.jsx's `type` prop */
    icon: {
      type: String,
      enum: ['eye', 'briefcase', 'clock', 'search', 'star', 'person'],
      default: 'briefcase',
    },
    /* Matches colorMap / iconStyle keys on the frontend */
    color: {
      type: String,
      enum: ['indigo', 'emerald', 'orange', 'cyan', 'yellow', 'purple'],
      default: 'indigo',
    },
    badgeText: { type: String, default: null },

    /* Where clicking the notification should take the user, e.g.
       '/jobs/<id>' or '/company/jobs/<id>/applicants'. Optional. */
    link: { type: String, default: null },

    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

/* Newest-first per recipient is the only query pattern this ever needs. */
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

/**
 * Shapes a notification for the frontend: `_id` -> `id`, and `time` is
 * a relative string computed here so the client never needs its own
 * "time ago" formatter (and every card in NotificationPanel/Dropdown
 * already just renders `n.time` as-is).
 */
NotificationSchema.methods.toPublic = function () {
  return {
    id:        this._id,
    type:      this.type,
    category:  this.category,
    title:     this.title,
    detail:    this.detail,
    icon:      this.icon,
    color:     this.color,
    badgeText: this.badgeText,
    link:      this.link,
    read:      this.read,
    time:      formatTimeAgo(this.createdAt),
    createdAt: this.createdAt,
  };
};

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

module.exports = mongoose.model('Notification', NotificationSchema);