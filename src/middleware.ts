 

// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "pot_private_access";

function isPublicPath(pathname: string) {
  // Next internals + static
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname === "/robots.txt") return true;
  if (pathname.startsWith("/sitemap")) return true;

  // Public verification is intentionally public-safe
  if (pathname.startsWith("/verify")) return true;

  // Stripe webhook must remain reachable
  if (pathname.startsWith("/api/webhooks/stripe")) return true;

  // ✅ Gate page + gate form action must be public
  if (pathname === "/gate") return true;
  if (pathname === "/api/private-access") return true;

  // Everything else is gated (INCLUDING "/")
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // (Optional) quick sanity log — you can delete later
  console.log("[middleware] path:", pathname);

  if (isPublicPath(pathname)) return NextResponse.next();

  const hasAccess = req.cookies.get(COOKIE_NAME)?.value === "1";
  if (hasAccess) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.searchParams.set("next", pathname + (search || ""));
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/:path*"],
};