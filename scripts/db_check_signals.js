
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Simple script to dump recent signals
const dbPath = path.resolve(process.cwd(), 'data', 'registry.sqlite');

if (!fs.existsSync(dbPath)) {
    console.error("DB not found at", dbPath);
    process.exit(1);
}

const db = new Database(dbPath);

console.log("\n--- Recent Traction Signals (ID & Type) ---");
const signals = db.prepare(`SELECT record_id, type, created_at, val_bucket FROM traction_signals ORDER BY created_at DESC LIMIT 5`).all();
signals.forEach(s => console.log(`[${s.created_at}] ID: ${s.record_id} | Type: ${s.type} | Val: ${s.val_bucket}`));

console.log("\n--- Recent Invites (ID & Custom Title) ---");
const invites = db.prepare(`SELECT record_id, custom_title, created_at FROM traction_invites ORDER BY created_at DESC LIMIT 5`).all();
invites.forEach(i => console.log(`[${i.created_at}] ID: ${i.record_id} | Title: ${i.custom_title}`));
