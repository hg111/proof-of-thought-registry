export function requireNonEmpty(s: string, field: string) {
  if (!s || s.trim().length === 0) throw new Error(`${field} is required.`);
}

export function safeText(s: string, max: number) {
  const t = (s ?? "").trim();
  return t.length > max ? t.slice(0, max) : t;
}

export function isProbablyEmail(s: string): boolean {
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
