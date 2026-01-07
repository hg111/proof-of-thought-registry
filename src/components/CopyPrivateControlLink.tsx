"use client";

import { useState } from "react";

export default function CopyPrivateControlLink({ url }: { url?: string }) {
    const [copied, setCopied] = useState(false);

    if (!url) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button onClick={handleCopy} type="button">
            {copied ? "Copied" : "Copy Link"}
        </button>
    );
}
