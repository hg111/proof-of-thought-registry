"use client";

import { useState } from "react";

export default function CopyPrivateControlLink({ url }: { url?: string }) {
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);

    if (!url) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const buttonStyle: React.CSSProperties = {
        border: "1px solid #bbb",
        padding: "8px 12px",
        borderRadius: 4,
        background: "#fff",
        color: "#000",
        textDecoration: "none",
        fontSize: 13,
        cursor: "pointer",
        userSelect: "none",
        boxShadow: "-2px 3px 5px rgba(0,0,0,0.1)",
        transition: "all 0.1s ease",
        marginRight: 10,
        marginBottom: 10,
    };

    const tooltipStyle: React.CSSProperties = {
        position: "absolute",
        top: "100%",
        right: 0,
        marginTop: 8,
        width: 300,
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        padding: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        fontSize: "0.85rem",
        lineHeight: "1.4",
        zIndex: 100,
        color: "#333",
        textAlign: "left",
        borderRadius: 4,
        whiteSpace: "normal",
    };

    return (
        <div
            style={{ position: "relative", display: "inline-block" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <button onClick={handleCopy} type="button" style={buttonStyle}>
                {copied ? "Copied" : "Copy Private Access Key"}
            </button>

            {hovered && (
                <div style={tooltipStyle}>
                    <strong>This is your private control key for this Thought chain.</strong><br />
                    Anyone with this key can view, extend, or prove custody of this idea.<br />
                    <span style={{ color: "#d32f2f" }}>Store it securely.</span>
                </div>
            )}
        </div>
    );
}
