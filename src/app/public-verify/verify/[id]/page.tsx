import Divider from "@/components/Divider";
import MonoBlock from "@/components/MonoBlock";
import { dbGetSubmission } from "@/lib/db";
import { getDailyRootForDate } from "@/lib/dailyRoots";

export default function PublicVerify({ params }: { params: { id: string } }) {
  const sub = dbGetSubmission(params.id);
  if (!sub) return <h1>Not Found</h1>;

  const day = sub.issued_at?.slice(0, 10) ?? null;
  const root = day ? getDailyRootForDate(day) : null;

  return (
    <>
      <div className="kicker">Public Registry</div>
      <h1 className="h1">Certificate Verification</h1>

      <Divider />

      <MonoBlock label="Certificate ID" value={sub.id} />
      <MonoBlock label="Registry No." value={sub.registry_no ? `R-${String(sub.registry_no).padStart(16, "0")}` : "—"} />
      <MonoBlock label="Issued (UTC)" value={sub.issued_at ?? "—"} />
      <MonoBlock label="Content Hash" value={sub.content_hash} />

      {root && (
        <>
          <Divider />
          <MonoBlock label="Daily Merkle Root" value={root.root} />
          <MonoBlock label="Public Ledger Entry" value={root.url} />
        </>
      )}
    </>
  );
}