import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proof of Thought™",
  description: "Independent digital evidence custodian — Certificates of Conception & Possession."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <nav className="border-b bg-white px-6 py-3 flex items-center justify-between mb-8 shadow-sm">
          <div className="font-bold text-lg tracking-tight">Proof of Thought™</div>
          <div className="space-x-4 text-sm font-medium">
            <a href="/" className="hover:underline">Dashboard</a>
            <a href="/public-ledger" className="hover:underline text-blue-600">Public Ledger</a>
          </div>
        </nav>
        <div className="container mx-auto px-6">{children}</div>
      </body>
    </html>
  );
}
