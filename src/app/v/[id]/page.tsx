'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import '../radiant.css';

export default function RadiantVerifierPage() {
    const params = useParams();
    const [id, setId] = useState<string | null>(null);

    const [record, setRecord] = useState<any>(null);
    const [signals, setSignals] = useState<any[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Radio Selection State (Mutually Exclusive)
    const [selectedTier, setSelectedTier] = useState<'pitch' | 'summary' | 'full'>('pitch');

    // Disclosure Request State
    const [requesterEmail, setRequesterEmail] = useState('');
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        if (params?.id) {
            setId(Array.isArray(params.id) ? params.id[0] : params.id);
        }
    }, [params]);

    useEffect(() => {
        if (!id) return;

        fetch(`/api/traction/record?record_id=${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.record) {
                    setRecord(data.record);
                    return fetch(`/api/traction/signals?record_id=${data.record.id}`);
                }
            })
            .then(res => res?.json())
            .then(data => {
                if (data && data.signals) setSignals(data.signals);
            })
            .catch(console.error)
            .finally(() => setHasLoaded(true));

    }, [id]);

    if (!hasLoaded || !record) return <div className="radiant-body"><div style={{ opacity: 0.5 }}>Verifying...</div></div>;

    // Real Valuation Logic (Average)
    const realValuation = (() => {
        const parseVal = (b: string) => {
            if (!b) return 0;
            const s = b.toLowerCase().replace(/,/g, '');
            if (s === '$0') return 0;
            if (s.includes('$1–$99')) return 50;
            if (s.includes('$100–$999')) return 500;
            if (s.includes('$1k–')) return 5000;
            if (s.includes('$10k–')) return 55000;
            if (s.includes('$100k–')) return 550000;
            if (s.includes('$1m+')) return 1500000;
            const matches = [...s.matchAll(/(\d+(?:\.\d+)?)\s*([kmb])?/g)];
            if (matches.length === 0) return 0;
            const values = matches.map(m => {
                let val = parseFloat(m[1]);
                const suffix = m[2];
                if (suffix === 'k') val *= 1_000;
                else if (suffix === 'm') val *= 1_000_000;
                else if (suffix === 'b') val *= 1_000_000_000;
                return val;
            });
            const total = values.reduce((acc, v) => acc + v, 0);
            return Math.round(total / values.length);
        };

        const vals = signals
            .filter(s => s.type === 'ack_value' && (s.val_bucket || s.val_exact))
            .map(s => parseVal(s.val_exact || s.val_bucket));

        if (vals.length === 0) return "—";

        const total = vals.reduce((acc, v) => acc + v, 0);
        const avg = total / vals.length;

        return avg >= 1000000
            ? `$${(avg / 1000000).toFixed(1)}M`
            : avg >= 1000
                ? `$${(avg / 1000).toFixed(0)}K`
                : `$${avg.toFixed(0)}`;
    })();

    // Tier Labels Mapping
    const tierLabels = {
        pitch: "Elevator Pitch (1-pager)",
        summary: "Executive Summary (Deck)",
        full: "Full Disclosure (Data Room)"
    };

    return (
        <div className="radiant-body">

            <div className="radiant-layout-row">

                {/* 1. SIDE TITLE */}
                <div className="radiant-title-col">
                    {(() => {
                        const originalTitle = record.title || "Untitled Record";
                        // 1. Split into words (handling hyphens as separators too)
                        const allWords = originalTitle.replace(/-/g, ' ').split(/\s+/).filter(Boolean);

                        // 2. Truncate logic (max 16 words for poster aesthetic)
                        const MAX_WORDS = 16;
                        const isTruncated = allWords.length > MAX_WORDS;
                        const displayWords = isTruncated ? [...allWords.slice(0, MAX_WORDS), "..."] : allWords;

                        // 3. Dynamic Font Size logic
                        // Base 48px. Scale down if many words.
                        let fontSize = '48px';
                        const count = displayWords.length;
                        if (count > 12) fontSize = '32px';
                        else if (count > 8) fontSize = '40px';

                        return displayWords.map((word: string, i: number) => (
                            <div key={i} className="radiant-vertical-word" style={{ fontSize }}>{word}</div>
                        ));
                    })()}
                </div>

                {/* 2. PROOF PANEL */}
                <div className="radiant-box radiant-box-proof">
                    <div className="radiant-proof-header">
                        <div className="radiant-kicker">Genesis Record</div>
                        <h2 className="radiant-h2">Cryptographic Proof</h2>
                    </div>
                    <div className="radiant-content">
                        {/* Compact Layout */}
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <div className="radiant-field-lbl">Registry No</div>
                                <div className="radiant-field-val">{record.registry_no ? `R-${String(record.registry_no).padStart(16, '0')}` : "R-..."}</div>
                            </div>
                            <div>
                                <div className="radiant-field-lbl">Timestamp (UTC)</div>
                                <div className="radiant-field-val">
                                    {new Date(record.created_at).toISOString().replace('T', ' ').split('.')[0]} UTC
                                </div>
                            </div>
                            <div>
                                <div className="radiant-field-lbl">Content Hash (SHA-256)</div>
                                <div className="radiant-field-val">{record.content_hash}</div>
                            </div>
                        </div>

                        {/* BLURRED VAULT VISUALIZATION */}
                        <div className="radiant-blurred-block" style={{ marginTop: '24px' }}>
                            <div className="radiant-lock-overlay">
                                <span>🔒</span> Sealed Content (Encrypted)
                            </div>
                            <div className="radiant-blur-line" style={{ width: '90%' }}></div>
                            <div className="radiant-blur-line" style={{ width: '95%' }}></div>
                            <div className="radiant-blur-line" style={{ width: '80%' }}></div>
                            <div className="radiant-blur-line" style={{ width: '85%' }}></div>
                        </div>

                        <div style={{ marginTop: 'auto', opacity: 0.5, fontSize: '11px', lineHeight: '1.5' }}>
                            This certificate proves that the information existed in this form at the timestamped date.
                        </div>
                    </div>
                </div>

                {/* 3. TRACTION PANEL */}
                <div className="radiant-box radiant-box-traction">
                    <div className="radiant-proof-header" style={{ borderColor: '#1e3a8a' }}>
                        <div className="radiant-kicker" style={{ color: '#60a5fa' }}>Market Signal</div>
                        <h2 className="radiant-h2">Traction</h2>
                    </div>
                    <div className="radiant-traction-hero">

                        {/* Metrics Row */}
                        <div style={{ display: 'flex', gap: '32px', marginBottom: '10px', alignItems: 'flex-end' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div className="radiant-fraction">
                                    <span className="num">{signals.length}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginTop: '4px' }}>Signals</div>
                            </div>
                            <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <div style={{ textAlign: 'center' }}>
                                <div className="radiant-fraction">
                                    <span className="num">{Math.min(100, signals.reduce((acc, s) => acc + 1 + (s.type === 'ack_value' ? 4 : 0), 0))}</span>
                                    <span className="denom">/100</span>
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginTop: '4px' }}>Score</div>
                            </div>
                        </div>

                        <div className="radiant-val-lbl">Current Valuation</div>
                        <div className="radiant-big-val">{realValuation}</div>

                        {/* TIERED REQUEST OPTIONS (Radio) */}
                        <div className="radiant-tier-list">
                            {/* Removed Header "Request Disclosure" to avoid redundancy */}

                            <div className="radiant-tier-item" onClick={() => setSelectedTier('pitch')}>
                                <div className={`radiant-checkbox round ${selectedTier === 'pitch' ? 'checked' : ''}`}>
                                    {selectedTier === 'pitch' && <div className="radiant-dot-inner"></div>}
                                </div>
                                <span>{tierLabels.pitch}</span>
                            </div>

                            <div className="radiant-tier-item" onClick={() => setSelectedTier('summary')}>
                                <div className={`radiant-checkbox round ${selectedTier === 'summary' ? 'checked' : ''}`}>
                                    {selectedTier === 'summary' && <div className="radiant-dot-inner"></div>}
                                </div>
                                <span>{tierLabels.summary}</span>
                            </div>

                            <div className="radiant-tier-item" onClick={() => setSelectedTier('full')}>
                                <div className={`radiant-checkbox round ${selectedTier === 'full' ? 'checked' : ''}`}>
                                    {selectedTier === 'full' && <div className="radiant-dot-inner"></div>}
                                </div>
                                <span className={selectedTier === 'full' ? 'radiant-highlight-text' : ''}>{tierLabels.full}</span>
                            </div>
                        </div>

                        {/* Request Form */}
                        <div style={{ marginTop: '10px' }}>
                            {!requestSent ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <input
                                        type="email"
                                        placeholder="Enter your email to request access..."
                                        className="radiant-input"
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            fontSize: '13px'
                                        }}
                                        value={requesterEmail}
                                        onChange={e => setRequesterEmail(e.target.value)}
                                    />
                                    <button
                                        className="radiant-btn"
                                        disabled={requestLoading}
                                        onClick={async () => {
                                            if (!requesterEmail.includes('@')) {
                                                alert("Please enter a valid email.");
                                                return;
                                            }
                                            setRequestLoading(true);
                                            try {
                                                const res = await fetch('/api/traction/request-disclosure', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        record_id: record.id,
                                                        requester_email: requesterEmail,
                                                        request_type: tierLabels[selectedTier]
                                                    })
                                                });
                                                if (res.ok) {
                                                    setRequestSent(true);
                                                } else {
                                                    alert("Use default mail client? API failed.");
                                                    window.location.href = `mailto:?subject=Request Access&body=Requesting ${tierLabels[selectedTier]}`;
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                alert("Error sending request.");
                                            } finally {
                                                setRequestLoading(false);
                                            }
                                        }}
                                    >
                                        {requestLoading ? 'Sending...' : 'Request Disclosure'}
                                    </button>
                                </div>
                            ) : (
                                <div className="radiant-success-msg" style={{ padding: '15px', background: 'rgba(50, 205, 50, 0.1)', border: '1px solid rgba(50, 205, 50, 0.3)', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>✓ Request Sent</div>
                                    <div style={{ fontSize: '13px', opacity: 0.8 }}>The owner has been notified. Check your email ({requesterEmail}) for an invite.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
