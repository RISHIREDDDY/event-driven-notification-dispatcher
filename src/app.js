const express = require('express');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────

// Parse JSON request bodies with malformed JSON error handling
app.use((req, res, next) => {
  express.json()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: 'Invalid JSON payload',
      });
    }
    next();
  });
});

// ─── Routes ─────────────────────────────────────────────────────────────────

// Root route — API information
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Event-Driven Notification Dispatcher',
    version: '1.0.0',
    description: 'A lightweight asynchronous notification system',
    endpoints: {
      'POST /api/v1/events': 'Trigger a business event and queue a notification',
      'GET /health': 'Health check',
    },
  });
});

app.use('/api/v1/events', eventRoutes);

// ─── Health Check ───────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[App] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
