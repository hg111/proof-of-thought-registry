"use client";

import Divider from "@/components/Divider";
import Button from "@/components/Button";
import Notice from "@/components/Notice";
import { TENANT_CONFIG } from "@/lib/tenant";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function LandingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isLight = searchParams.get("theme") === "light"; // Default to Dark (false) if not specified

  useEffect(() => {
    // Apply theme to document root for globals.css variables
    if (isLight) {
      document.documentElement.removeAttribute("data-theme");
      document.body.style.background = ""; // Reset inline style from start page if any
      document.body.style.color = "";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      // Explicitly set body background to match var(--bg) to ensure coverage
      document.body.style.background = "#050608";
      document.body.style.color = "#e9edf7";
    }
    return () => {
      document.documentElement.removeAttribute("data-theme");
      document.body.style.background = "";
      document.body.style.color = "";
    };
  }, [isLight]);

  function toggleTheme() {
    const newTheme = isLight ? "dark" : "light";
    const params = new URLSearchParams(searchParams.toString());
    if (newTheme === "light") {
      params.set("theme", "light");
    } else {
      params.delete("theme"); // Default is dark, so remove param
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button
          onClick={toggleTheme}
          style={{
            background: "transparent",
            border: "1px solid var(--rule)",
            color: "var(--muted)",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          title="Toggle Day/Night Mode"
        >
          {isLight ? '🌙 Night' : '☀️ Day'}
        </button>
      </div>

      <div className="kicker">{TENANT_CONFIG.appName}</div>
      <h1 className="h1">{TENANT_CONFIG.heroTitle}</h1>
      <p className="subhead">
        {TENANT_CONFIG.heroSubhead}
      </p>

      {/* Authority Seal */}
      <div style={{ marginBottom: 30, borderRadius: 6, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", maxWidth: 640, margin: "25px auto 30px auto" }}>
        <video
          src="/assets/Cryptographic_Custody_Protocol_Animation_Prompt_5.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100%", display: "block", filter: isLight ? "brightness(1.1)" : "brightness(0.9)" }}
        />
      </div>

      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          margin: "24px 0"
        }}
      />

      <Button href={`/start${isLight ? '?theme=light' : ''}`} style={{ boxShadow: "0 0 15px rgba(66, 153, 225, 0.5)", borderColor: "#4299e1" }}>Get started</Button>
      <p className="small" style={{ marginTop: 18 }}>
        {TENANT_CONFIG.disclaimerSmall}
      </p>

      <Divider />

      <div className="twoCol">
        <div className="card">
          <div className="cardTitle">What this is</div>
          <ul className="list">
            {TENANT_CONFIG.whatItIs.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>

        <div className="card">
          <div className="cardTitle">What this is not</div>
          <ul className="list">
            {TENANT_CONFIG.whatItIsNot.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      </div>

      <Divider />

      <div>
        <div className="kicker">How it works</div>
        <ol className="list">
          {TENANT_CONFIG.howItWorks.map((step, i) => (
            <li key={i}><b>{step.title}</b> {step.desc}</li>
          ))}
        </ol>
      </div>

      <Divider />

      {/* Authority Seal */}
      <div className="heroSeal" style={{ margin: "30px 0", textAlign: "center" }}>
        <img
          src="/assets/proof_of_thought_timestamp_seal.png"
          alt="Proof of Thought Timestamp Seal"
          style={{ maxWidth: "100%", width: "150px", height: "auto" }}
        />
      </div>

      <div>
        <div className="kicker">Pricing</div>
        <ul className="list">
          <li><b>$29</b> — Single Certificate</li>
        </ul>
        <p className="small">
          Individual certificates are available today. Institutional, enterprise, and long-horizon custody tiers will be available shortly.
        </p>
      </div>

      {TENANT_CONFIG.whitepaperLinkText && (
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <a
            href="/assets/Proof_of_Thought_Genesis_White_Paper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)", fontSize: "0.9rem", textDecoration: "none" }}
          >
            {TENANT_CONFIG.whitepaperLinkText}
          </a>
        </div>
      )}

      <div className="footer">
        <a href={`/public-ledger${isLight ? '?theme=light' : ''}`}>Public Ledger</a>
        <span>Verification Portal</span>
        <span>Terms</span>
        <span>Privacy</span>
        <a href={`/contact${isLight ? '?theme=light' : ''}`}>Contact</a>
      </div>
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "var(--muted)" }}>
        {TENANT_CONFIG.footerTagline}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <LandingPageContent />
    </Suspense>
  );
}
