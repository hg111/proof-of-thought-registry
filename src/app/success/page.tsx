import Divider from "@/components/Divider";
import MonoBlock from "@/components/MonoBlock";
import Button from "@/components/Button";
import { dbArtifactsForParent, dbGetSubmission } from "@/lib/db";

export default async function SuccessPage({ searchParams }: { searchParams: { id?: string; t?: string } }) {
  const id = searchParams?.id || "";
  const t = searchParams?.t || "";

  if (!id || !t) {
    return (
      <>
        <h1 className="h1">Missing parameters</h1>
        <p className="subhead">This page requires a certificate ID and access token.</p>
      </>
    );
  }

  const sub = dbGetSubmission(id);
  const artifacts = dbArtifactsForParent(id);
  if (!sub) {
    return (
      <>
        <h1 className="h1">Not found</h1>
      </>
    );
  }

  if (sub.access_token !== t) {
    return (
      <>
        <h1 className="h1">Access denied</h1>
      </>
    );
  }

  return (
    <>
      <div className="kicker">Issued</div>
      <h1 className="h1">Certificate available</h1>
      <p className="subhead">
        If payment has completed, your certificate will be issued and preserved in custody. If you refreshed too quickly,
        wait a moment and refresh.
      </p>

      <Divider />
      <MonoBlock label="Certificate ID" value={sub.id} />
      <MonoBlock label="Status" value={sub.status} />

      <Divider />

      <Button href={`/api/download/${encodeURIComponent(sub.id)}?t=${encodeURIComponent(t)}`}>
        Download PDF
      </Button>

      <p className="small" style={{ marginTop: 10 }}>
        Public verification link:{" "}
        <a href={`/verify/${encodeURIComponent(sub.id)}`}>{`${sub.id}`}</a>
      </p>
            <Divider />

      <div className="kicker">Ledger</div>
      <h2 className="h2">Certificate timeline</h2>
      <p className="subhead">
        Page 1 is your Genesis Proof. Add sealed pages as your idea evolves.
      </p>

      <Divider />
      <MonoBlock label="Page 1 — Genesis Proof" value={sub.issued_at ? new Date(sub.issued_at).toUTCString() : "—"} />
      <MonoBlock label="Genesis hash (SHA-256)" value={sub.content_hash} />

      {artifacts.length > 0 && (
        <>
          <Divider />
          {artifacts.map((a, idx) => (
            <div key={a.id} style={{ marginBottom: 14 }}>
              <MonoBlock label={`Page ${idx + 2} — Sealed Image`} value={`${a.original_filename}`} />
              <MonoBlock label="Issued (UTC)" value={new Date(a.issued_at).toUTCString()} />
              <MonoBlock label="Canonical hash (SHA-256)" value={a.canonical_hash} />
              <MonoBlock label="Chain hash" value={a.chain_hash} />
              <div style={{ marginTop: 8 }}>
                <Button href={`/api/artifacts/${encodeURIComponent(a.id)}/download?t=${encodeURIComponent(t)}`}>
                  Download sealed receipt (PDF)
                </Button>
              </div>
              <Divider />
            </div>
          ))}
        </>
      )}

      <Button href={`/success/add-artifact?id=${encodeURIComponent(sub.id)}&t=${encodeURIComponent(t)}`}>
        ➕ Add sealed page
      </Button>
    </>
  );
}
