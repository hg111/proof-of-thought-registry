import "./globals.css";
import type { Metadata } from "next";
import { NavWrapper } from "@/components/NavWrapper";
import { TENANT_CONFIG, isWillsTheme } from "@/lib/tenant";

export const metadata: Metadata = {
  title: TENANT_CONFIG.appName, // Dynamic based on tenant
  description: "Independent digital evidence custodian \u2014 Certificates of Conception & Possession."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`bg-gray-50 text-gray-900 ${isWillsTheme ? 'theme-wills' : ''}`}>
        <NavWrapper />
        <div className="container mx-auto px-6">{children}</div>
      </body>
    </html>
  );
}
