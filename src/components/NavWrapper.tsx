"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function NavContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (pathname === "/") return null;

    const isStartPage = pathname === "/start";
    // Defaults to dark unless theme=light is explicitly set
    const isDarkTheme = isStartPage && searchParams.get("theme") !== "light";

    return (
        <nav style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 32px",
            background: isDarkTheme ? "#050608" : "white",
            borderBottom: isDarkTheme ? "1px solid #24304a" : "1px solid #eee",
            // Always 0px margin on start page to prevent layout shift
            marginBottom: isStartPage ? "0px" : "32px",
            boxShadow: isDarkTheme ? "none" : "0 1px 2px rgba(0,0,0,0.02)"
        }}>
            <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{
                    fontSize: "11px",
                    fontWeight: "normal",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginRight: "32px",
                    color: isDarkTheme ? "#e9edf7" : "#111"
                }}>
                    PROOF OF THOUGHT™
                </div>
            </a>
            <div style={{
                display: "flex",
                alignItems: "center",
                fontSize: "14px",
                fontWeight: 500,
                color: isDarkTheme ? "#a6b0c5" : "#666"
            }}>
                <a href="/traction" style={{ textDecoration: "none", color: pathname === "/traction" ? (isDarkTheme ? "#fff" : "#111") : (isDarkTheme ? "#a6b0c5" : "#666") }}>Traction</a>
                <span style={{ margin: "0 16px", color: isDarkTheme ? "#24304a" : "#ddd" }}>|</span>
                <a href="/public-ledger" style={{ textDecoration: "none", color: pathname === "/public-ledger" ? (isDarkTheme ? "#fff" : "#111") : (isDarkTheme ? "#a6b0c5" : "#666") }}>Public Ledger</a>
            </div>
        </nav>
    );
}

export function NavWrapper() {
    return (
        <Suspense fallback={null}>
            <NavContent />
        </Suspense>
    );
}
