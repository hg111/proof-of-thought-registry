
import Database from "better-sqlite3";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const dbPath = path.join(process.cwd(), "data", "registry.sqlite");
const db = new Database(dbPath);

console.log("Resequencing Registry Numbers...");

// 1. Get all records with a registry_no, ordered by the current number
// We want to preserve the *order*, just remove the gaps.
const records = db.prepare(`
    SELECT id, registry_no, title 
    FROM submissions 
    WHERE registry_no IS NOT NULL 
    ORDER BY registry_no ASC
`).all() as { id: string, registry_no: number, title: string }[];

console.log(`Found ${records.length} records to resequence.`);

// 2. Update them sequentially
const updateStmt = db.prepare("UPDATE submissions SET registry_no = ? WHERE id = ?");

const run = db.transaction(() => {
    let nextNo = 1;
    for (const record of records) {
        if (record.registry_no !== nextNo) {
            console.log(`Rewriting ${record.registry_no} -> ${nextNo} (${record.title || 'Untitled'})`);
            updateStmt.run(nextNo, record.id);
        }
        nextNo++;
    }
});

run();

console.log("Done! Registry numbers are now unbroken sequence.");
