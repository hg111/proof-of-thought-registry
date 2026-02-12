"use client";

import { useMemo } from "react";
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

    const upgradePrice = useMemo(() => {
        if (tierRequired === PricingTier.MINTED) return UPGRADE_PRICES.TO_MINTED;
        if (tierRequired === PricingTier.ENGRAVED) return UPGRADE_PRICES.TO_ENGRAVED;
        return "$Unknown";
    }, [tierRequired]);

    const targetTierName = TIER_NAMES[tierRequired];

    return (
        <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            background: "rgba(255, 255, 255, 0.2)",
        }}>
            <div style={{
                background: "rgba(255, 255, 255, 0.8)", // Transparency 20%
                border: "1px solid rgba(0,0,0,0.1)",
                padding: "32px",
                maxWidth: "400px",
                textAlign: "center",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                borderRadius: "12px"
            }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                <h3 style={{ margin: "0 0 12px 0", fontSize: 20, fontWeight: 700 }}>
                    {featureName} is Locked
                </h3>
                <p style={{ margin: "0 0 24px 0", fontSize: 14, color: "#555", lineHeight: 1.5 }}>
                    {description}
                    <br /><br />
                    This feature is available in the <strong>{targetTierName}</strong> tier.
                </p>

                {/* Primary Action: Start Over */}
                <div style={{ marginBottom: 32 }}>
                    <button
                        onClick={() => router.push('/start')}
                        style={{
                            background: "#000",
                            color: "#fff",
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
                    <div style={{ fontSize: 12, color: "#666" }}>
                        Start a new submission with a <strong>{targetTierName}</strong> record.
                    </div>
                </div>

                {/* Secondary Action: Upgrade */}
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                        Need to upgrade this existing record?
                    </div>

                    <a
                        href={`mailto:team.proofofthought@gmail.com?subject=Upgrade%20Request%20for%20${featureName}`}
                        style={{
                            display: "inline-block",
                            background: "transparent",
                            color: "#333",
                            padding: "8px 16px",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: 13,
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            marginBottom: "8px"
                        }}
                    >
                        Contact us to Upgrade ({upgradePrice})
                    </a>

                    <div style={{ fontSize: 12, color: "#888" }}>
                        Email team.proofofthought@gmail.com
                    </div>
                </div>
            </div>
        </div>
    );
}
