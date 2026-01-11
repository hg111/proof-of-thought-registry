"use client";

import { useState } from "react";
import Divider from "@/components/Divider";
import Field from "@/components/Field";
import Button from "@/components/Button";
import Notice from "@/components/Notice";
import type { RecordClass } from "@/lib/records";

export default function StartPage() {
  const [title, setTitle] = useState("");
  const [holderName, setHolderName] = useState("");
  const [holderEmail, setHolderEmail] = useState("");
  const [text, setText] = useState("");
  const [recordClass, setRecordClass] = useState<RecordClass>("GENESIS");
  const [isPublic, setIsPublic] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    <>
      <div className="kicker">Start</div>
      <h1 className="h1">Create a Certificate of Conception &amp; Possession</h1>
      <p className="subhead">
        Your submission will be canonicalized, fingerprinted (SHA-256), preserved in custody, and issued as a formal PDF after payment.
      </p>

      <Divider />

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: 16, borderBottom: "1px solid #eee", paddingBottom: 8 }}>
          1. Identity
        </h3>
        <div className="formRow">
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Record Title (optional)</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Orion"
              style={{ fontFamily: "inherit" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Holder Name (optional)</label>
            <input
              className="input"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="e.g. Dr. A. Smith"
            />
          </div>
        </div>
        <div className="formRow" style={{ marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Holder Email (optional)</label>
            <input
              className="input"
              value={holderEmail}
              onChange={(e) => setHolderEmail(e.target.value)}
              placeholder="For receipt delivery"
            />
          </div>
          <div style={{ flex: 1 }} />
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: 16, borderBottom: "1px solid #eee", paddingBottom: 8 }}>
          2. The Thought (Genesis Record)
        </h3>
        <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Original Submission (Verbatim)</label>
        <textarea
          className="textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ fontFamily: "'Courier Prime', 'Courier New', monospace", fontSize: 14, lineHeight: "1.5", minHeight: 180, padding: 16 }}
          placeholder="Enter your idea, claim, or prose here directly..."
        />
        <p className="small" style={{ marginTop: 8, color: "#888" }}>
          This text will be canonically hashed. Ensure it is complete.
        </p>
      </div>

      {err && (
        <div style={{ marginBottom: 32 }}>
          <Notice title="Error">{err}</Notice>
        </div>
      )}

      <div style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: 16, borderBottom: "1px solid #eee", paddingBottom: 8 }}>
          3. Custody &amp; issuance
        </h3>

        <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Select Instrument Class</label>
        <select
          value={recordClass}
          onChange={(e) => setRecordClass(e.target.value as RecordClass)}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            border: "1px solid #ddd",
            background: "#f9fafb",
            fontSize: 14,
            fontFamily: "inherit",
            marginBottom: 16,
            cursor: "pointer"
          }}
        >
          <option value="GENESIS">Genesis Record — $29 (Standard Receipt)</option>
          <option value="MINTED">Minted Instrument — $49 (Serial Numbered)</option>
          <option value="ENGRAVED">Engraved Instrument — $99 (With High-Res Seal)</option>
        </select>

        <div style={{ marginBottom: 20, padding: "12px", background: "#f5f5f5", border: "1px solid #eee" }}>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#000" }}
            />
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, display: "block" }}>List on Public Ledger</span>
              <span style={{ fontSize: 12, color: "#666", display: "block", marginTop: 2 }}>
                Your Chain ID will be indexed publicly. Content remains private.
              </span>
            </div>
          </label>
        </div>
      </div>

      <Button onClick={onSubmit} disabled={busy || text.trim().length === 0}>
        {busy ? "Processing…" : "Proceed to Payment"}
      </Button>

      <p className="small" style={{ marginTop: 16, color: "#999" }}>
        By continuing, you acknowledge this is not legal advice.
      </p>
    </>
  );
}