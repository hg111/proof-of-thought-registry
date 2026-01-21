import "./globals.css";
import type { Metadata } from "next";
import { NavWrapper } from "@/components/NavWrapper";

export const metadata: Metadata = {
  title: "PROOF OF THOUGHT™",
  description: "Independent digital evidence custodian — Certificates of Conception & Possession."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <NavWrapper />
        <div className="container mx-auto px-6">{children}</div>
      </body>
    </html>
  );
}
