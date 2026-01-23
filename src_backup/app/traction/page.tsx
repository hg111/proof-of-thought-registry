'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isTractionUIEnabled } from '@/lib/flags';
import PerformanceTimeline from '@/components/traction/PerformanceTimeline';
import './traction.css';

// Using a Client Component wrapper to handle the feature flag + DOM safely
export default function TractionReceiptPage() {
    const router = useRouter();
    const readOnly = false;
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [selectedResponse, setSelectedResponse] = useState<any>(null);
    const [signals, setSignals] = useState<any[]>([]);

    // Share State
    const [showShareInput, setShowShareInput] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [shareLoading, setShareLoading] = useState(false);

    const [record, setRecord] = useState<any>(null);
    const [recordId, setRecordId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            setRecordId(params.get('record_id'));
        }
    }, []);

    // Fetch Record Data
    // List State
    const [recentRecords, setRecentRecords] = useState<any[]>([]);

    useEffect(() => {
        if (!recordId) {
            // Load list if no ID
            // Check localStorage for "my records"
            let url = '/api/traction/list';
            try {
                const stored = localStorage.getItem('pot_my_records');
                if (stored) {
                    const ids = JSON.parse(stored);
                    if (Array.isArray(ids) && ids.length > 0) {
                        url += `?ids=${ids.join(',')}`;
                    }
                }
            } catch (e) {
                console.error("Failed to read local records", e);
            }

            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data.records) setRecentRecords(data.records);
                })
                .catch(err => console.error(err));
            return;
        }

        // Fetch Record Details
        fetch(`/api/traction/record?record_id=${recordId}`)
            .then(res => res.json())
            .then(data => {
                if (data.record) setRecord(data.record);
            })
            .catch(err => console.error("Failed to load record", err));

        // Fetch Signals (Polling)
        const fetchSignals = () => {
            fetch(`/api/traction/signals?record_id=${recordId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.signals) setSignals(data.signals);
                })
                .catch(err => console.error("Failed to load signals", err));
        };

        fetchSignals();
        const interval = setInterval(fetchSignals, 3000);
        return () => clearInterval(interval);
    }, [recordId]);

    useEffect(() => {
        const isEnabled = isTractionUIEnabled();
        if (!isEnabled) {
            router.replace('/404');
        } else {
            setEnabled(true);
        }
    }, [router]);

    // Theme is now isolated to this component tree, preventing leaks to other pages
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        const saved = localStorage.getItem('pot-traction-theme') as 'dark' | 'light';
        if (saved) setTheme(saved);
    }, []);

    useEffect(() => {
        localStorage.setItem('pot-traction-theme', theme);
    }, [theme]);

    if (!enabled) return null;

    // Handlers
    const handleShareLink = async () => {
        if (!shareEmail.trim()) return;
        setShareLoading(true);
        try {
            const url = `${window.location.origin}/v/${record?.registry_no ? `R-${String(record.registry_no).padStart(16, '0')}` : ""}?d=1`;

            const res = await fetch('/api/traction/share-proof', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient_email: shareEmail.trim(),
                    proof_url: url,
                    handle_title: record?.title || "Untitled Record"
                })
            });
            const data = await res.json();

            if (data.success) {
                alert("Link shared successfully!");
                setShowShareInput(false);
                setShareEmail('');
            } else {
                alert("Failed to share: " + (data.error || "Unknown error"));
            }
        } catch (e) {
            console.error(e);
            alert("Network error sharing link");
        } finally {
            setShareLoading(false);
        }
    };

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    return (
        <div className="traction-body" data-theme={theme}>
            <div className="traction-wrap">
                {/* Topbar */}
                <div className="traction-topbar">
                    <div className="traction-brand">
                        <div className="traction-mark" aria-hidden="true"></div>
                        <div>
                            <h1 className="traction-title" style={{ fontSize: '14px', margin: 0 }}>
                                Proof-of-Thought <span style={{ opacity: 0.75 }}>/ Traction</span>
                            </h1>
                            <small style={{ color: 'var(--muted)', fontWeight: 500 }}>
                                What the creator sees after recipients respond (acknowledgement + valuation).
                            </small>
                        </div>
                    </div>
                    <div className="traction-pillrow">
                        <button
                            onClick={toggleTheme}
                            className="traction-btn ghost"
                            style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            title="Toggle Day/Night Mode"
                        >
                            {theme === 'dark' ? '☀️ Day' : '🌙 Night'}
                        </button>
                        <div className="traction-pill">
                            <span className="traction-dot"></span> Record is sealed
                        </div>
                        <div className="traction-pill">
                            <span className="traction-dot warn"></span> Ledger anchor pending
                        </div>
                    </div>
                </div >

                {/* If no record ID, show list */}
                {!recordId && (
                    <div className="traction-card">
                        <div className="traction-pad">
                            <div className="traction-kicker">My Records</div>
                            <div className="traction-title">Recent Proofs</div>
                            <p className="traction-sub">Select a record to view traction signals.</p>

                            <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
                                {recentRecords.map(r => (
                                    <div key={r.id} onClick={() => window.location.href = `/traction?record_id=${r.id}`} style={{
                                        padding: '16px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.04)',
                                        cursor: 'pointer',
                                        border: '1px solid transparent',
                                    }}
                                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--text)'}
                                        onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                                    >
                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{r.title}</div>
                                        <div className="traction-mono" style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                                            {r.registry_no ? `R-${String(r.registry_no).padStart(16, '0')}` : "R-..."} · {new Date(r.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                                {recentRecords.length === 0 && <div style={{ opacity: 0.6 }}>No records found.</div>}
                            </div>
                        </div>
                    </div>
                )}

                {recordId && (
                    <>
                        <div className="traction-hero">
                            {/* Main Card */}
                            <div className="traction-card">
                                <div className="traction-pad">
                                    <div className="traction-kicker">Genesis Record</div>
                                    <div className="traction-title">
                                        {record?.registry_no ? `R-${String(record.registry_no).padStart(16, '0')}` : "R-..."} — “{record?.title || "Untitled"}”
                                    </div>
                                    <p className="traction-sub">
                                        This page aggregates third-party responses as <b>signals</b> attached to the sealed record (without exposing sealed bytes).
                                    </p>

                                    <div className="traction-row">
                                        <div className="traction-chip"><b>Sealed</b> {record?.created_at ? new Date(record.created_at).toLocaleString() : "Loading..."}</div>
                                        <div className="traction-chip"><b>Hash</b> {record?.content_hash ? (record.content_hash.substring(0, 8) + '…' + record.content_hash.substring(record.content_hash.length - 8)) : "..."}</div>
                                        <div className="traction-chip"><b>Disclosure</b> handle-only</div>
                                        <div className="traction-chip"><b>Acks</b> 3</div>
                                        <div className="traction-chip"><b>Valuations</b> 2</div>
                                    </div>

                                    {!readOnly && (
                                        <div className="traction-ctaRow">
                                            <button className="traction-btn primary" onClick={() => router.push(`/ack/invite?record_id=${recordId}`)}>Request acknowledgement</button>
                                            <button className="traction-btn" onClick={() => alert('Mock: Export')}>Export proof bundle</button>
                                            <button className="traction-btn ghost" onClick={() => alert('Mock: Share')}>Copy verifier link</button>
                                            <button
                                                className="traction-btn ghost"
                                                style={{ color: '#ff4444', fontWeight: 600, border: '1px solid #ff4444' }}
                                                onClick={async () => {
                                                    if (confirm("Confirm: Clear all test signals for this record?")) {
                                                        await fetch(`/api/traction/reset?record_id=${recordId}`, { method: 'DELETE' });
                                                        window.location.reload();
                                                    }
                                                }}
                                            >
                                                Reset (Test)
                                            </button>
                                        </div>
                                    )}

                                    {/* Metrics */}
                                    <div className="traction-metrics">
                                        <div className="traction-mBox">
                                            <div className="traction-mLbl">Signal Score (Beta)</div>
                                            <div className="traction-mVal" id="sigScore">
                                                {/* Score: 1 pt per signal + 4 bonus for valuation */}
                                                {Math.min(100, signals.reduce((acc, s) => acc + 1 + (s.type === 'ack_value' ? 4 : 0), 0))} <small>/ 100</small>
                                            </div>
                                            <div className="traction-bar" aria-hidden="true">
                                                <i style={{ width: `${Math.min(100, signals.reduce((acc, s) => acc + 1 + (s.type === 'ack_value' ? 4 : 0), 0))}%` }}></i>
                                            </div>
                                            <div className="traction-hint">Growth metric. +1/Ack, +5/Valuation.</div>
                                        </div>

                                        <div className="traction-mBox">
                                            <div className="traction-mLbl">Avg. Valuation Estimate</div>
                                            <div className="traction-mVal">
                                                {(() => {
                                                    const parseVal = (b: string) => {
                                                        const s = b.toLowerCase().replace(/,/g, '');

                                                        // Handle standard buckets first (fast path)
                                                        if (s === '$0') return 0;
                                                        if (s.includes('$1–$99')) return 50;
                                                        if (s.includes('$100–$999')) return 500;
                                                        if (s.includes('$1k–')) return 5000;
                                                        if (s.includes('$10k–')) return 55000;
                                                        if (s.includes('$100k–')) return 550000;
                                                        if (s.includes('$1m+')) return 1500000;

                                                        // Handle custom inputs (e.g. "3M", "10k-50k")
                                                        // Regex to find all number-suffix pairs
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

                                                        // Average them
                                                        const total = values.reduce((acc, v) => acc + v, 0);
                                                        return Math.round(total / values.length);
                                                    };

                                                    const vals = signals
                                                        .filter(s => s.type === 'ack_value' && (s.val_bucket || s.val_exact))
                                                        .map(s => parseVal(s.val_exact || s.val_bucket)); // No sort needed for average

                                                    if (vals.length === 0) return <>— <small>(No data)</small></>;

                                                    // Calculate Average (Mean) instead of Median
                                                    const total = vals.reduce((acc, v) => acc + v, 0);
                                                    const avg = total / vals.length;

                                                    const formatted = avg >= 1000000
                                                        ? `$${(avg / 1000000).toFixed(1)}M`
                                                        : avg >= 1000
                                                            ? `$${(avg / 1000).toFixed(0)}k`
                                                            : `$${avg.toFixed(0)}`;

                                                    return (
                                                        <>
                                                            {formatted} <small>({vals.length} signals)</small>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <div className="traction-bar" aria-hidden="true">
                                                <i style={{ width: '44%' }}></i>
                                            </div>
                                            <div className="traction-hint">Signal only. Not rights. Not ownership. Not an offer.</div>
                                        </div>

                                        <div className="traction-mBox">
                                            <div className="traction-mLbl">Total Responses</div>
                                            <div className="traction-mVal">
                                                {signals.length} <small>(All types)</small>
                                            </div>
                                            <div className="traction-bar" aria-hidden="true">
                                                <i style={{ width: '100%' }}></i>
                                            </div>
                                            <div className="traction-hint">V1: A / B / C based on invitee verification + role tag.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="traction-card traction-side">
                                <div className="traction-pad">
                                    <div className="traction-kicker">Quick context</div>

                                    <div className="item">
                                        <h3>What’s recorded</h3>
                                        <p>Append-only entries: timestamp, responder identity (or pseudonym), response type, and optional note.</p>
                                    </div>

                                    <div className="item">
                                        <h3>Response types</h3>
                                        <div className="traction-tagRow" style={{ marginTop: '8px' }}>
                                            <span className="traction-tag good">Acknowledgement</span>
                                            <span className="traction-tag warn">Valuation</span>
                                            <span className="traction-tag">Feedback (optional)</span>
                                        </div>
                                    </div>

                                    <div className="item">
                                        <h3>Public verifier (optional)</h3>
                                        <p>Share a short verifier handle that reveals only what you choose.</p>
                                        <div style={{ marginTop: '8px' }}>
                                            <code style={{ display: 'block', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '11px', marginBottom: '8px', wordBreak: 'break-all' }}>
                                                {typeof window !== 'undefined'
                                                    ? `${window.location.origin}/v/${record?.registry_no ? `R-${String(record.registry_no).padStart(16, '0')}` : "..."}?d=1`
                                                    : "..."}
                                            </code>

                                            {/* Share Controls */}
                                            {!showShareInput ? (
                                                <div className="traction-ctaRow" style={{ marginTop: '0', gap: '8px' }}>
                                                    <button
                                                        className="traction-btn ghost"
                                                        style={{ fontSize: '11px', padding: '4px 8px' }}
                                                        onClick={() => {
                                                            const url = `${window.location.origin}/v/${record?.registry_no ? `R-${String(record.registry_no).padStart(16, '0')}` : ""}?d=1`;
                                                            window.open(url, '_blank');
                                                        }}
                                                    >
                                                        Preview
                                                    </button>
                                                    <button
                                                        className="traction-btn ghost"
                                                        style={{ fontSize: '11px', padding: '4px 8px' }}
                                                        onClick={() => setShowShareInput(true)}
                                                    >
                                                        Email Link
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '8px' }}>
                                                    <input
                                                        type="email"
                                                        placeholder="Recipient email..."
                                                        value={shareEmail}
                                                        onChange={(e) => setShareEmail(e.target.value)}
                                                        style={{
                                                            background: 'rgba(0,0,0,0.3)',
                                                            border: '1px solid #334155',
                                                            borderRadius: '4px',
                                                            color: '#fff',
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
                                                            flex: 1,
                                                            outline: 'none'
                                                        }}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleShareLink()}
                                                    />
                                                    <button
                                                        className="traction-btn primary"
                                                        disabled={shareLoading}
                                                        onClick={handleShareLink}
                                                        style={{ fontSize: '11px', padding: '4px 10px', height: '26px' }}
                                                    >
                                                        {shareLoading ? '...' : 'Send'}
                                                    </button>
                                                    <button
                                                        className="traction-btn ghost"
                                                        onClick={() => setShowShareInput(false)}
                                                        style={{ fontSize: '16px', padding: '0 6px', height: '26px', border: 'none' }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="traction-fullRow">
                            <PerformanceTimeline
                                signals={signals}
                                recordCreated={record?.created_at}
                            />
                        </div>

                        {/* Grid: Responses & Log (Simplified for brevity, can be expanded) */}
                        <div className="traction-grid">
                            {/* Responses Table */}
                            <div className="traction-card">
                                <div className="traction-pad">
                                    <div className="traction-kicker">Responses</div>
                                    <div className="traction-title" style={{ fontSize: '15px' }}>Acknowledgements and valuations attached to this record</div>
                                    <div className="traction-sub" style={{ marginBottom: '10px' }}>Click a row to view details. (Mock data.)</div>

                                    <div style={{ overflow: 'auto', maxHeight: '400px', borderRadius: '14px', border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.14)' }}>
                                        <table className="traction-table" role="table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '38%' }}>Responder</th>
                                                    <th style={{ width: '22%' }}>Signal</th>
                                                    <th style={{ width: '18%' }}>When</th>
                                                    <th style={{ width: '22%' }}>Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {signals.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                                                            No responses yet. Share the invite link to get feedback.
                                                        </td>
                                                    </tr>
                                                )}
                                                {signals.map((s: any) => {
                                                    // Map types
                                                    let typeLabel = 'Acknowledged';
                                                    let typeClass = 'good';
                                                    if (s.type === 'ack_value') {
                                                        typeLabel = 'Valuation';
                                                        typeClass = 'warn';
                                                    } else if (s.type === 'request_access') {
                                                        typeLabel = 'Access Request';
                                                        typeClass = 'neutral'; // Or a specific color
                                                    }

                                                    return (
                                                        <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedResponse({
                                                            responder: s.responder_name || "Anonymous",
                                                            role: s.responder_role || "Invitee",
                                                            type: typeLabel,
                                                            typeClass: typeClass,
                                                            rawType: s.type, // Pass raw type for button logic
                                                            date: new Date(s.created_at).toLocaleString(),
                                                            valuation: s.type === 'ack_value' ? (s.val_exact || s.val_bucket) : null,
                                                            note: s.note || (s.type === 'ack_value' ? (s.val_exact || s.val_bucket) : "No comment"),
                                                            hash: "0x" + s.id.substring(0, 8) + "...",
                                                            sigLevel: "Verified"
                                                        })}>
                                                            <td>
                                                                <div className="traction-person">
                                                                    <div className="traction-avatar">{s.responder_name ? s.responder_name[0] : "?"}</div>
                                                                    <div>
                                                                        <p className="traction-pname">{s.responder_name || "Anonymous"}</p>
                                                                        <div className="traction-pmeta">{s.responder_role || "Invitee"}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="traction-tagRow">
                                                                    <span className={`traction-tag ${typeClass}`}>
                                                                        {typeLabel}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="traction-pmeta">{new Date(s.created_at).toLocaleDateString()}</td>
                                                            <td className="traction-pmeta" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {
                                                                    // Show note or valuation or request detail
                                                                    s.note ? s.note : (s.type === 'ack_value' ? (s.val_exact || s.val_bucket) : "—")
                                                                }
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Log */}
                            <div className="traction-card">
                                <div className="traction-pad">
                                    <div className="traction-kicker">Activity log</div>
                                    <div className="traction-title" style={{ fontSize: '15px' }}>Record activity</div>
                                    <div className="traction-side">
                                        <div className="item">
                                            <h3>Sealed</h3>
                                            <p>Canonical bytes generated + trusted timestamp bound.</p>
                                            <p className="traction-pmeta">13:08</p>
                                        </div>
                                        <div className="item">
                                            <h3>Invites sent</h3>
                                            <p>3 recipients invited (manual send).</p>
                                            <p className="traction-pmeta">13:22</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </>
                )}

            </div >

            {/* Modal */}
            <div className={`traction-modal ${selectedResponse ? 'open' : ''}`} onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedResponse(null);
            }}>
                <div className="traction-box">
                    <div className="traction-hd">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="traction-dot" style={{ background: selectedResponse?.typeClass === 'good' ? 'var(--good)' : (selectedResponse?.typeClass === 'warn' ? 'var(--warn)' : '#fff') }}></div>
                            <h2>Response Details</h2>
                        </div>
                        <button className="traction-x" onClick={() => setSelectedResponse(null)}>✕</button>
                    </div>
                    <div className="traction-bd">
                        {selectedResponse && (
                            <>
                                <div className="traction-kv">
                                    <div className="k">Responder</div>
                                    <div className="v">{selectedResponse.responder} <span style={{ fontWeight: 400, opacity: 0.6 }}>({selectedResponse.role})</span></div>
                                </div>
                                <div className="traction-kv">
                                    <div className="k">Signal Type</div>
                                    <div className="v">{selectedResponse.type}</div>
                                </div>
                                {selectedResponse.valuation && (
                                    <div className="traction-kv">
                                        <div className="k">Valuation Estimate</div>
                                        <div className="v" style={{ color: 'var(--warn)', fontWeight: 600 }}>{selectedResponse.valuation}</div>
                                    </div>
                                )}
                                <div className="traction-kv">
                                    <div className="k">Timestamp</div>
                                    <div className="v">{selectedResponse.date}</div>
                                </div>
                                <div className="traction-kv">
                                    <div className="k">Content Note</div>
                                    <div className="v" style={{ fontStyle: 'italic', opacity: 0.9 }}>“{selectedResponse.note}”</div>
                                </div>
                                <div className="traction-kv">
                                    <div className="k">Signal Hash</div>
                                    <div className="v"><code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>{selectedResponse.hash}</code></div>
                                </div>
                                <div className="traction-kv">
                                    <div className="k">Credibility</div>
                                    <div className="v">{selectedResponse.sigLevel}</div>
                                </div>

                                {/* Grant Access Action */}
                                {selectedResponse.rawType === 'request_access' && (
                                    <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '14px', marginBottom: '10px', fontWeight: 600 }}>Action Required</div>
                                        <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '12px' }}>
                                            This user requested access to view the full proof.
                                        </p>
                                        <button
                                            className="traction-btn primary"
                                            style={{ width: '100%' }}
                                            onClick={() => {
                                                const email = encodeURIComponent(selectedResponse.responder);
                                                router.push(`/ack/invite?record_id=${recordId}&email=${email}&action=grant`);
                                            }}
                                        >
                                            Grant Access (Send Invite)
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="traction-foot micro">
                            Verifiable via public registry using the Record ID and Signal Hash.
                        </div>
                    </div>
                </div>
            </div>

        </div >

    );
}
