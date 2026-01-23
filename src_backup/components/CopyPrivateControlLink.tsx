"use client";

import { useState, useRef } from "react";

export default function CopyPrivateControlLink({ url }: { url?: string }) {
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);

    // Logic for mobile long-press
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPress = useRef(false);

    if (!url) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleMouseEnter = () => {
        if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
            setHovered(true);
        }
    };
    const handleMouseLeave = () => {
        setHovered(false);
        setActive(false);
    };
    const handleMouseDown = () => setActive(true);
    const handleMouseUp = () => setActive(false);

    // Touch handlers (Mobile)
    const handleTouchStart = () => {
        setActive(true);
        isLongPress.current = false;
        timerRef.current = setTimeout(() => {
            isLongPress.current = true;
            setHovered(true); // Show tooltip
        }, 1000); // 1.0s long press
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        setActive(false);
        setHovered(false); // Hide tooltip on release

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (isLongPress.current) {
            e.preventDefault(); // Prevent click action
        }
    };

    const buttonStyle: React.CSSProperties = {
        border: hovered ? "1px solid #0000FF" : "1px solid #bbb",
        padding: "0 12px",
        height: "36px",
        borderRadius: 4,
        background: active ? "#f2f2f2" : "#fff",
        color: "#000",
        textDecoration: "none",
        fontSize: 13,
        cursor: "pointer",
        userSelect: "none",
        boxShadow: "-2px 3px 5px rgba(0,0,0,0.1)",
        transition: "all 0.1s ease",
        verticalAlign: "middle",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
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
        <div style={{ position: "relative", display: "inline-block" }}>
            <button
                onClick={handleCopy}
                type="button"
                style={buttonStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
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
