import { getDb } from '../src/lib/db';

const txid = process.argv[2];

if (!txid) {
    console.error("❌ Error: Please provide a Bitcoin TXID as an argument.");
    console.log("Usage: npx tsx scripts/record_btc_anchor.ts <txid>");
    process.exit(1);
}

const db = getDb();

// Find the latest daily root (Sequence #1)
const latest = db.prepare(`SELECT * FROM daily_roots ORDER BY sequence_number DESC LIMIT 1`).get() as any;

if (!latest) {
    console.error("❌ Error: No daily root found to update.");
    process.exit(1);
}

console.log(`Updating Anchor (Seq #${latest.sequence_number})...`);
console.log(`Current Status: ${latest.status}`);
console.log(`Setting BTC TXID: ${txid}`);

const stmt = db.prepare(`
    UPDATE daily_roots 
    SET bitcoin_txid = ?, 
        status = 'ANCHORED_DUAL' 
    WHERE day_utc = ?
`);

const info = stmt.run(txid, latest.day_utc);

if (info.changes > 0) {
    console.log("✅ Success! Database updated.");
    console.log("Status is now 'ANCHORED_DUAL'.");
} else {
    console.error("❌ Error: Update failed (row not found?).");
}
