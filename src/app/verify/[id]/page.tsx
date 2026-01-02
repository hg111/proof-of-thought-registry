import Divider from "@/components/Divider";
import MonoBlock from "@/components/MonoBlock";
import Notice from "@/components/Notice";
import { dbGetSubmission, formatRegistryNo } from "@/lib/db";
import { getDailyRootForDate } from "@/lib/dailyRoots";


export default async function VerifyPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const sub = dbGetSubmission(id);

  if (!sub) {
    return (
      <>
        <h1 className="h1">Not found</h1>
      </>
    );
  }

  const issuedDate = sub.issued_at?.slice(0, 10); // YYYY-MM-DD
  const root = issuedDate ? await getDailyRootForDate(issuedDate) : null;

  return (
    <>
      <div className="kicker">Verification portal</div>
      <h1 className="h1">Certificate verification</h1>
      <p className="subhead">
        This page confirms the registry record for the certificate identifier below.
      </p>

      <Divider />

      <MonoBlock label="Certificate ID" value={sub.id} />
      <MonoBlock label="Registry No." value={formatRegistryNo(sub.registry_no)} />
      <MonoBlock label="Issued at (UTC)" value={sub.issued_at ?? "—"} />
      <MonoBlock label="Hash algorithm" value="SHA-256" />
      <MonoBlock label="Content hash" value={sub.content_hash} />
      <MonoBlock label="Status" value={sub.status} />

      <Divider />

      {root && (
        <>
          <div className="kicker">Public cryptographic anchor</div>

          <MonoBlock label="Daily Merkle Root" value={root.root} />

          <MonoBlock
            label="Public root ledger"
            value={root.url}
          />

          <Notice title="Why this matters">
            Your certificate hash is mathematically included inside this public daily Merkle root.
            This root is published in an immutable public ledger. This makes your proof tamper-evident,
            permanent, and independently verifiable by anyone in the world.
          </Notice>

          <Divider />
        </>
      )}

      <Notice title="Purpose limitation">
        This record establishes third-party custody and timestamped possession evidence.

        <br /><br />

        <b>In plain terms:</b> think of this like sealing your idea inside a public, tamper-proof time vault.

        <br /><br />

        On the day your certificate was issued, your idea’s unique fingerprint was mathematically locked
        into a public daily ledger that cannot be secretly altered or erased.

        <br /><br />

        <i>It does not constitute legal advice, patent registration, or governmental filing.</i>

        <br /><br />

        This allows anyone — today or years from now — to independently verify that your idea already existed
        on this exact date.
      </Notice>
    </>
  );
}