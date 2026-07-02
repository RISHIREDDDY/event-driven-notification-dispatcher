// Load environment variables from .env file
require('dotenv').config();

const app = require('./app');
const db = require('./db/database');
const { startWorker } = require('./services/queueWorker');

const PORT = process.env.PORT || 3000;

// ─── Start Background Worker ────────────────────────────────────────────────
startWorker();

// ─── Start Server ───────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`[Server] Event-Driven Notification Dispatcher running on http://localhost:${PORT}`);
  console.log(`[Server] API endpoint: POST http://localhost:${PORT}/api/v1/events`);
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed');
    db.close();
    console.log('[Database] SQLite connection closed');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
