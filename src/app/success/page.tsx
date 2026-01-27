import { dbArtifactsForParent, dbGetSubmission } from "@/lib/db";
import { config } from "@/lib/config";
import SuccessView from "@/components/SuccessView";

export const dynamic = 'force-dynamic';

export default async function SuccessPage({ searchParams }: { searchParams: { id?: string; t?: string } }) {
  const id = searchParams?.id || "";
  const t = searchParams?.t || "";

  if (!id || !t) {
    return (
      <div className="container" style={{ marginTop: 40 }}>
        <h1 className="h1">Missing parameters</h1>
        <p className="subhead">This page requires a certificate ID and access token.</p>
      </div>
    );
  }

  const sub = dbGetSubmission(id);
  const artifacts = dbArtifactsForParent(id);

  if (!sub) {
    return (
      <div className="container" style={{ marginTop: 40 }}>
        <h1 className="h1">Not found</h1>
      </div>
    );
  }

  if (sub.access_token !== t) {
    return (
      <div className="container" style={{ marginTop: 40 }}>
        <h1 className="h1">Access denied</h1>
      </div>
    );
  }

  const privateUrl = `${config.appBaseUrl}/success?id=${encodeURIComponent(sub.id)}&t=${encodeURIComponent(t)}`;

  return (
    <SuccessView
      sub={sub}
      artifacts={artifacts}
      t={t}
      privateUrl={privateUrl}
    />
  );
}
