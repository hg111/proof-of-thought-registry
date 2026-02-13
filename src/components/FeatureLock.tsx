"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PricingTier, UPGRADE_PRICES, TIER_NAMES } from "@/lib/pricing";

interface FeatureLockProps {
    tierRequired: PricingTier;
    currentTier: PricingTier;
    featureName: string;
    description: string;
}

export default function FeatureLock({
    tierRequired,
    currentTier,
    featureName,
    description
}: FeatureLockProps) {
    const router = useRouter();
    const [showPopup, setShowPopup] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);

    const upgradePrice = useMemo(() => {
        if (tierRequired === PricingTier.MINTED) return UPGRADE_PRICES.TO_MINTED;
        if (tierRequired === PricingTier.ENGRAVED) return UPGRADE_PRICES.TO_ENGRAVED;
        return "$Unknown";
    }, [tierRequired]);

    const targetTierName = TIER_NAMES[tierRequired];

    useEffect(() => {
        // Stage 1: Popup logic (2.0s delay - Clear View)
        const timer1 = setTimeout(() => setShowPopup(true), 2000);

        // Stage 2: Ghosting logic (5.0s delay - Gradual Fade)
        const timer2 = setTimeout(() => setShowOverlay(true), 5000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // Background Transition: Gradual ghosting (5s)
            transition: "backdrop-filter 5s ease, background-color 5s ease",
            backdropFilter: showOverlay ? "blur(1px)" : "blur(0px)",
            backgroundColor: showOverlay ? "rgba(10, 25, 50, 0.05)" : "rgba(0,0,0,0)",
            pointerEvents: showPopup ? "auto" : "none",
        }}>
            <div style={{
                // Card Appearance Transition (2s to match BG feel)
                opacity: showPopup ? 1 : 0,
                transform: showPopup ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 2s ease, transform 2s ease",

                background: "rgba(10, 20, 40, 0.90)", // Card background
                border: "1px solid rgba(255, 255, 255, 0.3)", // Thin wireframe border
                padding: "32px",
                maxWidth: "400px",
                textAlign: "center",
                boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                borderRadius: "12px",
                color: "#fff"
            }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                <h3 style={{ margin: "0 0 12px 0", fontSize: 20, fontWeight: 700, color: "#fff" }}>
                    {featureName} is Locked
                </h3>
                <p style={{ margin: "0 0 24px 0", fontSize: 14, color: "#ccc", lineHeight: 1.5 }}>
                    {description}
                    <br /><br />
                    This feature is available in the <strong style={{ color: "#fff" }}>{targetTierName}</strong> tier.
                </p>

                {/* Primary Action: Start Over */}
                <div style={{ marginBottom: 32 }}>
                    <button
                        onClick={() => router.push('/start')}
                        style={{
                            background: "#fff",
                            color: "#000",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "6px",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            width: "100%",
                            marginBottom: "8px"
                        }}
                    >
                        Start Over
                    </button>
                    <div style={{ fontSize: 12, color: "#888" }}>
                        Start a new submission with a <strong style={{ color: "#aaa" }}>{targetTierName}</strong> record.
                    </div>
                </div>

                {/* Secondary Action: Upgrade */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: "#ccc" }}>
                        Need to upgrade this existing record?
                    </div>

                    <a
                        href={`mailto:team.proofofthought@gmail.com?subject=Upgrade%20Request%20for%20${featureName}`}
                        style={{
                            display: "inline-block",
                            background: "transparent",
                            color: "#fff",
                            padding: "8px 16px",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: 13,
                            border: "1px solid #555",
                            borderRadius: "4px",
                            marginBottom: "8px"
                        }}
                    >
                        Contact us to Upgrade ({upgradePrice})
                    </a>

                    <div style={{ fontSize: 12, color: "#666" }}>
                        Email team.proofofthought@gmail.com
                    </div>
                </div>
            </div>
        </div>
    );
}
