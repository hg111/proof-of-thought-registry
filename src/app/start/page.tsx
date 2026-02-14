"use client";

import "./start.css";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Notice from "@/components/Notice";
import type { RecordClass } from "@/lib/records";

function StartPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isLight = searchParams.get("theme") === "light";

  const [title, setTitle] = useState("");
  const [holderName, setHolderName] = useState("");
  const [holderEmail, setHolderEmail] = useState("");
  const [text, setText] = useState("");
  const [recordClass, setRecordClass] = useState<RecordClass>("GENESIS");
  const [isPublic, setIsPublic] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Override global body background for full-page theme consistency
    document.body.style.background = isLight ? "#f3f4f6" : "#050608";
    return () => { document.body.style.background = ""; };
  }, [isLight]);

  function toggleTheme() {
    const newTheme = isLight ? "dark" : "light";
    const params = new URLSearchParams(searchParams.toString());
    if (newTheme === "light") {
      params.set("theme", "light");
    } else {
      params.delete("theme");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  async function onSubmit() {
    setErr(null);
    setBusy(true);

    try {
      const r1 = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, holderName, holderEmail, text, recordClass, isPublic }),
      });
      const j1 = await r1.json();
      if (!r1.ok) throw new Error(j1?.error || "Failed to create submission.");

      const r2 = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: j1.id, token: j1.token, recordClass }),
      });
      const j2 = await r2.json();
      if (!r2.ok) throw new Error(j2?.error || "Failed to create checkout.");

      window.location.href = j2.url;
    } catch (e: any) {
      setErr(e?.message || "Error.");
      setBusy(false);
    }
  }

  return (
    <div className={`start-page ${isLight ? "light-mode" : ""}`}>
      <div className="start-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="start-kicker">Start</div>
          <button
            onClick={toggleTheme}
            className="start-toggle-btn"
            title="Toggle Day/Night Mode"
          >
            {isLight ? '🌙 Night' : '☀️ Day'}
          </button>
        </div>

        <h1 className="start-h1">Create a Certificate of Conception &amp; Possession</h1>
        <p className="start-sub">
          Your submission will be canonicalized, fingerprinted (SHA-256), preserved in custody, and issued as a formal PDF after payment.
        </p>

        <hr className="start-divider" />

        <div className="start-section">
          <h3 className="start-section-hdr">1. Identity</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label className="start-label">Record Title (optional)</label>
              <input
                className="start-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Project Orion"
              />
            </div>
            <div>
              <label className="start-label">Holder Name (optional)</label>
              <input
                className="start-input"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="e.g. Dr. A. Smith"
              />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="start-label">Holder Email (optional)</label>
            <input
              className="start-input"
              value={holderEmail}
              onChange={(e) => setHolderEmail(e.target.value)}
              placeholder="For receipt delivery"
            />
          </div>
        </div>

        <div className="start-section">
          <h3 className="start-section-hdr">2. The Thought (Genesis Record)</h3>
          <label className="start-label">Original Submission (Verbatim)</label>
          <textarea
            className="start-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your idea, claim, or prose here directly..."
          />
          <p className="start-sub" style={{ fontSize: 12, marginTop: 8 }}>
            This text will be canonically hashed. Ensure it is complete.
          </p>
        </div>

        {err && (
          <div style={{ marginBottom: 32 }}>
            <Notice title="Error">{err}</Notice>
          </div>
        )}

        <div className="start-section">
          <h3 className="start-section-hdr">3. Custody &amp; issuance</h3>

          <label className="start-label" style={{ marginBottom: 12 }}>Select Instrument Class</label>

          <div className="start-radio-group">
            {/* GENESIS */}
            <label className={`start-radio-card ${recordClass === "GENESIS" ? "selected" : ""}`}>
              <input
                type="radio"
                name="recordClass"
                value="GENESIS"
                checked={recordClass === "GENESIS"}
                onChange={() => setRecordClass("GENESIS")}
              />
              <div>
                <div className="start-tier-title">Genesis Record — $29</div>
                <div className="start-tier-desc">
                  Create a permanent, cryptographically verifiable, time-stamped record showing that you possessed an original idea at a specific moment in time.
                </div>
              </div>
            </label>

            {/* MINTED */}
            <label className={`start-radio-card ${recordClass === "MINTED" ? "selected" : ""}`}>
              <input
                type="radio"
                name="recordClass"
                value="MINTED"
                checked={recordClass === "MINTED"}
                onChange={() => setRecordClass("MINTED")}
              />
              <div>
                <div className="start-tier-title">Minted Instrument — $49</div>
                <div className="start-tier-desc">
                  Everything in Genesis, plus <strong>Traction Dashboard</strong>. Track verification signals, valuation interest, and chain-of-custody analytics.
                </div>
              </div>
            </label>

            {/* ENGRAVED */}
            <label className={`start-radio-card ${recordClass === "ENGRAVED" ? "selected" : ""}`}>
              <input
                type="radio"
                name="recordClass"
                value="ENGRAVED"
                checked={recordClass === "ENGRAVED"}
                onChange={() => setRecordClass("ENGRAVED")}
              />
              <div>
                <div className="start-tier-title">Engraved Instrument — $99</div>
                <div className="start-tier-desc">
                  Everything in Minted, plus <strong>Deal Room</strong>. Clickwrap NDA, Disclosure Management, Public Proof, and Engraved Seal.
                </div>
              </div>
            </label>
          </div>

          <div style={{ margin: "24px 0", height: 1, background: isLight ? "#eee" : "rgba(255,255,255,0.1)" }}></div>

          <div className="start-checkbox-box">
            <label style={{ display: "flex", gap: 12, cursor: "pointer", userSelect: "none" }}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: "#6aa6ff" }}
              />
              <div>
                <span className="start-tier-title">List on Public Ledger</span>
                <span className="start-tier-desc" style={{ display: "block" }}>
                  Your Chain ID will be indexed publicly. Content remains private.
                </span>
              </div>
            </label>
          </div>
        </div>

        <button className="start-btn" onClick={onSubmit} disabled={busy || text.trim().length === 0}>
          {busy ? "Processing…" : "Proceed to Payment"}
        </button>

        <p className="start-disclaimer">
          By continuing, you acknowledge this is not legal advice.
        </p>
      </div>
    </div>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={null}>
      <StartPageContent />
    </Suspense>
  );
}