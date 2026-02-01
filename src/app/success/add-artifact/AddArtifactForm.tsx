"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import SealingAnimation from "@/components/SealingAnimation";

export default function AddArtifactForm({
    parentId,
    t,
}: {
    parentId: string;
    t: string;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [sealing, setSealing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setFile(f);
        setError(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!file) return;

        setSealing(true);
    };

    const handleAnimationComplete = async () => {
        if (!file) return;

        try {
            // Get caption
            const formData = new FormData(formRef.current!);
            const caption = formData.get("thoughtCaption") as string;

            // STREAMING UPLOAD (RAW BINARY)
            // This prevents Next.js/Node from buffering the whole file in memory
            const headers: Record<string, string> = {
                "x-upload-mode": "raw",
                "x-parent-id": parentId,
                "x-token": t,
                "x-filename": file.name,
                "x-mimetype": file.type || "application/octet-stream",
                "x-size": String(file.size),
            };

            if (caption) {
                headers["x-caption"] = encodeURIComponent(caption);
            }

            const res = await fetch("/api/artifacts", {
                method: "POST",
                headers,
                body: file, // Browser streams this automatically
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            const data = await res.json();
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                router.refresh();
            }

        } catch (e: any) {
            console.error("Upload error:", e);
            setError(e.message || "Failed to seal artifact.");
            setSealing(false);
        }
    };

    return (
        <>
            {sealing && <SealingAnimation onComplete={handleAnimationComplete} />}

            {error && (
                <div style={{ padding: 12, background: "#fee2e2", color: "#991b1b", marginBottom: 16, fontSize: 13 }}>
                    Error: {error}
                </div>
            )}

            <form
                ref={formRef}
                onSubmit={!sealing ? handleSubmit : undefined}
            >
                {/* File Input */}
                <label className="small">Select File (Any Format)</label>
                <input
                    style={{ display: "block", marginTop: 8, marginBottom: 16 }}
                    type="file"
                    name="file"
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
                        <p className="small" style={{ marginBottom: 8 }}>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>

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
                    disabled={sealing || !file}
                    style={{
                        display: "inline-block",
                        background: "#000",
                        color: "#fff",
                        padding: "10px 14px",
                        borderRadius: 0,
                        border: "1px solid #000",
                        fontSize: 14,
                        cursor: "pointer",
                        opacity: file && !sealing ? 1 : 0.5,
                        pointerEvents: file && !sealing ? 'auto' : 'none'
                    }}
                >
                    {sealing ? "Sealing..." : "Seal Page"}
                </button>
            </form>
        </>
    );
}
