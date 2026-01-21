"use client";

import { usePathname } from "next/navigation";

export function NavWrapper() {
    const pathname = usePathname();
    if (pathname === "/") return null;

    return (
        <nav className="border-b bg-white px-6 py-3 flex items-center justify-between mb-8 shadow-sm">
            <div className="font-bold text-lg tracking-tight">Proof of Thought™</div>
            <div className="space-x-4 text-sm font-medium">
                <a href="/" className="hover:underline">Dashboard</a>
                <a href="/public-ledger" className="hover:underline text-blue-600">Public Ledger</a>
            </div>
        </nav>
    );
}
