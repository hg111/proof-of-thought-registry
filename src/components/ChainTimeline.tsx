
"use client";

import { useState } from "react";
import Button from "./Button";

const CANONICAL_UNITS = [
    "THOUGHT", "IDEA", "CONCEPT", "PAGE", "BLOCK", "ITEM", "ARTIFACT",
    "CHAPTER", "SCENE", "DRAFT", "VERSION", "MODULE", "MODEL", "DESIGN",
    "PROOF", "EXPERIMENT", "HYPOTHESIS", "CLAIM", "RECORD", "ENTRY", "NOTE",
    "BUILD", "RELEASE", "FRAME", "SEGMENT", "UNIT", "SHOT", "CLIP"
];

type GenesisProp = {
    id: string;
    issuedAt: string;
    hash: string;
    label: string;
};

type ArtifactProp = {
    id: string;
    issuedAt: string;
    filename: string;
    note: string | null;
    hash: string;
    chainHash: string;
};

export default function ChainTimeline({
    genesis,
    artifacts,
    accessKey,
    initialUnitLabel = "PAGE"
}: {
    genesis: GenesisProp;
    artifacts: ArtifactProp[];
    accessKey: string;
    initialUnitLabel?: string;
}) {
    const isLocked = false; // Always unlocked per user request
    const [unitLabel, setUnitLabel] = useState(initialUnitLabel);
    const [hoveringLabel, setHoveringLabel] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Custom edit modes: "CHAIN" (entire) or "GENESIS" (only genesis override)
    const [editMode, setEditMode] = useState<"CHAIN" | "GENESIS" | null>(null);
    const [customInput, setCustomInput] = useState("");

    // Split logic: "GENESIS:CHAIN" or just "CHAIN"
    const parts = unitLabel.includes(":") ? unitLabel.split(":") : [unitLabel, unitLabel];
    const genesisLabel = parts[0];
    const chainLabel = parts.length > 1 ? parts[1] : parts[0];

    // Handler for unit change
    const handleUnitSelect = async (newLabel: string) => {
        // Dropdown actions
        if (newLabel === "Input Entire Chain Label...") {
            setEditMode("CHAIN");
            setCustomInput(chainLabel); // Pre-fill with current chain label
            setShowDropdown(false);
            return;
        }
        if (newLabel === "Input Genesis Label Only...") {
            setEditMode("GENESIS");
            setCustomInput(genesisLabel); // Pre-fill with current genesis label
            setShowDropdown(false);
            return;
        }

        // Processing a standard selection or finished input
        let finalLabel = newLabel.trim().toUpperCase();
        if (!finalLabel) {
            setEditMode(null);
            return;
        }

        // Logic based on what we are editing
        let storageString = finalLabel;

        if (editMode === "GENESIS") {
            // We are overriding Genesis. Keep existing Chain label.
            // Result: "NEW_GENESIS:CURRENT_CHAIN"
            storageString = `${finalLabel}:${chainLabel}`;
        } else if (editMode === "CHAIN") {
            // We are changing the chain label.
            // If we previously had a split, do we keep it? 
            // User said "Input Entire Chain Label", implies "Reset to this word".
            // So we treat it as a master reset for consistency. Simple.
            storageString = finalLabel;
        } else {
            // Standard dropdown click (not custom input)
            // We treat standard clicks as "Set Entire Chain" for simplicity,
            // unless we want to support "Genesis Only" clicks?
            // User asked for "Input" boxes specifically.
            // Standard clicks will reset the whole chain to that word.
            storageString = finalLabel;
        }

        setUnitLabel(storageString); // Optimistic update
        setEditMode(null);
        setShowDropdown(false);

        try {
            await fetch("/api/unit-label", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: genesis.id, accessKey, label: storageString })
            });
        } catch (e) {
            console.error("Failed to update label", e);
        }
    };

    // Auto-save on blur or enter
    const finishCustomEditing = () => {
        handleUnitSelect(customInput);
    };

    // We render a vertical line with nodes.
    // CSS Grid to control layout?

    // Structure:
    // [ TIME ]  ( O )  [ CARD ]

    // Helper to format as UTC like "2026.01.10 • 17:43:37 UTC" consistent with PDF
    const fmtUtc = (iso: string) => {
        if (!iso) return "Pending";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;

        const pad = (n: number) => n.toString().padStart(2, '0');
        const yyyy = d.getUTCFullYear();
        const MM = pad(d.getUTCMonth() + 1);
        const dd = pad(d.getUTCDate());
        const HH = pad(d.getUTCHours());
        const mm = pad(d.getUTCMinutes());
        const ss = pad(d.getUTCSeconds());

        // Format: YYYY.MM.DD • HH:mm:ss UTC
        return `${yyyy}.${MM}.${dd} • ${HH}:${mm}:${ss} UTC`;
    };

    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    return (
        <div className="chain-timeline" style={{ position: "relative", paddingLeft: "10px", marginTop: 40, marginBottom: 40 }}>
            {/* The Vertical Line (Faded Gray - Existing) */}
            <div style={{
                position: "absolute",
                left: "29px",
                top: 8,
                bottom: 20,
                width: "2px",
                backgroundColor: "#E0E7FF",
                zIndex: 0
            }}></div>

            {/* BLUE Connector Line (Overlay) */}
            <div style={{
                position: "absolute",
                left: "15px", // Center: 10px padding + 5px radius (Genesis) = 15px.
                top: 11, // Match center of Genesis dot (6px padding + 5px radius)
                bottom: 60,
                width: "1px",
                backgroundColor: "#0000FF",
                zIndex: 0
            }}></div>

            {/* Genesis Node */}
            <div
                style={{ display: "flex", gap: 24, marginBottom: 40, position: "relative", zIndex: showDropdown ? 50 : 1 }}
                onMouseEnter={() => setHoveredNode(genesis.id)}
                onMouseLeave={() => setHoveredNode(null)}
            >
                {/* Node */}
                <div style={{ paddingTop: 6, position: "relative" }}>
                    <div style={{
                        width: 10, height: 10, borderRadius: "50%", background: "#0000FF", position: "relative", zIndex: 2
                    }}></div>
                    {/* Active Halo */}
                    {hoveredNode === genesis.id && (
                        <div style={{
                            position: "absolute",
                            // Halo (16px). Radius 8. Center 11,5
                            // Top: 11 - 8 = 3. Left: 5 - 8 = -3.
                            top: 3, left: -3,
                            width: 16, height: 16, borderRadius: "50%",
                            border: "1px solid #0000FF",
                            zIndex: 1
                        }}></div>
                    )}
                </div>

                {/* Card */}
                <div style={{ flex: 1 }}>
                    <p className="small" style={{ color: "#666", marginBottom: 4 }}>
                        {fmtUtc(genesis.issuedAt)}
                    </p>
                    <div style={{ border: "1px solid #000", padding: "16px", background: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                            <span style={{ fontWeight: "bold", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>GENESIS RECORD</span>

                            {/* Unit Label Selector */}
                            <div
                                style={{ position: "relative" }}
                                onMouseEnter={() => !isLocked && setHoveringLabel(true)}
                                onMouseLeave={() => !isLocked && setHoveringLabel(false)}
                            >
                                {editMode ? (
                                    <input
                                        autoFocus
                                        value={customInput}
                                        onChange={(e) => setCustomInput(e.target.value.toUpperCase())}
                                        onBlur={finishCustomEditing}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") finishCustomEditing();
                                            if (e.key === "Escape") setEditMode(null);
                                        }}
                                        maxLength={24}
                                        placeholder={editMode === "GENESIS" ? "GENESIS LABEL" : "CHAIN LABEL"}
                                        style={{
                                            fontFamily: "monospace",
                                            fontSize: 12,
                                            width: 120,
                                            border: "1px solid #0000FF",
                                            padding: "2px 4px",
                                            outline: "none",
                                            textTransform: "uppercase"
                                        }}
                                    />
                                ) : (
                                    <span
                                        className="small-mono"
                                        style={{
                                            color: isLocked ? "#888" : (hoveringLabel ? "#0000FF" : "#888"),
                                            cursor: isLocked ? "default" : "pointer",
                                            textDecoration: !isLocked && hoveringLabel ? "underline" : "none",
                                            transition: "color 0.2s"
                                        }}
                                        onClick={() => !isLocked && setShowDropdown(!showDropdown)}
                                        title={"Rename how your chain is structured."}
                                    >
                                        {genesisLabel} 1
                                    </span>
                                )}

                                {/* Dropdown */}
                                {showDropdown && !isLocked && !editMode && (
                                    <div style={{
                                        position: "absolute",
                                        top: "100%", right: 0,
                                        background: "white",
                                        border: "1px solid #ccc",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                        zIndex: 100,
                                        maxHeight: 300,
                                        overflowY: "auto",
                                        width: 180,
                                        borderRadius: 4,
                                        marginTop: 4
                                    }}>
                                        {CANONICAL_UNITS.map(u => (
                                            <div
                                                key={u}
                                                style={{
                                                    padding: "8px 12px",
                                                    fontSize: 12,
                                                    cursor: "pointer",
                                                    fontFamily: "monospace",
                                                    background: unitLabel === u ? "#f0f0ff" : "white",
                                                    color: unitLabel === u ? "#0000FF" : "#333"
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = unitLabel === u ? "#f0f0ff" : "white"}
                                                onClick={() => handleUnitSelect(u)}
                                            >
                                                {u}
                                            </div>
                                        ))}
                                        <div style={{ height: 1, background: "#eee", margin: "4px 0" }}></div>
                                        <div
                                            style={{ padding: "8px 12px", fontSize: 11, cursor: "pointer", color: "#0000FF", fontWeight: 600 }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                                            onClick={() => handleUnitSelect("Input Entire Chain Label...")}
                                        >
                                            Input Entire Chain Label...
                                        </div>
                                        <div
                                            style={{ padding: "8px 12px", fontSize: 11, cursor: "pointer", color: "#0000FF", fontWeight: 600 }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                                            onClick={() => handleUnitSelect("Input Genesis Label Only...")}
                                        >
                                            Input Genesis Label Only...
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <h3 className="h3" style={{ fontSize: 18, marginBottom: 12 }}>{genesis.label}</h3>

                        <div style={{ background: "#f5f5f5", padding: "8px 12px", fontSize: 11, fontFamily: "monospace", overflowX: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", border: "1px solid #eee" }}>
                            NONCE: {genesis.hash}
                        </div>
                    </div>
                </div>
            </div>

            {/* Artifacts */}
            {artifacts.map((a, idx) => (
                <div
                    key={a.id}
                    style={{ display: "flex", gap: 24, marginBottom: 40, position: "relative", zIndex: 1 }}
                    onMouseEnter={() => setHoveredNode(a.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                >
                    {/* Node */}
                    <div style={{ paddingTop: 6, position: "relative" }}>
                        <div style={{
                            width: 8, height: 8, borderRadius: "50%", background: "#0000FF",
                            marginLeft: 1, // Center relative to 10px genesis
                            position: "relative", zIndex: 2
                        }}></div>
                        {/* Active Halo */}
                        {hoveredNode === a.id && (
                            <div style={{
                                position: "absolute",
                                // Dot Center: Top 10. Left 5.
                                // Halo (14px). Radius 7.
                                // Top: 10 - 7 = 3.
                                // Left: 5 - 7 = -2.
                                top: 3, left: -2,
                                width: 14, height: 14, borderRadius: "50%",
                                border: "1px solid #0000FF",
                                zIndex: 1
                            }}></div>
                        )}
                    </div>

                    {/* Card */}
                    <div style={{ flex: 1 }}>
                        <p className="small" style={{ color: "#666", marginBottom: 4 }}>
                            {fmtUtc(a.issuedAt)}
                        </p>

                        <div style={{ border: "1px solid #e0e0e0", padding: "16px", background: "#fff", transition: "all 0.2s" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                                <span style={{ fontWeight: "bold", fontSize: 13, textTransform: "uppercase", color: "#444" }}>SEALED ATTACHMENT</span>
                                <span className="small-mono" style={{ color: "#888" }}>{chainLabel} {idx + 2}</span>
                            </div>

                            <h4 style={{ fontSize: 16, marginBottom: 8, fontWeight: 500 }}>{a.filename}</h4>

                            {a.note && (
                                <p style={{ fontSize: 14, fontStyle: "italic", color: "#555", marginBottom: 12, borderLeft: "2px solid #eee", paddingLeft: 8 }}>
                                    “{a.note}”
                                </p>
                            )}

                            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                                <Button size="small" variant="secondary" href={`/vault?id=${a.id}&t=${accessKey}`}>
                                    Preview Original
                                </Button>
                                <Button size="small" variant="secondary" href={`/api/view/${a.id}?t=${accessKey}`}>
                                    Preview & Download Sealed Receipt (PDF)
                                </Button>
                                <span style={{ fontSize: 12, alignSelf: "center", color: '#999', fontFamily: 'monospace' }}>
                                    {a.hash.substring(0, 8)}...
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Pending / Add Node */}
            <div style={{ display: "flex", gap: 24, position: "relative", zIndex: 1 }}>
                <div style={{ paddingTop: 6 }}>
                    <div style={{
                        width: 8, height: 8, borderRadius: "50%", border: "2px solid #ccc", background: "#fff",
                        marginLeft: 1, // Match artifact alignment
                        boxShadow: "0 0 0 4px #fff"
                    }}></div>
                </div>
                <div>
                    <p className="small" style={{ color: "#999", marginBottom: 4 }}>Next Block</p>
                    <div>
                        <Button href={`/success/add-artifact?id=${encodeURIComponent(genesis.id)}&t=${encodeURIComponent(accessKey)}`} variant="primary">
                            + Seal New {chainLabel.charAt(0) + chainLabel.slice(1).toLowerCase()}
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
}
