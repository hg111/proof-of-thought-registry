import crypto from "crypto";
import { merkleRootHex, sha256 } from "@/lib/merkle";
import { dbArtifactsForParent, dbGetDailyRoot, dbUpsertDailyRoot } from "@/lib/db";
import Database from "better-sqlite3";
import path from "path";
import { config } from "@/lib/config";

// We need direct DB access to query by day without refactoring your db.ts exports
const dbFile = path.join(config.dataDir, "registry.sqlite");
const db = new Database(dbFile);

function dayUtcFromIso(iso: string) {
  return iso.slice(0, 10); // YYYY-MM-DD
}

export function leafHashForIssuedCert(row: any) {
  // Stable leaf encoding
  const s = `CERT|${row.id}|${row.issued_at}|${row.content_hash}`;
  return sha256(Buffer.from(s, "utf8"));
}

export function leafHashForArtifact(row: any) {
  const s = `ART|${row.id}|${row.parent_certificate_id}|${row.issued_at}|${row.canonical_hash}|${row.chain_hash}`;
  return sha256(Buffer.from(s, "utf8"));
}

export function buildDailyRoot(dayUtc: string) {
  // issued certs for day
  const certs = db.prepare(`
    SELECT id, issued_at, content_hash
    FROM submissions
    WHERE status='issued' AND issued_at IS NOT NULL AND substr(issued_at,1,10) = ?
    ORDER BY id ASC
  `).all(dayUtc);

  // artifacts for day
  const arts = db.prepare(`
    SELECT id, parent_certificate_id, issued_at, canonical_hash, chain_hash
    FROM artifacts
    WHERE issued_at IS NOT NULL AND substr(issued_at,1,10) = ?
    ORDER BY id ASC
  `).all(dayUtc);

  const leaves = [
    ...certs.map(leafHashForIssuedCert),
    ...arts.map(leafHashForArtifact),
  ].sort(); // sorted for determinism

  const root = merkleRootHex(leaves);

  return { dayUtc, root, leafCount: leaves.length, leaves };
}

export function computeAndStoreDailyRoot(dayUtc: string) {
  const { root, leafCount, leaves } = buildDailyRoot(dayUtc);
  dbUpsertDailyRoot({
    day_utc: dayUtc,
    root_hash: root,
    leaf_count: leafCount,
    computed_at: new Date().toISOString(),
  });
  return { dayUtc, root, leafCount, leaves };
}