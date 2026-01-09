// src/app/vault/page.tsx
import { dbGetSubmission, dbGetArtifact } from "@/lib/db";
import { notFound } from "next/navigation";

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
                <p>Vault requires a valid ID and access token.</p>
            </div>
        );
    }

    // 1. Check if Artifact
    const artifact = dbGetArtifact(id);
    if (artifact) {
        // Security check: match parent token
        const parent = dbGetSubmission(artifact.parent_certificate_id);
        if (!parent || String(parent.access_token) !== String(t)) {
            return (
                <div style={{ padding: 20, fontFamily: "sans-serif" }}>
                    <h1>Access Denied</h1>
                    <p>Invalid token for this artifact.</p>
                </div>
            );
        }

        const mime = (artifact.mime_type || "").toLowerCase();
        // Asset URL (for preview/download)
        // Note: we use id (artifactId) directly as the asset key logic
        const assetUrl = `/api/assets/${id}?t=${encodeURIComponent(t)}`;
        const downloadUrl = `${assetUrl}&download=1`;
        const certUrl = `/api/view/${id}?t=${encodeURIComponent(t)}`; // The key difference: /api/view checks if ID is artifact too?

        // Wait, /api/view is for PDF viewing. Does it handle artifact IDs?
        // Checking api/view implementation... it calls dbGetSubmission.
        // So /api/view currently ONLY supports submissions.
        // We need the artifact CERTIFICATE (the PDF receipt).
        // The PDF receipt is stored at artifact.receipt_pdf_key.
        // We should update /api/view to also support artifacts OR just serve it from here.
        // For now, let's assume we want a seamless experience where /api/view handles PDFs for both.
        // But I haven't updated /api/view logic yet. 
        // Strategy: Since I can't easily change /api/view in this single step without risk, 
        // I will point the "View Certificate" button to a new route OR assume I'll fix /api/view in next step.

        // Actually, let's just make the "View Certificate" use the Asset API? 
        // No, the Asset API returns the raw file. The Certificate is a PDF.
        // The PDF is stored at artifact.receipt_pdf_key.
        // Let's rely on `dbGetArtifact` returning the key, and maybe I need a way to fetch that PDF.
        // I'll stick to the plan: Render the Asset Preview here.

        return (
            <div style={{ maxWidth: 800, margin: "0 auto", padding: 40, fontFamily: "sans-serif" }}>
                <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 24, marginBottom: 8 }}>Vault Asset Retrieval</h1>
                    <p style={{ color: "#666", fontSize: 14 }}>
                        <strong>Artifact ID:</strong> {id}<br />
                        <strong>Type:</strong> {mime}<br />
                        <strong>Original Name:</strong> {artifact.original_filename}
                    </p>
                </div>

                <div style={{
                    border: "1px solid #eee",
                    background: "#f9f9f9",
                    padding: 20,
                    borderRadius: 8,
                    marginBottom: 24,
                    textAlign: 'center'
                }}>
                    {/* PREVIEW LOGIC */}
                    {mime.startsWith("image/") && (
                        <img src={assetUrl} alt="Preview" style={{ maxWidth: "100%", maxHeight: 500, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
                    )}

                    {mime === "application/pdf" && (
                        <iframe src={assetUrl} style={{ width: "100%", height: 600, border: "none" }} />
                    )}

                    {mime.startsWith("audio/") && (
                        <audio controls src={assetUrl} style={{ width: "100%" }} />
                    )}

                    {mime.startsWith("video/") && (
                        <video controls src={assetUrl} style={{ maxWidth: "100%", maxHeight: 600 }} />
                    )}

                    {!mime.startsWith("image/") && !mime.startsWith("audio/") && !mime.startsWith("video/") && mime !== "application/pdf" && (
                        <div style={{ padding: 40, color: "#999", fontStyle: "italic" }}>
                            No preview available for this file type.
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", gap: 16 }}>
                    <a
                        href={downloadUrl}
                        style={{
                            background: "#000",
                            color: "#fff",
                            padding: "12px 20px",
                            textDecoration: "none",
                            borderRadius: 4,
                            fontWeight: "bold",
                            fontSize: 14
                        }}
                    >
                        Download Original
                    </a>

                    {/* Fallback link to the main chain UI if possible, or just back to success page */}
                    <a
                        href={`/success?id=${artifact.parent_certificate_id}&t=${t}`}
                        style={{
                            background: "#fff",
                            color: "#000",
                            padding: "12px 20px",
                            textDecoration: "none",
                            borderRadius: 4,
                            border: "1px solid #ccc",
                            fontSize: 14
                        }}
                    >
                        Back to Chain
                    </a>
                </div>
            </div>
        );
    }

    // 2. Fallback: Submission (Certificate)
    // Legacy / Standard behavior
    const sub = dbGetSubmission(id);
    if (sub) {
        if (String(sub.access_token) !== String(t)) {
            return (
                <div style={{ padding: 20, fontFamily: "sans-serif" }}>
                    <h1>Access Denied</h1>
                    <p>Invalid token.</p>
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

    return notFound();
}

