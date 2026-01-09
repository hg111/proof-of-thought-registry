import Button from "@/components/Button";
import Divider from "@/components/Divider";
import AddArtifactForm from "./AddArtifactForm";

export const dynamic = "force-dynamic";

export default function AddArtifactPage({
  searchParams,
}: {
  searchParams: { id?: string; t?: string };
}) {
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

  return (
    <>
      <div className="kicker">Ledger</div>
      <h1 className="h1">Add a sealed page</h1>
      <p className="subhead">
        Upload a sketch or photo. It will be sealed, timestamped, and permanently attached to your original proof.
      </p>

      <Divider />

      <AddArtifactForm parentId={id} t={t} />

      <p className="small" style={{ marginTop: 14 }}>
        <a href={`/success?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`}>← Back to certificate</a>
      </p>
    </>
  );
}
