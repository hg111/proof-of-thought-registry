"use client";

import React, { useState } from "react";
import Button from "./Button";

interface DownloadButtonProps {
    url: string;
    filename: string;
    label: React.ReactNode;
    tooltip?: React.ReactNode;
    mode?: "light" | "dark"; // Light = Button.tsx, Dark = traction-btn
    className?: string;
    style?: React.CSSProperties;
}

export default function DownloadButton({
    url,
    filename,
    label,
    tooltip,
    mode = "light",
    className,
    style,
}: DownloadButtonProps) {
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleDownload = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (downloading) return;

        setDownloading(true);
        setProgress(0);
        setError(null);

        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "blob";

        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = (event.loaded / event.total) * 100;
                setProgress(percent);
            } else {
                // Fake progress if unknown (better than static)
                setProgress((prev) => (prev < 90 ? prev + 10 : prev));
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                setProgress(100);
                const blob = xhr.response;
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = downloadUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(downloadUrl);
                document.body.removeChild(a);
                setDownloading(false);
            } else {
                setError("Error");
                setDownloading(false);
            }
        };

        xhr.onerror = () => {
            setError("Failed");
            setDownloading(false);
        };

        xhr.send();
    };

    // --- TRACTION DARK MODE ---
    if (mode === "dark") {
        const bgStyle: React.CSSProperties = downloading
            ? {
                background: `linear-gradient(90deg, rgba(255,255,255,0.2) ${progress}%, transparent ${progress}%)`,
                cursor: "wait",
            }
            : {};

        return (
            <button
                onClick={handleDownload}
                className={`traction-btn ${className || ""}`}
                style={{ ...style, ...bgStyle, position: "relative", overflow: "hidden" }}
                title={typeof tooltip === "string" ? tooltip : undefined}
            >
                {downloading ? (
                    <span>
                        {progress > 0 && progress < 100 ? `${Math.round(progress)}% ` : ""}
                        Downloading...
                    </span>
                ) : error ? (
                    <span style={{ color: '#ff6b6b' }}>Retry Download</span>
                ) : (
                    label
                )}
            </button>
        );
    }

    // --- LIGHT MODE (Legacy Button Component) ---
    const lightProgressStyle: React.CSSProperties = downloading
        ? {
            background: `linear-gradient(90deg, #e0f2fe ${progress}%, #fff ${progress}%)`,
            borderColor: "#bae6fd",
            color: "#0369a1",
            cursor: "wait",
        }
        : {};

    return (
        <Button
            onClick={handleDownload}
            tooltip={tooltip}
            style={{ ...style, ...lightProgressStyle }}
            // If error, force a red border style via style prop override
            variant={error ? undefined : "secondary"}
        >
            {downloading ? (
                <span>
                    {progress > 0 && progress < 100 ? `${Math.round(progress)}% ` : ""}
                    Downloading...
                </span>
            ) : error ? (
                <span style={{ color: 'red' }}>Retry</span>
            ) : (
                label
            )}
        </Button>
    );
}
