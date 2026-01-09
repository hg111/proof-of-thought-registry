"use client";

import { useState } from "react";

export default function AddArtifactForm({
    parentId,
    t,
}: {
    parentId: string;
    t: string;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setFile(f);

        if (f) {
            if (f.type.startsWith("image/")) {
                const url = URL.createObjectURL(f);
                setPreview(url);
            } else {
                setPreview(null);
            }
        } else {
            setPreview(null);
        }
    };

    return (
        <form action="/api/artifacts" method="post" encType="multipart/form-data">
            <input type="hidden" name="parentId" value={parentId} />
            <input type="hidden" name="t" value={t} />

            <label className="small">Select File (Any Format)</label>
            <input
                style={{ display: "block", marginTop: 8, marginBottom: 16 }}
                type="file"
                name="file"
                // accept="*/*" // Default is all
                required
                onChange={handleFileChange}
            />

            {file && (
                <div style={{
                    marginBottom: 20,
                    padding: 16,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb"
                }}>
                    <p className="small" style={{ fontWeight: 600, marginBottom: 4 }}>Selected Evidence:</p>
                    <p className="small" style={{ marginBottom: 4 }}>Name: {file.name}</p>
                    <p className="small" style={{ marginBottom: 4 }}>Type: {file.type || "Unknown/Binary"}</p>
                    <p className="small" style={{ marginBottom: 8 }}>Size: {(file.size / 1024).toFixed(1)} KB</p>

                    {preview && (
                        <div style={{ marginTop: 10 }}>
                            <img
                                src={preview}
                                alt="Preview"
                                style={{ maxWidth: "100%", maxHeight: 200, border: "1px solid #ddd" }}
                            />
                        </div>
                    )}

                    {!preview && (
                        <div style={{ marginTop: 10, fontStyle: 'italic', fontSize: 12, color: '#666' }}>
                            Binary/Document file will be sealed securely.
                        </div>
                    )}
                </div>
            )}

            <label className="small">Caption / Note (optional)</label>
            <textarea
                name="thoughtCaption"
                placeholder="One sentence: why this sealed page exists…"
                rows={2}
                maxLength={240}
                style={{
                    display: "block",
                    width: "100%",
                    marginTop: 8,
                    marginBottom: 16,
                    padding: "10px 12px",
                    border: "1px solid #000",
                    borderRadius: 0,
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                }}
            />

            <button
                type="submit"
                style={{
                    display: "inline-block",
                    background: "#000",
                    color: "#fff",
                    padding: "10px 14px",
                    borderRadius: 0,
                    border: "1px solid #000",
                    fontSize: 14,
                    cursor: "pointer",
                    opacity: file ? 1 : 0.5,
                    pointerEvents: file ? 'auto' : 'none'
                }}
            >
                Seal Page
            </button>
        </form>
    );
}
