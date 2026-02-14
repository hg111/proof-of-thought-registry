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

    return (
        <Button
            onClick={handleDownload}
            tooltip={tooltip}
            mode={mode} // Pass mode to Button for standard dark/light styling
            style={{
                ...style,
                ...((mode === 'dark' && downloading) ? {
                    background: `linear-gradient(90deg, rgba(255,255,255,0.2) ${progress}%, #1e293b ${progress}%)`,
                    cursor: "wait",
                } : (mode === 'light' && downloading) ? lightProgressStyle : {}),
                position: "relative",
                overflow: "hidden"
            }}
            variant={error ? undefined : "secondary"} // Secondary variant triggers button's default styles which we want, or handle custom?
        // Actually, Button's logic for secondary in dark mode might need check. 
        // In Button.tsx, standard variant=secondary uses light gray bg in light mode.
        // In dark mode, our new default darkStyle applies regardless of variant unless overridden.
        // So simply passing mode="dark" should give us the Slate 800 background.
        >
            {downloading ? (
                <span>
                    {progress > 0 && progress < 100 ? `${Math.round(progress)}% ` : ""}
                    Downloading...
                </span>
            ) : error ? (
                <span style={{ color: mode === 'dark' ? '#ff6b6b' : 'red' }}>Retry</span>
            ) : (
                label
            )}
        </Button>
    );
}
