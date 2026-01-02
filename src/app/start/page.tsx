"use client";

import { useState } from "react";
import Divider from "@/components/Divider";
import Field from "@/components/Field";
import Button from "@/components/Button";
import Notice from "@/components/Notice";

export default function StartPage() {
  const [title, setTitle] = useState("");
  const [holderName, setHolderName] = useState("");
  const [holderEmail, setHolderEmail] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit() {
    setErr(null);
    setBusy(true);
    try {
      const r1 = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, holderName, holderEmail, text })
      });
      const j1 = await r1.json();
      if (!r1.ok) throw new Error(j1?.error || "Failed to create submission.");

      const r2 = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: j1.id, token: j1.token })
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

      <div className="formRow">
        <Field label="Title (optional)">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Holder name (optional)">
          <input className="input" value={holderName} onChange={(e) => setHolderName(e.target.value)} />
        </Field>
      </div>

      <div className="formRow" style={{ marginTop: 10 }}>
        <Field label="Holder email (optional)">
          <input className="input" value={holderEmail} onChange={(e) => setHolderEmail(e.target.value)} />
        </Field>
        <div />
      </div>

      <div style={{ marginTop: 12 }}>
        <Field label="Original submission (verbatim)">
          <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <p className="small" style={{ marginTop: 8 }}>
          The certificate reflects your submission verbatim (with line-ending normalization for fingerprint stability).
        </p>
      </div>

      {err && (
        <>
          <Divider />
          <Notice title="Error">{err}</Notice>
        </>
      )}

      <Divider />

      <Button onClick={onSubmit} disabled={busy || text.trim().length === 0}>
        {busy ? "Processing…" : "Continue to Payment"}
      </Button>

      <p className="small" style={{ marginTop: 10 }}>
        By continuing, you acknowledge this is not legal advice and not a patent filing.
      </p>
    </>
  );
}
