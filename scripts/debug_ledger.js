
import Database from 'better-sqlite3';

const db = new Database('data/registry.sqlite');

const rows = db.prepare(`
  SELECT chain_id, last_seal_at_utc, sealed_count 
  FROM public_chains 
  WHERE is_public = 1 
  ORDER BY last_seal_at_utc DESC 
  LIMIT 10
`).all();

console.table(rows);
