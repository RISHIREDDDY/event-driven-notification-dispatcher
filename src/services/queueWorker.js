const { EventEmitter } = require('events');
const {
  updateNotificationStatus,
  incrementRetryCount,
} = require('./notificationService');

// ─── In-Memory Queue ────────────────────────────────────────────────────────
const queue = [];
const emitter = new EventEmitter();
let isProcessing = false;

/**
 * Add a notification task to the in-memory queue and trigger processing.
 *
 * @param {Object} task
 * @param {number} task.notification_id - The notification record ID
 * @param {string} task.recipient - The recipient address
 * @param {string} task.channel - The notification channel (e.g., 'email')
 */
function enqueue(task) {
  queue.push(task);
  console.log(
    `[Queue] Task enqueued — notification_id: ${task.notification_id}, recipient: ${task.recipient}`
  );
  emitter.emit('task');
}

// ─── Worker Logic ───────────────────────────────────────────────────────────

/**
 * Simulate sending a notification with a random delay (500–1000ms)
 * and a 10% failure rate.
 *
 * @param {Object} task - The notification task to process
 * @returns {Promise<boolean>} true if send succeeded, false if it failed
 */
function simulateSendNotification(task) {
  return new Promise((resolve) => {
    const delay = Math.floor(Math.random() * 500) + 500; // 500–1000ms

    setTimeout(() => {
      const isFailure = Math.random() < 0.1; // 10% failure rate

      if (isFailure) {
        console.log(
          `[Worker] ✗ Notification FAILED — notification_id: ${task.notification_id}, ` +
            `recipient: ${task.recipient}, channel: ${task.channel} (after ${delay}ms)`
        );
        resolve(false);
      } else {
        console.log(
          `[Worker] ✓ Notification SENT — notification_id: ${task.notification_id}, ` +
            `recipient: ${task.recipient}, channel: ${task.channel} (after ${delay}ms)`
        );
        resolve(true);
      }
    }, delay);
  });
}

/**
 * Process a single notification task:
 *  1. Simulate sending
 *  2. Update database status to 'completed' or 'failed'
 *  3. Increment retry_count on failure
 *
 * @param {Object} task - The notification task
 */
async function processTask(task) {
  try {
    const success = await simulateSendNotification(task);

    if (success) {
      updateNotificationStatus(task.notification_id, 'completed');
      console.log(
        `[Worker] Status updated to 'completed' — notification_id: ${task.notification_id}`
      );
    } else {
      updateNotificationStatus(task.notification_id, 'failed');
      incrementRetryCount(task.notification_id);
      console.log(
        `[Worker] Status updated to 'failed', retry_count incremented — notification_id: ${task.notification_id}`
      );
    }
  } catch (error) {
    console.error(
      `[Worker] Error processing notification_id: ${task.notification_id} —`,
      error.message
    );

    // Attempt to mark as failed in the database
    try {
      updateNotificationStatus(task.notification_id, 'failed');
      incrementRetryCount(task.notification_id);
    } catch (dbError) {
      console.error(
        `[Worker] Failed to update notification status in database —`,
        dbError.message
      );
    }
  }
}

/**
 * Process all tasks in the queue sequentially.
 * Prevents concurrent processing to avoid SQLite write contention.
 */
async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (queue.length > 0) {
    const task = queue.shift();
    await processTask(task);
  }

  isProcessing = false;
}

// ─── Start Worker ───────────────────────────────────────────────────────────

/**
 * Initialize the queue worker by listening for 'task' events.
 */
function startWorker() {
  emitter.on('task', () => {
    processQueue().catch((err) => {
      console.error('[Worker] Unexpected error in queue processing:', err.message);
    });
  });
  console.log('[Worker] Background queue worker started');
}

module.exports = { enqueue, startWorker };
