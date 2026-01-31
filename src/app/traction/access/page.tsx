'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isTractionUIEnabled } from '@/lib/flags';
import '../traction.css';

export default function TractionAccessPage() {
    const router = useRouter();
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [record, setRecord] = useState<any>(null);
    const [recordId, setRecordId] = useState<string | null>(null);
    const [tokens, setTokens] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [createLabel, setCreateLabel] = useState('');
    const [createType, setCreateType] = useState('full'); // 'pitch', 'summary', 'full'
    const [createLoading, setCreateLoading] = useState(false);

    const [ndaEnabled, setNdaEnabled] = useState(false);
    const [ndaText, setNdaText] = useState('');
    const [pitchText, setPitchText] = useState('');
    const [summaryText, setSummaryText] = useState('');
    const [ndaSaving, setNdaSaving] = useState(false);

    // Theme
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    const fetchAccessData = React.useCallback(() => {
        if (!recordId) return;
        fetch(`/api/traction/signals?record_id=${recordId}`)
            .then(res => res.json())
            .then(data => {
                if (data.tokens) setTokens(data.tokens);
            })
            .catch(err => console.error("Failed to load access data", err));
    }, [recordId]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            setRecordId(params.get('record_id'));
        }
    }, []);

    useEffect(() => {
        if (!recordId) return;
        // Fetch Record Details
        fetch(`/api/traction/record?record_id=${recordId}`)
            .then(res => res.json())
            .then(data => {
                if (data.record) {
                    setRecord(data.record);
                    // Init Settings
                    setNdaEnabled(!!data.record.nda_enabled);
                    setNdaText(data.record.nda_text || "This information is confidential. By proceeding, you agree not to share or reproduce this content without permission.");
                    setPitchText(data.record.pitch_text || "");
                    setSummaryText(data.record.summary_text || "");
                }
            })
            .catch(err => console.error("Failed to load record", err));

        fetchAccessData();

        // Polling (NDA signups)
        const pollInterval = setInterval(() => {
            fetchAccessData();
        }, 5000);

        // Pre-fill "Grant To"
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const grantTo = params.get('grant_to');
            if (grantTo) {
                setShowCreate(true);
                setCreateLabel(grantTo);
            }
        }

        return () => clearInterval(pollInterval);
    }, [recordId, fetchAccessData]);

    useEffect(() => {
        const isEnabled = isTractionUIEnabled();
        if (!isEnabled) {
            router.replace('/404');
        } else {
            setEnabled(true);
        }

        const saved = localStorage.getItem('pot-traction-theme') as 'dark' | 'light';
        if (saved) setTheme(saved);
    }, [router]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('pot-traction-theme', theme);
    }, [theme]);

    if (!enabled) return null;

    const handleSaveSettings = async () => {
        if (!recordId) return;
        setNdaSaving(true);
        try {
            // Save Content
            await fetch('/api/traction/update-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    record_id: recordId,
                    pitch_text: pitchText,
                    summary_text: summaryText
                })
            });

            // Save NDA
            await fetch('/api/traction/update-nda', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    record_id: recordId,
                    enabled: ndaEnabled,
                    text: ndaText
                })
            });

            alert("Deal Configuration Saved.");
        } catch (e) {
            console.error(e);
            alert("Error saving settings.");
        } finally {
            setNdaSaving(false);
        }
    };

    return (
        <div className="traction-body" data-theme={theme}>
            <div className="traction-wrap">
                {/* Topbar */}
                <div className="traction-topbar">
                    <div className="traction-brand" style={{ cursor: 'pointer' }} onClick={() => router.push(`/traction?record_id=${recordId}`)}>
                        <div className="traction-mark" aria-hidden="true"></div>
                        <div>
                            <h1 className="traction-title" style={{ fontSize: '14px', margin: 0 }}>
                                Proof-of-Thought <span style={{ opacity: 0.75 }}>/ DEAL ROOM</span> <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 400 }}>(Under development)</span>
                            </h1>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginTop: '4px', width: '100%' }}></div>
                        </div>
                    </div>
                    <div className="traction-pillrow">
                        <button className="traction-btn secondary" onClick={() => router.push(`/traction?record_id=${recordId}`)}>
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>

                <div className="traction-hero" style={{ margin: '0 auto' }}>

                    {/* Left: Access Tokens Card */}
                    <div className="traction-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className="traction-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                    <div>
                                        <h1 className="traction-title" style={{ fontSize: '24px', letterSpacing: '-0.02em', margin: 0 }}>
                                            DEAL ROOM
                                            <span style={{ fontSize: '12px', opacity: 0.5, fontWeight: 400, marginLeft: '8px', verticalAlign: 'middle', letterSpacing: '0' }}>
                                                (Under development)
                                            </span>
                                        </h1>
                                        <p style={{ margin: '4px 0 0 0', opacity: 0.6, fontSize: '13px' }}>
                                            Manage private disclosures and authorized access.
                                        </p>
                                    </div>
                                    <button
                                        className="traction-btn"
                                        style={{
                                            fontSize: '12px',
                                            padding: '6px 12px',
                                            border: '1px solid rgba(59, 130, 246, 0.5)',
                                            color: '#60a5fa',
                                            background: 'rgba(59, 130, 246, 0.05)',
                                            fontWeight: 500
                                        }}
                                        onClick={() => setShowCreate(!showCreate)}
                                    >
                                        {showCreate ? 'Cancel' : '+ Create Access Link'}
                                    </button>
                                </div>
                            </div>

                            {/* Creation Form */}
                            {showCreate && (
                                <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <h3 style={{ fontSize: '13px', marginBottom: '12px', opacity: 0.9 }}>New Private Link</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>Recipient / Label</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Investor Name"
                                                value={createLabel}
                                                onChange={e => setCreateLabel(e.target.value)}
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>Disclosure Type</label>
                                            <select
                                                value={createType}
                                                onChange={e => setCreateType(e.target.value)}
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                                            >
                                                <option value="pitch">Elevator Pitch (Basic)</option>
                                                <option value="summary">Executive Summary</option>
                                                <option value="full">Full Disclosure</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        className="traction-btn primary"
                                        style={{ width: '100%', justifyContent: 'center' }}
                                        disabled={createLoading}
                                        onClick={async () => {
                                            if (!createLabel) {
                                                alert("Please enter a label");
                                                return;
                                            }
                                            setCreateLoading(true);
                                            try {
                                                const res = await fetch('/api/traction/create-link', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        record_id: recordId,
                                                        label: createLabel,
                                                        disclosure_type: createType
                                                    })
                                                });
                                                const data = await res.json();
                                                if (data.link) {
                                                    setCreateLabel('');
                                                    setShowCreate(false);
                                                    fetchAccessData();
                                                } else {
                                                    alert("Error: " + (data.error || "Unknown"));
                                                }
                                            } catch (e: any) {
                                                alert("Error: " + e.message);
                                            } finally {
                                                setCreateLoading(false);
                                            }
                                        }}
                                    >
                                        {createLoading ? 'Generating...' : 'Generate Secure Link'}
                                    </button>
                                </div>
                            )}

                            <div className="traction-side traction-scroll" style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', overflowY: 'auto', flex: 1, minHeight: '300px' }}>
                                {tokens.length === 0 && (
                                    <div className="item" style={{ padding: '24px', textAlign: 'center', opacity: 0.6 }}>
                                        <p style={{ fontSize: '14px' }}>No active private links.</p>
                                    </div>
                                )}
                                {tokens.map(t => (
                                    <div key={t.id} className="item" style={{ marginBottom: '0', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{t.label || "Unnamed Link"}</span>
                                                    {t.disclosure_type && (
                                                        <span className={`traction-tag ${t.disclosure_type === 'full' ? 'good' : (t.disclosure_type === 'summary' ? 'mid' : 'warn')}`} style={{ fontSize: '10px', padding: '1px 6px', textTransform: 'uppercase' }}>
                                                            {t.disclosure_type}
                                                        </span>
                                                    )}
                                                    {t.nda_accepted_at && (
                                                        <span style={{ fontSize: '10px', color: '#eab308', background: 'rgba(234, 179, 8, 0.1)', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                                                            NDA SIGNED {new Date(t.nda_accepted_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).replace(',', '')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="traction-pmeta" style={{ fontSize: '12px', marginTop: '4px', opacity: 0.6 }}>
                                                    Created {new Date(t.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="traction-btn ghost"
                                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/v/${record?.registry_no ? `R-${String(record.registry_no).padStart(16, '0')}` : ""}?access_token=${t.token}`;
                                                        navigator.clipboard.writeText(url);
                                                        alert("Link copied: " + url);
                                                    }}
                                                >
                                                    Copy URL
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Deal Configuration Card */}
                    <div className="traction-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className="traction-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>Deal Configuration</h2>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                                {/* Section 1: Content Packaging */}
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', marginBottom: '12px', fontWeight: 600 }}>1. Content Packaging</h3>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>Elevator Pitch (Teaser)</label>
                                        <textarea
                                            placeholder="The one-sentence hook or public teaser text..."
                                            value={pitchText}
                                            onChange={e => setPitchText(e.target.value)}
                                            style={{ width: '100%', minHeight: '60px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: '#fff', fontSize: '13px' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>Executive Summary (Partial Access)</label>
                                        <textarea
                                            placeholder="Detailed summary revealed to those with 'Summary' or 'Full' access... (You may paste links to external PDFs, slides, or videos here.)"
                                            value={summaryText}
                                            onChange={e => setSummaryText(e.target.value)}
                                            style={{ width: '100%', minHeight: '120px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: '#fff', fontSize: '13px', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                </div>

                                {/* Section 2: Security */}
                                <div style={{ marginBottom: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', marginBottom: '12px', fontWeight: 600 }}>2. Security & Access</h3>

                                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                            type="checkbox"
                                            id="ndaToggle"
                                            checked={ndaEnabled}
                                            onChange={e => setNdaEnabled(e.target.checked)}
                                            style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="ndaToggle" style={{ cursor: 'pointer', fontSize: '14px' }}>
                                            <strong>Require Non-Disclosure Agreement (NDA)</strong>
                                            <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>
                                                Viewers must accept terms before seeing "Full Disclosure".
                                            </div>
                                        </label>
                                    </div>

                                    {ndaEnabled && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>Clickwrap Agreement Terms</label>
                                            <textarea
                                                value={ndaText}
                                                onChange={e => setNdaText(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    minHeight: '120px',
                                                    background: 'rgba(0,0,0,0.3)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '6px',
                                                    padding: '12px',
                                                    color: '#fff',
                                                    fontFamily: 'monospace',
                                                    fontSize: '12px',
                                                    lineHeight: '1.5'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
                                <button
                                    className="traction-btn"
                                    style={{
                                        border: '1px solid #3b82f6',
                                        color: '#3b82f6',
                                        background: 'transparent',
                                        fontWeight: 600
                                    }}
                                    onClick={handleSaveSettings}
                                    disabled={ndaSaving}
                                >
                                    {ndaSaving ? "Saving..." : "Save Configuration"}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
