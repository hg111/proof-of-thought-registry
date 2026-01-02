import Button from "@/components/Button";
import Divider from "@/components/Divider";

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

      <form action="/api/artifacts" method="post" encType="multipart/form-data">
        <input type="hidden" name="parentId" value={id} />
        <input type="hidden" name="t" value={t} />

        <label className="small">Image</label>
        <input
          style={{ display: "block", marginTop: 8, marginBottom: 16 }}
          type="file"
          name="file"
          accept="image/*"
          required
        />

        <Button>Seal Page</Button>
      </form>

      <p className="small" style={{ marginTop: 14 }}>
        <a href={`/success?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`}>← Back to certificate</a>
      </p>
    </>
  );
}
