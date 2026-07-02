const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Resolve database path from environment or use default
const DB_PATH = process.env.DB_PATH || './data/notifications.db';
const dbDir = path.dirname(path.resolve(DB_PATH));

// Ensure the data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create and configure the SQLite database connection
const db = new Database(path.resolve(DB_PATH));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Enable foreign key enforcement
db.pragma('foreign_keys = ON');

/**
 * Initialize the database schema by executing schema.sql
 */
function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('[Database] SQLite database initialized successfully');
}

// Run schema initialization on module load
initializeDatabase();

module.exports = db;
