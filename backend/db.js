import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.SQLITE_PATH || path.join(__dirname, 'data', 'gitcloud.db');

// Ensure directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create the shares table
db.exec(`
  CREATE TABLE IF NOT EXISTS shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shareId TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    repo TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileName TEXT NOT NULL,
    fileSize INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    expiresAt TEXT,
    accessCount INTEGER DEFAULT 0
  )
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_shares_shareId ON shares(shareId)`);

// GitHub OAuth token storage (persists across server restarts)
db.exec(`
  CREATE TABLE IF NOT EXISTS github_tokens (
    userId TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    username TEXT NOT NULL,
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export default db;
