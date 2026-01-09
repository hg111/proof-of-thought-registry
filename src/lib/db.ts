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
  is_public: number; // 0 or 1
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
      thought_caption TEXT,
      mime_type TEXT,
      size_bytes INTEGER,
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
  db.exec(`
    CREATE TABLE IF NOT EXISTS public_chains(
    chain_id TEXT PRIMARY KEY,
    genesis_certificate_id TEXT UNIQUE NOT NULL,
    genesis_issued_at_utc TEXT,
    sealed_count INTEGER DEFAULT 1,
    last_seal_at_utc TEXT,
    custody_status TEXT DEFAULT 'Active',
    is_public INTEGER DEFAULT 0,
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL
  );
    CREATE INDEX IF NOT EXISTS idx_public_chains_genesis ON public_chains(genesis_issued_at_utc);
    CREATE INDEX IF NOT EXISTS idx_public_chains_last_seal ON public_chains(last_seal_at_utc);
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS ledger_anchors(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sequence INTEGER, -- Monotonic Anchor ID (v1 Protocol)
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

  // --- MIGRATION: registry_no on submissions ---
  const cols = db.prepare(`PRAGMA table_info(submissions)`).all() as Array<{ name: string }>;
  const colNames = new Set(cols.map(c => c.name));

  // --- MIGRATION: sequence on ledger_anchors ---
  const laCols = db.prepare(`PRAGMA table_info(ledger_anchors)`).all() as Array<{ name: string }>;
  const laHasSequence = laCols.some(c => c.name === "sequence");
  if (!laHasSequence) {
    db.prepare(`ALTER TABLE ledger_anchors ADD COLUMN sequence INTEGER`).run();
  }

  // --- MIGRATION: thought_caption on artifacts ---
  const aCols = db.prepare(`PRAGMA table_info(artifacts)`).all() as Array<{ name: string }>;
  const hasThoughtCaption = aCols.some(c => c.name === "thought_caption");

  if (!hasThoughtCaption) {
    db.exec(`ALTER TABLE artifacts ADD COLUMN thought_caption TEXT; `);
  }

  const hasMimeType = aCols.some(c => c.name === "mime_type");
  if (!hasMimeType) {
    db.exec(`ALTER TABLE artifacts ADD COLUMN mime_type TEXT;`);
    db.exec(`ALTER TABLE artifacts ADD COLUMN size_bytes INTEGER;`);
  }

  if (!colNames.has("registry_no")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN registry_no INTEGER; `);

    // Backfill existing rows in created_at order (stable enough for MVP)
    const rows = db.prepare(`SELECT id FROM submissions ORDER BY created_at ASC`).all() as Array<{ id: string }>;
    const upd = db.prepare(`UPDATE submissions SET registry_no = ? WHERE id = ? `);
    rows.forEach((r, i) => upd.run(i + 1, r.id));

    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_registry_no ON submissions(registry_no); `);
  }

  // --- COMPREHENSIVE MIGRATIONS ---
  if (!colNames.has("record_class")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN record_class TEXT DEFAULT 'GENESIS'; `);
  }
  if (!colNames.has("pdf_object_key")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN pdf_object_key TEXT; `);
  }
  if (!colNames.has("seal_object_key")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN seal_object_key TEXT; `);
  }
  if (!colNames.has("verify_slug")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN verify_slug TEXT; `);
    db.exec(`UPDATE submissions SET verify_slug = id WHERE verify_slug IS NULL; `);
  }
  if (!colNames.has("receipt_pdf_key")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN receipt_pdf_key TEXT; `);
  }
  if (!colNames.has("chain_pdf_key")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN chain_pdf_key TEXT; `);
  }
  if (!colNames.has("is_public")) {
    db.exec(`ALTER TABLE submissions ADD COLUMN is_public INTEGER DEFAULT 0; `);
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
  isPublic?: boolean;
}) {
  const db = getDb();
  const next = getDb().prepare(`SELECT COALESCE(MAX(registry_no), 0) + 1 AS n FROM submissions`).get() as { n: number };
  const registryNo = next.n;
  const now = new Date().toISOString();
  const stmt = getDb().prepare(`
INSERT INTO submissions(
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
    currency,
    is_public
  ) VALUES(
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
    @currency,
    @is_public
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
    currency: args.currency,
    is_public: args.isPublic ? 1 : 0
  });
}

export function dbSetStripeSession(id: string, stripeSessionId: string) {
  getDb().prepare(`UPDATE submissions SET stripe_session_id = ? WHERE id = ? `).run(stripeSessionId, id);
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
      WHERE stripe_session_id = ? `
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

  // Update public index
  dbUpdatePublicChainIndex(id);
}

export function dbGetSubmission(id: string): SubmissionRow | null {
  const row = getDb().prepare(`SELECT * FROM submissions WHERE id = ? `).get(id) as SubmissionRow | undefined;
  return row ?? null;
}

export function dbGetByStripeSession(stripeSessionId: string): SubmissionRow | null {
  const row = getDb().prepare(`SELECT * FROM submissions WHERE stripe_session_id = ? `).get(stripeSessionId) as SubmissionRow | undefined;
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
  mime_type: string | null;
  size_bytes: number | null;
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
    INSERT INTO artifacts(
      id, parent_certificate_id, artifact_type, original_filename,
      canonical_hash, chain_hash, issued_at, storage_key, receipt_pdf_key,
      thought_caption, mime_type, size_bytes
    ) VALUES(
      @id, @parent_certificate_id, @artifact_type, @original_filename,
      @canonical_hash, @chain_hash, @issued_at, @storage_key, @receipt_pdf_key,
      @thought_caption, @mime_type, @size_bytes
    )
      `).run({
    ...a,
    thought_caption: a.thought_caption ?? null,
    mime_type: a.mime_type ?? null,
    size_bytes: a.size_bytes ?? null
  });

  // Update public index
  dbUpdatePublicChainIndex(a.parent_certificate_id);
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
  const row = getDb().prepare(`SELECT * FROM artifacts WHERE id = ? `).get(id) as ArtifactRow | undefined;
  return row ?? null;
}

export function dbArtifactById(id: string): ArtifactRow | null {
  const row = getDb()
    .prepare(`SELECT * FROM artifacts WHERE id = ? `)
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
  const row = getDb().prepare(`SELECT * FROM daily_roots WHERE day_utc = ? `).get(dayUtc) as DailyRootRow | undefined;
  return row ?? null;
}

export function dbUpsertDailyRoot(r: {
  day_utc: string;
  root_hash: string;
  leaf_count: number;
  computed_at: string;
}) {
  getDb().prepare(`
    INSERT INTO daily_roots(day_utc, root_hash, leaf_count, computed_at)
  VALUES(?, ?, ?, ?)
    ON CONFLICT(day_utc) DO UPDATE SET
  root_hash = excluded.root_hash,
    leaf_count = excluded.leaf_count,
    computed_at = excluded.computed_at
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

export type PublicChainRow = {
  chain_id: string;
  genesis_certificate_id: string;
  genesis_issued_at_utc: string | null;
  sealed_count: number;
  last_seal_at_utc: string | null;
  custody_status: string;
  is_public: number;
  created_at_utc: string;
  updated_at_utc: string;
};

export type LedgerAnchorRow = {
  id: number;
  window_start_utc: string | null;
  window_end_utc: string | null;
  records_committed: number | null;
  root_hash_hex: string;
  network: string;
  txid: string | null;
  explorer_url: string | null;
  status: string;
  created_at_utc: string;
};

export function dbGetPublicChains(args: {
  page: number;
  limit: number;
  sort?: "genesis_desc" | "genesis_asc" | "lastseal_desc";
}): { items: PublicChainRow[]; total: number } {
  const db = getDb();
  const offset = (args.page - 1) * args.limit;

  // Sorting logic
  let orderBy = "genesis_issued_at_utc DESC";
  if (args.sort === "genesis_asc") orderBy = "genesis_issued_at_utc ASC";
  if (args.sort === "lastseal_desc") orderBy = "last_seal_at_utc DESC";

  // Count total public chains
  const countRow = db.prepare(`SELECT COUNT(*) as c FROM public_chains WHERE is_public = 1`).get() as { c: number };
  const total = countRow.c;

  // Fetch paginated rows
  const items = db.prepare(`
    SELECT * FROM public_chains 
    WHERE is_public = 1 
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
      `).all(args.limit, offset) as PublicChainRow[];

  return { items, total };
}

export function dbUpdatePublicChainIndex(submissionId: string) {
  // This logic derives the aggregate state for a chain given *any* submission ID in that chain.
  // 1. Find the genesis (root) for this submission.
  // 2. Aggregate all artifacts/submissions in that lineage.
  // 3. Update public_chains table.

  const db = getDb();

  // First, find the row to get genesis. 
  // NOTE: For MVP, we assume submissionId IS the genesis or directly linked. 
  // If we have multi-hop artifacts, we might need to walk up. 
  // However, `dbArtifactsForParent` assumes 1 level of artifacts.

  const sub = db.prepare(`SELECT * FROM submissions WHERE id = ? `).get(submissionId) as SubmissionRow | undefined;
  if (!sub) return;

  // Ideally, if this is an artifact, we'd find the parent. 
  // But dbArtifactsForParent takes the parent ID.
  // We'll simplisticly assume submissionId refers to the 'Certificate' (Genesis).
  // If submissionId is actually an artifact ID, we need to handle that, but `submissions` table only stores certificates.
  // Artifacts are in `artifacts` table. 

  const genesisId = sub.id;
  const genesisTime = sub.issued_at;
  const isPublic = sub.is_public;

  // Count artifacts
  const artifactsCountRow = db.prepare(`SELECT COUNT(*) as c FROM artifacts WHERE parent_certificate_id = ? `).get(genesisId) as { c: number };
  const sealedCount = 1 + artifactsCountRow.c; // Genesis + artifacts

  // Find last seal time
  const lastArtifact = db.prepare(`SELECT issued_at FROM artifacts WHERE parent_certificate_id = ? ORDER BY issued_at DESC LIMIT 1`).get(genesisId) as { issued_at: string } | undefined;
  const lastSeal = lastArtifact ? lastArtifact.issued_at : genesisTime;

  const chainId = formatRegistryNo(sub.registry_no); // "R-..."
  const now = new Date().toISOString();

  // Upsert into public_chains
  db.prepare(`
    INSERT INTO public_chains(
        chain_id, genesis_certificate_id, genesis_issued_at_utc, sealed_count,
        last_seal_at_utc, custody_status, is_public, created_at_utc, updated_at_utc
      ) VALUES(
        @chain_id, @genesis_certificate_id, @genesis_issued_at_utc, @sealed_count,
        @last_seal_at_utc, 'Active', @is_public, @now, @now
      )
    ON CONFLICT(chain_id) DO UPDATE SET
      sealed_count = excluded.sealed_count,
    last_seal_at_utc = excluded.last_seal_at_utc,
    is_public = excluded.is_public,
    updated_at_utc = excluded.updated_at_utc
      `).run({
    chain_id: chainId,
    genesis_certificate_id: genesisId,
    genesis_issued_at_utc: genesisTime,
    sealed_count: sealedCount,
    last_seal_at_utc: lastSeal,
    is_public: isPublic,
    now: now
  });
}

export function dbGetLatestAnchor(): LedgerAnchorRow | null {
  const row = getDb().prepare(`SELECT * FROM ledger_anchors ORDER BY created_at_utc DESC LIMIT 1`).get() as LedgerAnchorRow | undefined;
  return row ?? null;
}