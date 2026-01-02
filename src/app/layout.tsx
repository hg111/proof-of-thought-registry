import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proof of Thought™",
  description: "Independent digital evidence custodian — Certificates of Conception & Possession."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
