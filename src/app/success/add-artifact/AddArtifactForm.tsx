"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import SealingAnimation from "@/components/SealingAnimation";

export default function AddArtifactForm({
    parentId,
    t,
    theme = "light"
}: {
    parentId: string;
    t: string;
    theme?: "light" | "dark";
}) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [sealing, setSealing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Upload State
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

    const formRef = useRef<HTMLFormElement>(null);
    const router = useRouter();

    const isDark = theme === "dark";

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

        // Start Sealing Visuals
        setSealing(true);
        setUploadProgress(0);
        setUploadComplete(false);

        // Start Actual Upload
        performUpload(file);
    };

    const performUpload = (fileToUpload: File) => {
        const formData = new FormData(formRef.current!);
        const caption = formData.get("thoughtCaption") as string;

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/artifacts", true);

        // Headers for Streaming / Raw Upload
        xhr.setRequestHeader("x-upload-mode", "raw");
        xhr.setRequestHeader("x-parent-id", parentId);
        xhr.setRequestHeader("x-token", t);
        xhr.setRequestHeader("x-filename", fileToUpload.name);
        xhr.setRequestHeader("x-mimetype", fileToUpload.type || "application/octet-stream");
        xhr.setRequestHeader("x-size", String(fileToUpload.size));

        if (caption) {
            xhr.setRequestHeader("x-caption", encodeURIComponent(caption));
        }

        // Progress Handler
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = (event.loaded / event.total) * 100;
                setUploadProgress(percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.response);
                    setUploadComplete(true);
                    setUploadProgress(100);
                    if (data.redirect) {
                        setRedirectUrl(data.redirect);
                    } else {
                        // Fallback refresh
                        setRedirectUrl(null); // Will just refresh
                    }
                } catch (e) {
                    setError("Invalid response from server");
                    setSealing(false);
                }
            } else {
                try {
                    const data = JSON.parse(xhr.response);
                    setError(data.error || "Upload failed");
                } catch {
                    setError(`Upload failed: ${xhr.status}`);
                }
                setSealing(false);
            }
        };

        xhr.onerror = () => {
            setError("Network Error during upload");
            setSealing(false);
        };

        xhr.send(fileToUpload);
    };

    const handleAnimationComplete = () => {
        // Called when Sealing Animation finishes nicely (Stamped)
        // At this point, uploadComplete must be true (guaranteed by SealingAnimation logic)

        if (redirectUrl) {
            // Keep theme if we redirect back to success (though success page reads localStorage usually)
            window.location.href = redirectUrl;
        } else {
            router.refresh();
        }
    };

    return (
        <>
            {sealing && (
                <SealingAnimation
                    onComplete={handleAnimationComplete}
                    uploadProgress={uploadProgress}
                    uploadComplete={uploadComplete}
                    theme={theme}
                />
            )}

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
                <label className="small" style={{ color: isDark ? '#ccc' : undefined }}>Select File (Any Format)</label>
                <input
                    style={{
                        display: "block", marginTop: 8, marginBottom: 16,
                        color: isDark ? '#fff' : undefined
                    }}
                    type="file"
                    name="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.webp"
                    required
                    onChange={handleFileChange}
                />

                {file && (
                    <div style={{
                        marginBottom: 20,
                        padding: 16,
                        background: isDark ? "rgba(255,255,255,0.05)" : "#f9fafb",
                        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb"
                    }}>
                        <p className="small" style={{ fontWeight: 600, marginBottom: 4, color: isDark ? '#fff' : undefined }}>Selected Evidence:</p>
                        <p className="small" style={{ marginBottom: 4, color: isDark ? '#ccc' : undefined }}>Name: {file.name}</p>
                        <p className="small" style={{ marginBottom: 4, color: isDark ? '#ccc' : undefined }}>Type: {file.type || "Unknown/Binary"}</p>
                        <p className="small" style={{ marginBottom: 8, color: isDark ? '#ccc' : undefined }}>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>

                        {preview && (
                            <div style={{ marginTop: 10 }}>
                                <img
                                    src={preview}
                                    alt="Preview"
                                    style={{ maxWidth: "100%", maxHeight: 200, border: isDark ? "1px solid #444" : "1px solid #ddd" }}
                                />
                            </div>
                        )}

                        {!preview && (
                            <div style={{ marginTop: 10, fontStyle: 'italic', fontSize: 12, color: isDark ? '#888' : '#666' }}>
                                Binary/Document file will be sealed securely.
                            </div>
                        )}
                    </div>
                )}

                <label className="small" style={{ color: isDark ? '#ccc' : undefined }}>Caption / Note (optional)</label>
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
                        border: isDark ? "1px solid #444" : "1px solid #000",
                        background: isDark ? "rgba(0,0,0,0.2)" : "#fff",
                        color: isDark ? "#fff" : "#000",
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
                        background: isDark ? "#fff" : "#000",
                        color: isDark ? "#000" : "#fff",
                        padding: "10px 14px",
                        borderRadius: 0,
                        border: isDark ? "1px solid #fff" : "1px solid #000",
                        fontSize: 14,
                        cursor: "pointer",
                        opacity: file && !sealing ? 1 : 0.5,
                        pointerEvents: file && !sealing ? 'auto' : 'none',
                        transition: 'all 0.2s'
                    }}
                >
                    {sealing ? "Sealing..." : "Seal Page"}
                </button>
            </form>
        </>
    );
}
