"use client";

import { usePathname } from "next/navigation";

export function NavWrapper() {
    const pathname = usePathname();
    if (pathname === "/") return null;

    return (
        <nav style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 32px",
            background: "white",
            borderBottom: "1px solid #eee",
            marginBottom: "32px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
        }}>
            <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{
                    fontSize: "11px",
                    fontWeight: "normal",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginRight: "32px",
                    color: "#111"
                }}>
                    PROOF OF THOUGHT™
                </div>
            </a>
            <div style={{
                display: "flex",
                alignItems: "center",
                fontSize: "14px",
                fontWeight: 500,
                color: "#666"
            }}>
                <a href="/traction" style={{ textDecoration: "none", color: pathname === "/traction" ? "#111" : "#666" }}>Traction</a>
                <span style={{ margin: "0 16px", color: "#ddd" }}>|</span>
                <a href="/public-ledger" style={{ textDecoration: "none", color: pathname === "/public-ledger" ? "#111" : "#666" }}>Public Ledger</a>
            </div>
        </nav>
    );
}
