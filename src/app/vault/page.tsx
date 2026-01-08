// src/app/vault/page.tsx
export const dynamic = 'force-dynamic';

export default function VaultPage({
    searchParams,
}: {
    searchParams: { id?: string; t?: string };
}) {
    const id = searchParams?.id || "";
    const t = searchParams?.t || "";

    if (!id || !t) {
        return (
            <div style={{ padding: 20, fontFamily: "sans-serif" }}>
                <h1>Access Denied</h1>
                <p>Vault requires a valid certificate ID and access token.</p>
            </div>
        );
    }

    return (
        <div style={{ margin: 0, padding: 0, width: "100vw", height: "100vh", overflow: "hidden" }}>
            <iframe
                src={`/api/view/${encodeURIComponent(id)}?t=${encodeURIComponent(t)}#toolbar=0&navpanes=0&zoom=100`}
                style={{ width: "100%", height: "100%", border: "none" }}
                title={`Certificate ${id}`}
            />
        </div>
    );
}
