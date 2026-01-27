'use client';

import React, { useState, useEffect } from 'react';
import Divider from "@/components/Divider";
import MonoBlock from "@/components/MonoBlock";
import Button from "@/components/Button";
import dynamic from "next/dynamic";
import '@/app/traction/traction.css'; // Import traction styles

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

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('pot-theme', newTheme);
    };

    if (!mounted) return null; // Avoid hydration mismatch on theme

    // --- DARK MODE (TRACTION STYLE) ---
    if (theme === 'dark') {
        return (
            <div className="traction-body" data-theme="dark">
                <SessionRecorder id={sub.id} />
                <div className="traction-wrap">
                    {/* Topbar */}
                    <div className="traction-topbar">
                        <div className="traction-brand">
                            <div className="traction-mark" aria-hidden="true"></div>
                            <div>
                                <h1 className="traction-title" style={{ fontSize: '14px', margin: 0 }}>
                                    Proof-of-Thought
                                </h1>
                                <small>Certificate Authority</small>
                            </div>
                        </div>
                        <div className="traction-pillrow">
                            <button className="traction-pill" onClick={toggleTheme} style={{ cursor: 'pointer' }}>
                                <span>☀ Day Mode</span>
                            </button>
                            {sub.is_public && (
                                <a href="/public-ledger" className="traction-pill">
                                    <span>Public Ledger</span>
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="traction-hero" style={{ gridTemplateColumns: '1fr', maxWidth: '700px', margin: '40px auto' }}>

                        {/* Main Certificate Card */}
                        <div className="traction-card">
                            <div className="traction-pad" style={{ textAlign: 'center', padding: '40px' }}>
                                <div className="traction-kicker" style={{ color: '#6aa6ff', marginBottom: '16px' }}>Verified Record</div>
                                <h1 className="traction-title" style={{ fontSize: '28px', marginBottom: '12px' }}>{sub.title || "Untitled Thought"}</h1>
                                <div className="traction-sub" style={{ fontSize: '14px', marginBottom: '32px' }}>
                                    {sub.id}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '30px' }}>
                                    <div>
                                        <div className="traction-kicker">Status</div>
                                        <div style={{ color: '#fff', fontWeight: 600 }}>{sub.status}</div>
                                    </div>
                                    <div>
                                        <div className="traction-kicker">Issued</div>
                                        <div style={{ color: '#fff', fontWeight: 600 }}>{new Date(sub.issued_at || sub.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="traction-ctaRow" style={{ justifyContent: 'center', gap: '12px' }}>
                                    <a
                                        href={`/api/download/${encodeURIComponent(sub.id)}?t=${encodeURIComponent(t)}`}
                                        className="traction-btn primary"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        Download Certificate (PDF)
                                    </a>
                                    <a
                                        href={`/vault?id=${encodeURIComponent(sub.id)}&t=${encodeURIComponent(t)}`}
                                        className="traction-btn ghost"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        Inspect Vault
                                    </a>
                                    <a
                                        href={`/traction?record_id=${encodeURIComponent(sub.id)}`}
                                        className="traction-btn ghost"
                                        style={{ textDecoration: 'none', color: '#60a5fa' }}
                                    >
                                        📊 View Traction
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Timeline Card */}
                        <div className="traction-card" style={{ marginTop: '20px' }}>
                            <div className="traction-pad">
                                <h2 className="traction-title" style={{ fontSize: '16px' }}>Ledger Timeline</h2>
                                <div style={{ marginTop: '20px' }}>
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
                                    // Force dark theme props if supported by ChainTimeline or let it inherit CSS
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    // --- LIGHT MODE (LEGACY / ORIGINAL) ---
    return (
        <SuccessPageWrapper>
            <SessionRecorder id={sub.id} />
            {/* 
             <div style={{ position: 'absolute', top: 20, right: 20 }}>
                <button 
                    onClick={toggleTheme}
                    style={{ 
                        background: 'transparent', 
                        border: '1px solid #ddd', 
                        borderRadius: '20px', 
                        padding: '6px 12px', 
                        fontSize: '12px', 
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >
                    🌙 Dark Mode
                </button>
            </div> 
            */}

            <div className="kicker">Issued</div>
            <h1 className="h1">Certificate available</h1>
            <p className="subhead">
                If payment has completed, your certificate will be issued and preserved in custody. If you refreshed too quickly,
                wait a moment and refresh.
            </p>

            <Divider />
            <MonoBlock label="Certificate ID" value={sub.id} />
            <MonoBlock label="Status" value={sub.status} />

            <Divider />

            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
                <Button
                    href={`/vault?id=${encodeURIComponent(sub.id)}&t=${encodeURIComponent(t)}`}
                    tooltip={
                        <>
                            <strong>Privately view your sealed Thought under custodial lock</strong> —<br />
                            without downloading or exposing the record.
                        </>
                    }
                >
                    Preview in Vault
                </Button>

                <Button
                    href={`/api/download/${encodeURIComponent(sub.id)}?t=${encodeURIComponent(t)}`}
                    tooltip={
                        <>
                            <strong>This is your original Proof-of-Thought certificate.</strong><br />
                            It establishes when your idea was first sealed <br />under third-party cryptographic custody.
                        </>
                    }
                >
                    Download PDF
                </Button>

                {artifacts.length > 0 ? (
                    <Button
                        href={`/api/chain/${encodeURIComponent(sub.id)}/download?t=${encodeURIComponent(t)}`}
                        tooltip={
                            <>
                                <strong>This is the full cryptographic lineage of your Thought</strong> —<br />
                                showing how your idea evolved over time with provable continuity.
                            </>
                        }
                    >
                        Download Chain PDF
                    </Button>
                ) : null}

                <Button
                    href={`/api/control-slip/${encodeURIComponent(sub.id)}?t=${encodeURIComponent(t)}`}
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

                <CopyPrivateControlLink url={privateUrl} />

                {sub.is_public ? (
                    <Button
                        href={`/public-ledger`}
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
                    <Button
                        href={`/api/seal/${encodeURIComponent(sub.id)}/download?t=${encodeURIComponent(t)}`}
                        tooltip={
                            <>
                                <strong>Download a high-resolution evidentiary seal for this certificate.</strong><br />
                                The seal encodes key verification details (e.g., hashes and identifiers)<br /> for printing, engraving, or archival use.
                            </>
                        }
                    >
                        🔵 Download Seal (PNG)
                    </Button>
                ) : sub.record_class === "ENGRAVED" ? (
                    <SealPoller />
                ) : null}
            </div>

            <p className="small" style={{ marginTop: 10 }}>
                Public verification link:{" "}
                <a href={`/verify/${encodeURIComponent(sub.id)}`}>{`${sub.id}`}</a>
            </p>
            <Divider />

            <div className="kicker">Ledger</div>
            <h2 className="h2" style={{ marginBottom: 10 }}>Certificate timeline</h2>
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
            />
        </SuccessPageWrapper>
    );
}
