// src/app/api/private-access/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COOKIE_NAME = "pot_private_access";

/** Prevent open-redirects — allow only internal paths */
function sanitizeNext(nextRaw: string) {
  const n = String(nextRaw || "").trim();
  if (!n.startsWith("/")) return "/";
  if (n.startsWith("//")) return "/";
  return n;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const phrase = String(form.get("phrase") ?? "").trim();
  const nextRaw = String(form.get("next") ?? "/").trim() || "/";

  const expectedRaw = String(process.env.POT_PRIVATE_PHRASE ?? "").trim();
  const validPhrases = expectedRaw.split(",").map(p => p.trim()).filter(Boolean);

  if (validPhrases.length === 0) {
    return NextResponse.json(
      { error: "Server missing POT_PRIVATE_PHRASE." },
      { status: 500 }
    );
  }

  // Wrong phrase → back to gate
  if (!validPhrases.includes(phrase)) {
    const url = new URL(req.url);
    url.pathname = "/gate";
    url.searchParams.set("e", "1");
    url.searchParams.set("next", nextRaw);
    return NextResponse.redirect(url);
  }

  // Correct phrase → set cookie + redirect to intended page
  const safeNext = sanitizeNext(nextRaw);
  // Use configured public URL aka APP_BASE_URL to avoid internal docker IP (0.0.0.0) leaking into redirect
  const baseUrl = process.env.APP_BASE_URL || req.url;
  const res = NextResponse.redirect(new URL(safeNext, baseUrl));

  res.cookies.set({
    name: COOKIE_NAME,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    // Allow insecure cookie on localhost for Docker testing, otherwise ensure HTTPS
    // Allow insecure cookie on localhost/0.0.0.0 for Docker testing
    secure: process.env.NODE_ENV === "production" &&
      !req.headers.get("host")?.includes("localhost") &&
      !req.headers.get("host")?.includes("0.0.0.0") &&
      !req.url.includes("localhost"),
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}