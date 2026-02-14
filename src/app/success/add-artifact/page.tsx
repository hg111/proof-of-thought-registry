import Button from "@/components/Button";
import Divider from "@/components/Divider";
import AddArtifactForm from "./AddArtifactForm";

export const dynamic = "force-dynamic";

export default function AddArtifactPage({
  searchParams,
}: {
  searchParams: { id?: string; t?: string; theme?: string };
}) {
  const id = searchParams?.id || "";
  const t = searchParams?.t || "";
  const theme = searchParams?.theme === 'dark' ? 'dark' : 'light';

  if (!id || !t) {
    return (
      <>
        <h1 className="h1">Missing parameters</h1>
        <p className="subhead">This page requires a certificate ID and access token.</p>
      </>
    );
  }

  const isDark = theme === 'dark';
  const pageStyle = isDark ? {
    color: '#e2e8f0',
    background: 'transparent' // Main background handled by globals or wrapper if present, but here we can force text color
  } : {};

  return (
    <div style={pageStyle}>
      <div className="kicker" style={{ color: isDark ? '#94a3b8' : undefined }}>Ledger</div>
      <h1 className="h1" style={{ color: isDark ? '#f8fafc' : undefined }}>Add a sealed page</h1>
      <p className="subhead" style={{ color: isDark ? '#cbd5e1' : undefined }}>
        Upload a sketch or photo. It will be sealed, timestamped, and permanently attached to your original proof.
      </p>

      <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.1)' : '#eee', margin: '24px 0' }}></div>

      <AddArtifactForm parentId={id} t={t} theme={theme === 'dark' ? 'dark' : 'light'} />

      <p className="small" style={{ marginTop: 14 }}>
        <a href={`/success?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`} style={{ color: isDark ? '#60a5fa' : undefined }}>← Back to certificate</a>
      </p>
    </div>
  );
}
