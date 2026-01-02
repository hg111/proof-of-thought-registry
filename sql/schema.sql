create table if not exists submissions (
  id text primary key,
  created_at timestamptz default now(),
  issued_at timestamptz,
  status text not null,
  title text,
  holder_name text,
  holder_email text,
  canonical_text text not null,
  content_hash text not null,
  pdf_object_key text,
  verify_slug text not null,
  access_token text not null,
  stripe_session_id text,
  stripe_payment_intent text,
  amount_cents int,
  currency text
);