
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "data", "registry.sqlite");
const db = new Database(DB_PATH);

console.log("Migrating Database Schema...");

// 1. Ensure ledger_anchors table exists
db.exec(`
    CREATE TABLE IF NOT EXISTS ledger_anchors(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    window_start_utc TEXT,
    window_end_utc TEXT,
    records_committed INTEGER,
    root_hash_hex TEXT NOT NULL,
    network TEXT DEFAULT 'bitcoin',
    txid TEXT,
    explorer_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at_utc TEXT NOT NULL
  );
`);

// 2. Add 'sequence' column if missing
const cols = db.prepare(`PRAGMA table_info(ledger_anchors)`).all() as Array<{ name: string }>;
const hasSequence = cols.some(c => c.name === 'sequence');

if (!hasSequence) {
    console.log("Adding 'sequence' column to ledger_anchors...");
    db.prepare(`ALTER TABLE ledger_anchors ADD COLUMN sequence INTEGER`).run();
} else {
    console.log("'sequence' column already exists.");
}

console.log("Migration Complete.");
