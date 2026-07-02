const db = require('../db/database');

/**
 * Create a new notification record in the notifications table.
 *
 * @param {number} event_id - The ID of the associated event
 * @param {string} recipient - The notification recipient (e.g., email address)
 * @param {string} channel - The notification channel (default: 'email')
 * @returns {number} notification_id - The auto-generated ID of the inserted notification
 */
function createNotification(event_id, recipient, channel = 'email') {
  const stmt = db.prepare(
    `INSERT INTO notifications (event_id, recipient, channel, status)
     VALUES (?, ?, ?, 'pending')`
  );
  const result = stmt.run(event_id, recipient, channel);
  return result.lastInsertRowid;
}

/**
 * Update the status of a notification.
 *
 * @param {number} notification_id - The ID of the notification to update
 * @param {string} status - The new status ('completed' or 'failed')
 */
function updateNotificationStatus(notification_id, status) {
  const stmt = db.prepare(
    `UPDATE notifications
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  );
  stmt.run(status, notification_id);
}

/**
 * Increment the retry count of a notification.
 *
 * @param {number} notification_id - The ID of the notification
 */
function incrementRetryCount(notification_id) {
  const stmt = db.prepare(
    `UPDATE notifications
     SET retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  );
  stmt.run(notification_id);
}

module.exports = {
  createNotification,
  updateNotificationStatus,
  incrementRetryCount,
};
