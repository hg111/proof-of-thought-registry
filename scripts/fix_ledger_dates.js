
import Database from 'better-sqlite3';

const db = new Database('data/registry.sqlite');

console.log("Scanning for malformed dates...");

const rows = db.prepare(`SELECT chain_id, last_seal_at_utc, genesis_issued_at_utc FROM public_chains`).all();
let fixedCount = 0;

const updateStmt = db.prepare(`
    UPDATE public_chains 
    SET last_seal_at_utc = ?, genesis_issued_at_utc = ? 
    WHERE chain_id = ?
`);

for (const row of rows) {
    let needsUpdate = false;
    let newLast = row.last_seal_at_utc;
    let newGen = row.genesis_issued_at_utc;

    // Check Last Seal
    if (newLast && newLast.includes("•")) {
        const clean = newLast
            .replace(/\./g, '-')
            .replace(' • ', 'T')
            .replace(' UTC', 'Z');

        const d = new Date(clean);
        if (!isNaN(d.getTime())) {
            newLast = d.toISOString();
            needsUpdate = true;
        }
    }

    // Check Genesis
    if (newGen && newGen.includes("•")) {
        const clean = newGen
            .replace(/\./g, '-')
            .replace(' • ', 'T')
            .replace(' UTC', 'Z');

        const d = new Date(clean);
        if (!isNaN(d.getTime())) {
            newGen = d.toISOString();
            needsUpdate = true;
        }
    }

    if (needsUpdate) {
        console.log(`Fixing ${row.chain_id}:`);
        console.log(`  Last: ${row.last_seal_at_utc} -> ${newLast}`);
        console.log(`  Gen:  ${row.genesis_issued_at_utc} -> ${newGen}`);
        updateStmt.run(newLast, newGen, row.chain_id);
        fixedCount++;
    }
}

console.log(`Done. Fixed ${fixedCount} records.`);

const check = db.prepare(`
  SELECT chain_id, last_seal_at_utc, sealed_count 
  FROM public_chains 
  WHERE is_public = 1 
  ORDER BY last_seal_at_utc DESC 
  LIMIT 5
`).all();

console.log("\nNew Top 5:");
console.table(check);
