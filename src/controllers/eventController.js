const { createEvent } = require('../services/eventService');
const { createNotification } = require('../services/notificationService');
const { enqueue } = require('../services/queueWorker');

/**
 * Handle POST /api/v1/events
 *
 * 1. Validate the incoming request body
 * 2. Save the event in the events table
 * 3. Create a notification record with status 'pending'
 * 4. Push the notification task into the background queue
 * 5. Return 202 Accepted immediately
 */
async function handleEvent(req, res) {
  try {
    const { event_type, recipient, data } = req.body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!event_type || !recipient) {
      return res.status(400).json({
        error: 'event_type and recipient are required',
      });
    }

    // ── Save event ────────────────────────────────────────────────────────
    const event_id = createEvent(event_type, { recipient, data });

    // ── Create notification ───────────────────────────────────────────────
    const channel = 'email';
    const notification_id = createNotification(event_id, recipient, channel);

    // ── Enqueue for background processing ─────────────────────────────────
    enqueue({ notification_id, recipient, channel });

    // ── Respond immediately ───────────────────────────────────────────────
    return res.status(202).json({
      message: 'Event accepted for processing',
      tracking_id: event_id,
      notification_id: notification_id,
      status: 'pending',
    });
  } catch (error) {
    console.error('[Controller] Error handling event:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

module.exports = { handleEvent };
