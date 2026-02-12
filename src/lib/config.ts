import path from "path";

/* ---------- Safe optional helpers (non-Stripe) ---------- */

function opt(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length ? v : fallback;
}

function optInt(name: string, fallback: number) {
  const v = process.env[name];
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/* ---------- REQUIRED helper ---------- */

function req(name: string): string {
  const v = process.env[name];
  if (!v || !v.length) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

/* ---------- Safe config (may be imported anywhere) ---------- */

export const config = {
  appBaseUrl: opt("APP_BASE_URL", "http://localhost:3333"),
  dataDir: opt("DATA_DIR", path.join(process.cwd(), "data")),
  maxTextChars: optInt("MAX_TEXT_CHARS", 250000),
  pricingTiersEnabled: (() => {
    // START FIX: Direct access required for Next.js to inline the value on client
    // We check both for backward compatibility (server-side might use non-public var)
    return process.env.NEXT_PUBLIC_PRICING_TIERS_ENABLED === 'true' ||
      process.env.PRICING_TIERS_ENABLED === 'true';
    // END FIX
  })(),
};

/* ---------- Stripe authority config (FAIL FAST - LAZY) ---------- */

export const stripeConfig = {
  get secretKey() { return req("STRIPE_SECRET_KEY"); },
  get webhookSecret() { return req("STRIPE_WEBHOOK_SECRET"); },
  get priceGenesis() { return req("STRIPE_PRICE_GENESIS"); },
  get priceMinted() { return req("STRIPE_PRICE_MINTED"); },
  get priceEngraved() { return req("STRIPE_PRICE_ENGRAVED"); },
};