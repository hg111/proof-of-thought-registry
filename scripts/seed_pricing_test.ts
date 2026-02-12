import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || 'data/registry.sqlite';
const db = new Database(dbPath);

console.log('Inserting test records for pricing tiers...');

// Helper to create a record
function createRecord(title: string, recordClass: string | null) {
    // Get next registry number from DB
    const row = db.prepare('SELECT COALESCE(MAX(registry_no), 0) + 1 as n FROM submissions').get() as { n: number };
    const registryNo = row.n;
    const id = `rec_${registryNo}`;
    const now = new Date().toISOString();

    // Use correct schema columns based on src/lib/db.ts
    // Explicitly use 'GENESIS' if recordClass is null 
    const finalRecordClass = recordClass || 'GENESIS';

    const info = db.prepare(`
    INSERT INTO submissions (
      id, registry_no, title, content_hash, canonical_text, access_token,
      amount_cents, currency, status,
      created_at, record_class, nda_enabled, nda_text, verify_slug
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id,
        registryNo,
        title,
        'hash_' + id,
        'canonical_text_' + id,
        'token_' + id,
        0,
        'usd',
        'draft',
        now,
        finalRecordClass,
        0,
        null,
        id // verify_slug
    );

    console.log(`Created record: ${title} (${finalRecordClass}) -> ID: ${id}`);
    return id;
}

try {
    // 1. Genesis (Default)
    createRecord('Project Genesis', 'GENESIS');

    // 2. Minted
    createRecord('Project Minted', 'MINTED');

    // 3. Engraved
    createRecord('Project Engraved', 'ENGRAVED');

    console.log('Done.');
} catch (e) {
    console.error('Error seeding data:', e);
}
