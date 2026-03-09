import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.resolve(__dirname, '../../../data');
const DB_PATH = path.join(DATA_DIR, 'ahorro-tuc.db');

// Ensure directory exists before opening
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('[DB] 📁 Created data directory:', DATA_DIR);
}

// Singleton connection
const db = new Database(DB_PATH);

// Performance tweaks
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('[DB] 🔗 Connected to', DB_PATH);

export default db;
