create table if not exists artifacts (
  id text primary key,
  parent_certificate_id text not null references submissions(id),
  artifact_type text not null,
  original_filename text not null,
  canonical_hash text not null,
  chain_hash text not null,
  issued_at timestamptz not null default now(),
  storage_key text not null,
  receipt_pdf_key text not null
);

create index if not exists idx_artifacts_parent
  on artifacts(parent_certificate_id);