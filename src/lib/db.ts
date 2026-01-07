import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "@/lib/config";
import type { RecordClass } from "@/lib/records";

type SubmissionRow = {
  id: string;
  created_at: string;
  issued_at: string | null;
  status: string;
  title: string | null;
  holder_name: string | null;
  holder_email: string | null;
  canonical_text: string;
  content_hash: string;
  pdf_path: string | null;
  access_token: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  amount_cents: number;
  currency: string;
  registry_no: number | null;
  record_class: RecordClass;
  seal_object_key: string | null;
};



const dbFile = path.join(config.dataDir, "registry.sqlite");

export function dbSetSealObjectKey(id: string, key: string) {
  getDb().prepare(`UPDATE submissions SET seal_object_key = ? WHERE id = ?`).run(key, id);
}

export function formatRegistryNo(n: number | null | undefined) {
  if (!n || n < 1) return "—";
  return `R-${String(n).padStart(16, "0")}`;
}

function ensure() {
  fs.mkdirSync(config.dataDir, { recursive: true });
  const db = new Database(dbFile);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      issued_at TEXT,
      status TEXT NOT NULL,
      title TEXT,
      holder_name TEXT,
      holder_email TEXT,
      canonical_text TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      pdf_object_key TEXT,
      access_token TEXT NOT NULL,
      stripe_session_id TEXT,
      stripe_payment_intent TEXT,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      registry_no INTEGER,
      record_class TEXT DEFAULT 'GENESIS',
      seal_object_key TEXT,
      verify_slug TEXT,
      receipt_pdf_key TEXT,
      chain_pdf_key TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    CREATE INDEX IF NOT EXISTS idx_submissions_stripe_session ON submissions(stripe_session_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_registry_no ON submissions(registry_no);
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      parent_certificate_id TEXT NOT NULL,
      artifact_type TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      canonical_hash TEXT NOT NULL,
      chain_hash TEXT NOT NULL,
      issued_at TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      receipt_pdf_key TEXT NOT NULL,
      FOREIGN KEY(parent_certificate_id) REFERENCES submissions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_artifacts_parent ON artifacts(parent_certificate_id);
    CREATE INDEX IF NOT EXISTS idx_artifacts_issued_at ON artifacts(issued_at);
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_roots (
      day_utc TEXT PRIMARY KEY,
      root_hash TEXT NOT NULL,
      leaf_count INTEGER NOT NULL,
      computed_at TEXT NOT NULL,
      published_at TEXT,
      published_url TEXT,
      bitcoin_txid TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_daily_roots_computed_at ON daily_roots(computed_at);
  `);
  // --- MIGRATION: registry_no on submissions ---
  const cols = db.prepare(`PRAGMA table_info(submissions)`).all() as Array<{ name: string }>;
  const colNames = new Set(cols.map(c => c.name));

  // --- MIGRATION: thought_caption on artifacts ---
  const aCols = db.prepare(`PRAGMA table_info(artifacts)`).all() as Array<{ name: string }>;
  const hasThoughtCaption = aCols.some(c => c.name === "thought_caption");

  if (!hasThoughtCaption) {
    db.exec(`ALTER TABLE artifacts ADD COLUMN thought_caption TEXT;`);
  }

  if (!colNames.has("registry_no")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN registry_no INTEGER;`);

    // Backfill existing rows in created_at order (stable enough for MVP)
    const rows = db.prepare(`SELECT id FROM submissions ORDER BY created_at ASC`).all() as Array<{ id: string }>;
    const upd = db.prepare(`UPDATE submissions SET registry_no = ? WHERE id = ?`);
    rows.forEach((r, i) => upd.run(i + 1, r.id));

    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_registry_no ON submissions(registry_no);`);
  }

  // --- COMPREHENSIVE MIGRATIONS ---
  if (!colNames.has("record_class")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN record_class TEXT DEFAULT 'GENESIS';`);
  }
  if (!colNames.has("pdf_object_key")) {
    // If we have pdf_path, we might want to migrate it, or just add the new column.
    // For now, assuming pdf_path is abandoned or empty in PROD, simply add the new one.
    db.exec(`ALTER TABLE submissions ADD COLUMN pdf_object_key TEXT;`);
  }
  if (!colNames.has("seal_object_key")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN seal_object_key TEXT;`);
  }
  if (!colNames.has("verify_slug")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN verify_slug TEXT;`);
    // Backfill verify_slug = id
    db.exec(`UPDATE submissions SET verify_slug = id WHERE verify_slug IS NULL;`);
  }
  if (!colNames.has("receipt_pdf_key")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN receipt_pdf_key TEXT;`);
  }
  if (!colNames.has("chain_pdf_key")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN chain_pdf_key TEXT;`);
  }

  return db;
}



let _db: Database.Database | null = null;

function getDb() {
  if (!_db) {
    _db = ensure();
  }
  return _db;
}

export function dbCreateDraft(args: {
  id: string;
  title: string | null;
  holderName: string | null;
  holderEmail: string | null;
  canonicalText: string;
  contentHash: string;
  accessToken: string;
  amountCents: number;
  currency: string;
  recordClass?: RecordClass;
}) {
  const db = getDb();
  const next = getDb().prepare(`SELECT COALESCE(MAX(registry_no), 0) + 1 AS n FROM submissions`).get() as { n: number };
  const registryNo = next.n;
  const now = new Date().toISOString();
  const stmt = getDb().prepare(`
INSERT INTO submissions (
  id,
  registry_no,
  created_at,
  issued_at,
  status,
  record_class,
  title,
  holder_name,
  holder_email,
  canonical_text,
  content_hash,
  pdf_object_key,
  seal_object_key,
  verify_slug,
  access_token,
  stripe_session_id,
  stripe_payment_intent,
  amount_cents,
  currency
) VALUES (
  @id,
  @registry_no,
  @created_at,
  NULL,
  'draft',
  @record_class,
  @title,
  @holder_name,
  @holder_email,
  @canonical_text,
  @content_hash,
  NULL,
  NULL,
  @verify_slug,
  @access_token,
  NULL,
  NULL,
  @amount_cents,
  @currency
);
  `);

  stmt.run({
    id: args.id,
    registry_no: registryNo,
    record_class: args.recordClass ?? "GENESIS",
    created_at: now,
    title: args.title,
    holder_name: args.holderName,
    holder_email: args.holderEmail,
    canonical_text: args.canonicalText,
    content_hash: args.contentHash,
    verify_slug: args.id,
    access_token: args.accessToken,
    amount_cents: args.amountCents,
    currency: args.currency
  });
}

export function dbSetStripeSession(id: string, stripeSessionId: string) {
  getDb().prepare(`UPDATE submissions SET stripe_session_id = ? WHERE id = ?`).run(stripeSessionId, id);
}

export function dbMarkPaidBySession(
  stripeSessionId: string,
  paymentIntent: string,
  recordClass: RecordClass
) {
  getDb().prepare(
    `UPDATE submissions
       SET status = 'paid',
           stripe_payment_intent = ?,
           record_class = ?
     WHERE stripe_session_id = ?`
  ).run(paymentIntent, recordClass, stripeSessionId);
}

export function dbMarkIssued(
  id: string,
  issuedAtUtc: string,
  pdfObjectKey: string,
  sealObjectKey?: string | null,
  receiptPdfKey?: string | null
) {
  getDb().prepare(`
    UPDATE submissions
    SET status = 'issued',
        issued_at = @issued_at,
        pdf_object_key = @pdf_object_key,
        seal_object_key = @seal_object_key,
        receipt_pdf_key = COALESCE(@receipt_pdf_key, @pdf_object_key)
    WHERE id = @id
  `).run({
    id,
    issued_at: issuedAtUtc,
    pdf_object_key: pdfObjectKey,
    seal_object_key: sealObjectKey ?? null,
    receipt_pdf_key: receiptPdfKey ?? null,
  });
}

export function dbGetSubmission(id: string): SubmissionRow | null {
  const row = getDb().prepare(`SELECT * FROM submissions WHERE id = ?`).get(id) as SubmissionRow | undefined;
  return row ?? null;
}

export function dbGetByStripeSession(stripeSessionId: string): SubmissionRow | null {
  const row = getDb().prepare(`SELECT * FROM submissions WHERE stripe_session_id = ?`).get(stripeSessionId) as SubmissionRow | undefined;
  return row ?? null;
}

// --- MVP-2 Sealed Artifacts ---

export type ArtifactRow = {
  id: string;
  parent_certificate_id: string;
  artifact_type: string;
  original_filename: string;
  canonical_hash: string;
  chain_hash: string;
  issued_at: string;
  storage_key: string;
  receipt_pdf_key: string;
  thought_caption: string | null;
};

export function dbLastArtifactForParent(parentId: string): ArtifactRow | null {
  const row = getDb().prepare(`
    SELECT * FROM artifacts
    WHERE parent_certificate_id = ?
    ORDER BY issued_at DESC
    LIMIT 1
  `).get(parentId) as ArtifactRow | undefined;

  return row ?? null;
}

export function dbInsertArtifact(a: ArtifactRow) {
  getDb().prepare(`
    INSERT INTO artifacts (
      id, parent_certificate_id, artifact_type, original_filename,
      canonical_hash, chain_hash, issued_at, storage_key, receipt_pdf_key,
      thought_caption
    ) VALUES (
      @id, @parent_certificate_id, @artifact_type, @original_filename,
      @canonical_hash, @chain_hash, @issued_at, @storage_key, @receipt_pdf_key,
      @thought_caption
    )
  `).run({
    ...a,
    thought_caption: a.thought_caption ?? null,
  });
}

export function dbArtifactsForParent(parentId: string): ArtifactRow[] {
  const rows = getDb().prepare(`
    SELECT * FROM artifacts
    WHERE parent_certificate_id = ?
    ORDER BY issued_at ASC
  `).all(parentId) as ArtifactRow[];

  return rows ?? [];
}

export function dbGetArtifact(id: string): ArtifactRow | null {
  const row = getDb().prepare(`SELECT * FROM artifacts WHERE id = ?`).get(id) as ArtifactRow | undefined;
  return row ?? null;
}

export function dbArtifactById(id: string): ArtifactRow | null {
  const row = getDb()
    .prepare(`SELECT * FROM artifacts WHERE id = ?`)
    .get(id) as ArtifactRow | undefined;

  return row ?? null;
}
export type DailyRootRow = {
  day_utc: string;
  root_hash: string;
  leaf_count: number;
  computed_at: string;
  published_at: string | null;
  published_url: string | null;
  bitcoin_txid: string | null;
};

export function dbGetDailyRoot(dayUtc: string): DailyRootRow | null {
  const row = getDb().prepare(`SELECT * FROM daily_roots WHERE day_utc = ?`).get(dayUtc) as DailyRootRow | undefined;
  return row ?? null;
}

export function dbUpsertDailyRoot(r: {
  day_utc: string;
  root_hash: string;
  leaf_count: number;
  computed_at: string;
}) {
  getDb().prepare(`
    INSERT INTO daily_roots (day_utc, root_hash, leaf_count, computed_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(day_utc) DO UPDATE SET
      root_hash=excluded.root_hash,
      leaf_count=excluded.leaf_count,
      computed_at=excluded.computed_at
  `).run(r.day_utc, r.root_hash, r.leaf_count, r.computed_at);
}

export function dbMarkDailyRootPublished(dayUtc: string, publishedUrl: string) {
  getDb().prepare(`
    UPDATE daily_roots
    SET published_at = ?, published_url = ?
    WHERE day_utc = ?
  `).run(new Date().toISOString(), publishedUrl, dayUtc);
}

export function dbSetReceiptPdfKey(submissionId: string, receiptPdfKey: string) {
  getDb().prepare(`
    UPDATE submissions
    SET receipt_pdf_key = ?
    WHERE id = ?
  `).run(receiptPdfKey, submissionId);
}

export function dbSetChainPdfKey(submissionId: string, chainPdfKey: string) {
  getDb().prepare(`
    UPDATE submissions
    SET chain_pdf_key = ?
    WHERE id = ?
  `).run(chainPdfKey, submissionId);
}