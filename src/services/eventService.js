const db = require('../db/database');

/**
 * Insert a new event into the events table.
 *
 * @param {string} event_type - The type of business event (e.g., 'order_placed')
 * @param {Object} payload - The full event payload to store as JSON
 * @returns {number} event_id - The auto-generated ID of the inserted event
 */
function createEvent(event_type, payload) {
  const stmt = db.prepare(
    'INSERT INTO events (event_type, payload) VALUES (?, ?)'
  );
  const result = stmt.run(event_type, JSON.stringify(payload));
  return result.lastInsertRowid;
}

module.exports = { createEvent };
