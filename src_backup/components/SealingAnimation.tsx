
"use client";

import { useEffect, useState } from "react";

const HEX_CHARS = "0123456789ABCDEF";

export default function SealingAnimation({ onComplete }: { onComplete: () => void }) {
    const [phase, setPhase] = useState<"hashing" | "locking" | "stamped">("hashing");
    const [hash, setHash] = useState("");

    // Phase 1: Hashing (Random Hex Stream)
    useEffect(() => {
        if (phase !== "hashing") return;

        const interval = setInterval(() => {
            // Generate random 64-char hex string
            let s = "";
            for (let i = 0; i < 64; i++) s += HEX_CHARS[Math.floor(Math.random() * 16)];
            // Split visually
            setHash(s.match(/.{1,8}/g)?.join(" ") || s);
        }, 50);

        const timer = setTimeout(() => {
            setPhase("locking");
        }, 1800);

        return () => { clearInterval(interval); clearTimeout(timer); };
    }, [phase]);

    // Phase 2: Locking (Transition to Lock Icon)
    useEffect(() => {
        if (phase !== "locking") return;
        const timer = setTimeout(() => {
            setPhase("stamped");
        }, 600);
        return () => clearTimeout(timer);
    }, [phase]);

    // Phase 3: Stamped (Hold then complete)
    useEffect(() => {
        if (phase !== "stamped") return;
        const timer = setTimeout(() => {
            onComplete();
        }, 800);
        return () => clearTimeout(timer);
    }, [phase]);

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(5px)",
            zIndex: 9999,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
            {phase === "hashing" && (
                <div style={{ fontFamily: "monospace", fontSize: 24, padding: 20, maxWidth: 600, textAlign: "center", wordBreak: "break-all" }}>
                    {hash}
                    <div style={{ fontSize: 14, marginTop: 20, color: "#666" }}>CRYPTOGRAPHIC HASHING IN PROGRESS...</div>
                </div>
            )}

            {phase === "locking" && (
                <div style={{ animation: "popIn 0.3s ease-out" }}>
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
            )}

            {phase === "stamped" && (
                <div style={{ position: "relative" }}>
                    <div style={{ opacity: 0.3 }}>
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <div style={{
                        position: "absolute", top: "20%", left: "-10%",
                        transform: "rotate(-15deg) scale(1.5)",
                        border: "4px solid #000",
                        padding: "4px 12px",
                        fontSize: 24, fontWeight: "900",
                        color: "#000",
                        background: "rgba(255,255,255,0.8)",
                        animation: "stampslam 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
                    }}>
                        ISSUED
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes popIn {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes stampslam {
                    0% { transform: rotate(-15deg) scale(3); opacity: 0; }
                    100% { transform: rotate(-15deg) scale(1.5); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
