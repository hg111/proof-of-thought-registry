"use client";

import { useState, useRef } from "react";

import Button from "./Button";

export default function CopyPrivateControlLink({ url, style, mode }: { url?: string; style?: React.CSSProperties; mode?: "light" | "dark" }) {
    const [copied, setCopied] = useState(false);

    if (!url) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            onClick={handleCopy}
            mode={mode}
            style={style}
            tooltip={
                <>
                    <strong>This is your private control key for this Thought chain.</strong><br />
                    Anyone with this key can view, extend, or prove custody of this idea.<br />
                    <span style={{ color: mode === 'dark' ? '#ff6b6b' : "#d32f2f" }}>Store it securely.</span>
                </>
            }
        >
            {copied ? "Copied" : "Copy Private Access Key"}
        </Button>
    );
}
