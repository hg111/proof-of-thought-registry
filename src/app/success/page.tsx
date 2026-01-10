import Divider from "@/components/Divider";
import MonoBlock from "@/components/MonoBlock";
import Button from "@/components/Button";
import { dbArtifactsForParent, dbGetSubmission } from "@/lib/db";
//import CopyPrivateControlLink from "@/components/CopyPrivateControlLink";
import { config } from "@/lib/config";
import nextDynamic from "next/dynamic";

export const dynamic = 'force-dynamic';


const CopyPrivateControlLink = nextDynamic(
  () => import("@/components/CopyPrivateControlLink"),
  { ssr: false }
);

const SealPoller = nextDynamic(() => import("@/components/SealPoller"), { ssr: false });
const ChainTimeline = nextDynamic(() => import("@/components/ChainTimeline"), { ssr: true });
const SuccessPageWrapper = nextDynamic(() => import("@/components/SuccessPageWrapper"), { ssr: false });

const fmtUtcSafe = (v: any) => {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toUTCString();
};

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

  const privateUrl = `${config.appBaseUrl}/success?id=${encodeURIComponent(sub.id)}&t=${encodeURIComponent(t)}`;


  return (
    <SuccessPageWrapper>
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

      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
        <Button
          href={`/vault?id=${encodeURIComponent(sub.id)}&t=${encodeURIComponent(t)}`}
          tooltip={
            <>
              <strong>Privately view your sealed Thought under custodial lock</strong> —<br />
              without downloading or exposing the record.
            </>
          }
        >
          Preview in Vault
        </Button>

        <Button
          href={`/api/download/${encodeURIComponent(sub.id)}?t=${encodeURIComponent(t)}`}
          tooltip={
            <>
              <strong>This is your original Proof-of-Thought certificate.</strong><br />
              It establishes when your idea was first sealed <br />under third-party cryptographic custody.
            </>
          }
        >
          Download PDF
        </Button>

        {artifacts.length > 0 ? (
          <Button
            href={`/api/chain/${encodeURIComponent(sub.id)}/download?t=${encodeURIComponent(t)}`}
            tooltip={
              <>
                <strong>This is the full cryptographic lineage of your Thought</strong> —<br />
                showing how your idea evolved over time with provable continuity.
              </>
            }
          >
            Download Chain PDF
          </Button>
        ) : null}

        <Button
          href={`/api/control-slip/${encodeURIComponent(sub.id)}?t=${encodeURIComponent(t)}`}
          tooltip={
            <>
              <strong>This slip is your custody recovery instrument.</strong><br />
              It allows you to reclaim, prove, and transfer this Thought chain<br /> even if the platform disappears.<br />
              <span style={{ color: "#d32f2f" }}>Store it offline in a safe place.</span>
            </>
          }
        >
          Download Control Slip
        </Button>

        <CopyPrivateControlLink url={privateUrl} />

        {sub.is_public ? (
          <Button
            href={`/public-ledger`}
            tooltip={
              <>
                <strong>This chain is listed on the Public Ledger.</strong>
                <br />
                Click to view the public index.
              </>
            }
          >
            View on Public Ledger
          </Button>
        ) : null}

        {sub.record_class === "ENGRAVED" && sub.seal_object_key ? (
          <Button
            href={`/api/seal/${encodeURIComponent(sub.id)}/download?t=${encodeURIComponent(t)}`}
            tooltip={
              <>
                <strong>Download a high-resolution evidentiary seal for this certificate.</strong><br />
                The seal encodes key verification details (e.g., hashes and identifiers)<br /> for printing, engraving, or archival use.
              </>
            }
          >
            🔵 Download Seal (PNG)
          </Button>
        ) : sub.record_class === "ENGRAVED" ? (
          <SealPoller />
        ) : null}
      </div>

      <p className="small" style={{ marginTop: 10 }}>
        Public verification link:{" "}
        <a href={`/verify/${encodeURIComponent(sub.id)}`}>{`${sub.id}`}</a>
      </p>
      <Divider />

      <div className="kicker">Ledger</div>
      <h2 className="h2" style={{ marginBottom: 10 }}>Certificate timeline</h2>
      <p className="subhead" style={{ marginBottom: 20 }}>
        Page 1 is your Genesis Proof. Add sealed pages as your idea evolves.
      </p>

      <ChainTimeline
        genesis={{
          id: sub.id,
          issuedAt: sub.issued_at || sub.created_at,
          hash: sub.content_hash,
          label: sub.title || "Untitled Thought"
        }}
        artifacts={artifacts.map(a => ({
          id: a.id,
          issuedAt: a.issued_at,
          filename: a.original_filename,
          note: a.thought_caption,
          hash: a.canonical_hash,
          chainHash: a.chain_hash
        }))}
        accessKey={t}
        initialUnitLabel={sub.unit_label ?? "PAGE"}
      />
    </SuccessPageWrapper>
  );
}
