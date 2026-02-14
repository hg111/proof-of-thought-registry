'use client';

import React, { useState, useEffect } from 'react';
import Divider from "@/components/Divider";
import MonoBlock from "@/components/MonoBlock";
import Button from "@/components/Button";
import DownloadButton from "@/components/DownloadButton";
import dynamic from "next/dynamic";
import '@/app/traction/traction.css'; // Import traction styles
import '@/app/start/start.css'; // Import start styles for toggle button

// Dynamic imports to match original behavior
const CopyPrivateControlLink = dynamic(() => import("@/components/CopyPrivateControlLink"), { ssr: false });
const SealPoller = dynamic(() => import("@/components/SealPoller"), { ssr: false });
const ChainTimeline = dynamic(() => import("@/components/ChainTimeline"), { ssr: true });
const SuccessPageWrapper = dynamic(() => import("@/components/SuccessPageWrapper"), { ssr: false });
const SessionRecorder = dynamic(() => import("@/components/SessionRecorder"), { ssr: false });

interface SuccessViewProps {
    sub: any;
    artifacts: any[];
    t: string;
    privateUrl: string;
}

export default function SuccessView({ sub, artifacts, t, privateUrl }: SuccessViewProps) {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('pot-theme') as 'light' | 'dark';
        if (saved) {
            setTheme(saved);
        }
        setMounted(true);
    }, []);

    // Effect to update body background globally
    useEffect(() => {
        if (!mounted) return;
        if (theme === 'dark') {
            document.body.style.backgroundColor = '#050608'; // Traction Dark
        } else {
            document.body.style.backgroundColor = ''; // Reset to default
        }
    }, [theme, mounted]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('pot-theme', newTheme);
    };

    if (!mounted) return null; // Avoid hydration mismatch on theme

    // CSS Variables for Dark Mode Override (from traction.css)
    const darkThemeStyles = {
        '--bg': '#050608',       // Traction Background
        '--text': '#e9edf7',     // Traction Ink
        '--muted': '#a6b0c5',    // Traction Muted
        '--paper': '#111522',    // Traction Panel
        '--mist': '#050608',     // Match bg
        '--rule': '#24304a',     // Traction Line
        '--ink': '#e9edf7',      // Traction Ink
        '--accent': '#6aa6ff',   // Traction Accent
    } as React.CSSProperties;

    // Apply styles wrapper if dark
    const wrapperStyles = theme === 'dark' ? {
        ...darkThemeStyles,
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        position: 'relative' as const,
    } : {
        position: 'relative' as const,
        minHeight: '100vh',
    };

    // Button styles for dark mode to match traction-btn
    // REMOVED in favor of mode prop
    /* const btnDarkStyle = ... */

    return (
        <div style={wrapperStyles}>
            <SuccessPageWrapper theme={theme}>
                <SessionRecorder id={sub.id} />
                {/* Theme Toggle - Absolute Position to avoid layout shift */}
                <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
                    <button
                        onClick={toggleTheme}
                        className="start-toggle-btn"
                        style={{
                            // Overrides to ensure visibility
                            background: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'transparent',
                            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                            color: theme === 'dark' ? 'rgba(255,255,255,0.9)' : '#64748b',
                            fontSize: '12px',
                            padding: '6px 10px',
                            transition: 'all 0.2s ease',
                        }}
                        title="Toggle Day/Night Mode"
                    >
                        {theme === 'dark' ? '☀ Day' : '🌙 Night'}
                    </button>
                </div>

                <div className="kicker" style={{ color: theme === 'dark' ? 'var(--muted)' : undefined }}>Issued</div>
                <h1 className="h1" style={{ color: theme === 'dark' ? 'var(--text)' : undefined }}>Certificate available</h1>
                <p className="subhead" style={{ color: theme === 'dark' ? 'var(--muted)' : undefined }}>
                    If payment has completed, your certificate will be issued and preserved in custody. If you refreshed too quickly,
                    wait a moment and refresh.
                </p>

                <Divider />
                <MonoBlock label="Certificate ID" value={sub.id} mode={theme} />
                <MonoBlock label="Status" value={sub.status} mode={theme} />

                <Divider />

                <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
                    <Button
                        href={`/vault?id=${encodeURIComponent(sub.id)}&t=${encodeURIComponent(t)}`}
                        mode={theme}
                        tooltip={
                            <>
                                <strong>Privately view your sealed Thought under custodial lock</strong> —<br />
                                without downloading or exposing the record.
                            </>
                        }
                    >
                        Preview in Vault
                    </Button>

                    <DownloadButton
                        url={`/api/download/${encodeURIComponent(sub.id)}?t=${encodeURIComponent(t)}`}
                        filename={`Proof-of-Thought-${sub.id}.pdf`}
                        mode={theme}
                        label="Download PDF"
                        tooltip={
                            <>
                                <strong>This is your original Proof-of-Thought certificate.</strong><br />
                                It establishes when your idea was first sealed <br />under third-party cryptographic custody.
                            </>
                        }
                    />

                    {artifacts.length > 0 ? (
                        <DownloadButton
                            url={`/api/chain/${encodeURIComponent(sub.id)}/download?t=${encodeURIComponent(t)}`}
                            filename={`Proof-of-Thought-CHAIN-${sub.id}.pdf`}
                            mode={theme}
                            label="Download Chain PDF"
                            tooltip={
                                <>
                                    <strong>This is the full cryptographic lineage of your Thought</strong> —<br />
                                    showing how your idea evolved over time with provable continuity.
                                </>
                            }
                        />
                    ) : null}

                    <Button
                        href={`/api/control-slip/${encodeURIComponent(sub.id)}?t=${encodeURIComponent(t)}`}
                        mode={theme}
                        tooltip={
                            <>
                                <strong>This slip is your custody recovery instrument.</strong><br />
                                It allows you to reclaim, prove, and transfer this Thought chain<br /> even if the platform disappears.<br />
                                <span style={{ color: "#d32f2f" }}>Store it offline in a safe place.</span>
                            </>
                        }
                    >
                        Download Control Slip
                    </Button>

                    <CopyPrivateControlLink url={privateUrl} mode={theme} />

                    {sub.is_public ? (
                        <Button
                            href={`/public-ledger`}
                            mode={theme}
                            tooltip={
                                <>
                                    <strong>This chain is listed on the Public Ledger.</strong>
                                    <br />
                                    Click to view the public index.
                                </>
                            }
                        >
                            View on Public Ledger
                        </Button>
                    ) : null}

                    <Button
                        href={`/traction?record_id=${encodeURIComponent(sub.id)}`}
                        mode={theme}
                        tooltip={
                            <>
                                <strong>Traction Dashboard (Beta).</strong><br />
                                View signals, acknowledgements, and valuations for this record.
                            </>
                        }
                    >
                        📊 View Traction
                    </Button>

                    {sub.record_class === "ENGRAVED" && sub.seal_object_key ? (
                        <DownloadButton
                            url={`/api/seal/${encodeURIComponent(sub.id)}/download?t=${encodeURIComponent(t)}`}
                            filename={`Seal-${sub.id}.png`}
                            mode={theme}
                            label="🔵 Download Seal (PNG)"
                            tooltip={
                                <>
                                    <strong>Download a high-resolution evidentiary seal for this certificate.</strong><br />
                                    The seal encodes key verification details (e.g., hashes and identifiers)<br /> for printing, engraving, or archival use.
                                </>
                            }
                        />
                    ) : sub.record_class === "ENGRAVED" ? (
                        <SealPoller />
                    ) : null}
                </div>

                <p className="small" style={{ marginTop: 10 }}>
                    Public verification link:{" "}
                    <a href={`/verify/${encodeURIComponent(sub.id)}`}>{`${sub.id}`}</a>
                </p>
                <Divider />

                <div className="kicker" style={{ color: theme === 'dark' ? 'var(--muted)' : undefined }}>Ledger</div>
                <h2 className="h2" style={{ marginBottom: 10, color: theme === 'dark' ? 'var(--ink)' : undefined }}>Certificate timeline</h2>
                <p className="subhead" style={{ marginBottom: 20 }}>
                    Page 1 is your Genesis Proof. Add sealed pages as your idea evolves.
                </p>

                <ChainTimeline
                    genesis={{
                        id: sub.id,
                        issuedAt: sub.issued_at || sub.created_at,
                        hash: sub.content_hash,
                        label: sub.title || "Untitled Thought"
                    }}
                    artifacts={artifacts.map(a => ({
                        id: a.id,
                        issuedAt: a.issued_at,
                        filename: a.original_filename,
                        note: a.thought_caption,
                        hash: a.canonical_hash,
                        chainHash: a.chain_hash
                    }))}
                    accessKey={t}
                    initialUnitLabel={sub.unit_label ?? "PAGE"}
                    theme={theme}
                />
            </SuccessPageWrapper>
        </div>
    );
}
