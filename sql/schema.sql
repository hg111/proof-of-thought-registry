CREATE TABLE IF NOT EXISTS submissions (
  id               TEXT PRIMARY KEY,

  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  issued_at        TEXT,

  status           TEXT NOT NULL,
  receipt_pdf_key  TEXT,
  chain_pdf_key    TEXT,
  record_class     TEXT NOT NULL DEFAULT 'GENESIS',

  title            TEXT,
  holder_name      TEXT,
  holder_email     TEXT,

  canonical_text   TEXT NOT NULL,
  content_hash     TEXT NOT NULL,

  pdf_object_key   TEXT,
  seal_object_key  TEXT,

  verify_slug      TEXT NOT NULL,
  access_token     TEXT NOT NULL,

  stripe_session_id     TEXT,
  stripe_payment_intent TEXT,

  amount_cents     INTEGER,
  currency         TEXT
);