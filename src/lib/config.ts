function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const config = {
  appBaseUrl: req("APP_BASE_URL"),
  dataDir: process.env.DATA_DIR || "./data",
  stripeSecretKey: req("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: req("STRIPE_WEBHOOK_SECRET"),
  stripePriceId: req("STRIPE_PRICE_ID"),
  maxTextChars: Number(process.env.MAX_TEXT_CHARS || "50000")
};
