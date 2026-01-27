'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isTractionUIEnabled } from '@/lib/flags';
import '../ack.css';

export default function AckRecipientPage() {
    const router = useRouter();
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Form State
    const [choice, setChoice] = useState('ack');
    const [valBucket, setValBucket] = useState('$0');
    const [valExact, setValExact] = useState('');
    const [basis, setBasis] = useState('Based on handle only');
    const [moreText, setMoreText] = useState('');
    const [toast, setToast] = useState<{ text: string, kind: 'ok' | 'warn' | 'bad' } | null>(null);


    useEffect(() => {
        if (!isTractionUIEnabled()) {
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

    // Data State
    const [inviteData, setInviteData] = useState<any>(null);
    const [recordData, setRecordData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch Invite Data
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const t = params.get('t');

            if (t) {
                fetch(`/api/traction/invite/validate?t=${t}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.valid) {
                            setInviteData(data.invite);
                            setRecordData(data.record);
                        } else {
                            setError(data.error || "Invalid Token");
                        }
                    })
                    .catch(() => setError("Network Error"))
                    .finally(() => setLoading(false));
            } else {
                setError("Missing Token");
                setLoading(false);
            }
        }
    }, []);

    if (!enabled) return null;

    if (loading) return <div className="ack-body"><div className="ack-wrap" style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Loading invite...</div></div>;
    if (error) return <div className="ack-body"><div className="ack-wrap" style={{ color: 'var(--warn)', padding: '40px', textAlign: 'center' }}>Error: {error}</div></div>;

    // Dynamic Text Logic
    const getDynamicText = (c: string) => {
        const texts = {
            ack: {
                title: "Acknowledge you didn’t see the idea — but were made aware of it",
                sub: "You are only reviewing a short handle (title + one-line summary) and the record identifiers. No sealed content is shared.",
                why: "Why this matters: This creates a neutral record that you were made aware of the idea at a specific time — without seeing or endorsing it. For the creator, this helps establish early awareness without disclosure."
            },
            ack_value: {
                title: "Acknowledge + provide a valuation signal (handle-level)",
                sub: "You can acknowledge receipt and optionally add a valuation signal based on the handle only.",
                why: "Why this matters: Your valuation signal is not an offer or advice — it’s a credibility signal. For the creator, early signals like this can help turn a private idea into a real asset."
            },
            request_more: {
                title: "Request more disclosure (private follow-up)",
                sub: "Send a private follow-up request. The sender may share more details or decline.",
                why: "Why this matters: This opens a private follow-up without obligation. You’re not committing — just asking for more context. For the creator, it signals genuine interest."
            },
            decline: {
                title: "Decline (no response recorded)",
                sub: "No response will be recorded or shared. You can close this page.",
                why: "Why this matters: Declining records nothing and creates no association. It simply signals that now isn’t the right time."
            }
        };
        return texts[c as keyof typeof texts] || texts.ack;
    };

    const currentText = getDynamicText(choice);

    const showToast = (text: string, kind: 'ok' | 'warn' | 'bad' = 'ok') => {
        setToast({ text, kind });
        setTimeout(() => setToast(null), 4200);
    };

    const handleSubmit = async () => {
        // Prepare payload
        // Prepare payload
        const payload = {
            record_id: inviteData?.record_id,
            invite_token: inviteData?.token, // Use real token
            type: choice,
            responder_name: inviteData?.recipient_name || "Anonymous", // Use invite name if available
            responder_role: inviteData?.role_label || "Invitee",
            val_bucket: valBucket,
            val_exact: valExact,
            note: moreText || (choice === 'ack_value' ? basis : null)
        };

        try {
            const res = await fetch('/api/traction/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                showToast("Response recorded safely on-chain (simulated).", "ok");
            } else {
                showToast("Error recording response.", "bad");
            }
        } catch (e) {
            showToast("Network error.", "bad");
        }
    };

    const handleDecline = () => {
        setChoice('decline');
        showToast("Declined (mock). No acknowledgment recorded.", "warn");
    };

    const copyHash = async () => {
        try {
            await navigator.clipboard.writeText("7a9f2b9f8c3d0a1d2b3c4d5e6f77889900aabbccddeeff00112233445566e4c2");
            showToast("Copied Record ID (mock).");
        } catch {
            showToast("Copy failed.", "bad");
        }
    };


    return (
        <div className="ack-body">
            <div className="ack-wrap">
                <div className="ack-top">
                    <div className="ack-brand">
                        <div className="ack-logo" aria-hidden="true"></div>
                        <div>
                            <div style={{ fontWeight: 700 }}>Proof-of-Thought</div>
                            <div style={{ fontSize: '12px', color: 'var(--ack-muted)', marginTop: '2px' }}>Acknowledgment Invite (Mock)</div>
                        </div>
                    </div>
                    <div className="ack-badge">Recipient View</div>
                </div>

                <div className="ack-card">
                    <h1 className="ack-h1">{currentText.title}</h1>
                    <p className="ack-sub">{currentText.sub}</p>
                    <p className="ack-why">{currentText.why}</p>

                    <div className="ack-grid">
                        {/* LEFT: Record Context */}
                        <div className="ack-panel">
                            <div className="ack-row" style={{ marginBottom: '10px' }}>
                                <span className="ack-pill"><span className="ack-dot"></span> Genesis record sealed</span>
                                <span className="ack-pill"><span className="ack-dot warn"></span> Content private by default</span>
                            </div>

                            <div className="ack-k">From</div>
                            <div className="ack-v"><b>{inviteData?.creator_name || "The Creator"}</b></div>

                            <div style={{ height: '10px' }}></div>
                            <div className="ack-k">Sender’s handle (title + one-liner)</div>
                            <div className="ack-v">
                                <b>{inviteData?.custom_title || recordData?.title || "Untitled"}</b> — “{inviteData?.custom_summary || "..."}”
                            </div>

                            <div className="ack-divider"></div>

                            <div className="ack-k">Record ID (hash commitment)</div>
                            <div className="ack-v ack-mono">
                                {recordData?.registry_no ? `R-${String(recordData.registry_no).padStart(16, '0')}` : "R-..."}
                            </div>
                            <div className="ack-v ack-mono" style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                                Hash: {recordData?.content_hash ? (recordData.content_hash.substring(0, 16) + "...") : "..."}
                            </div>

                            <div style={{ height: '10px' }}></div>
                            <div className="ack-k">Timestamp attestation</div>
                            <div className="ack-v ack-mono">
                                {recordData?.created_at ? new Date(recordData.created_at).toLocaleString() : "..."}
                            </div>

                            <div className="ack-divider"></div>

                            <div className="ack-lockline">
                                <div aria-hidden="true">🔒</div>
                                <div>
                                    <b>Privacy note:</b> This is not an endorsement and not a “crime witness” role.
                                    You can acknowledge receipt, optionally add a valuation signal from the handle, or request more disclosure.
                                </div>
                            </div>

                            <div className="ack-actions">
                                <button className="ack-btn ghost" onClick={copyHash}>Copy Record ID</button>
                            </div>
                        </div>


                        {/* RIGHT: Response Options */}
                        <div className="ack-panel">
                            <div className="ack-k">Choose your response</div>

                            <div className="ack-radio-group" role="radiogroup">
                                <label className="ack-choice">
                                    <input type="radio" name="resp" value="ack" checked={choice === 'ack'} onChange={(e) => setChoice(e.target.value)} />
                                    <div>
                                        <b>Acknowledge you were made aware</b>
                                        <p className="ack-hint">I confirm I received this invite and saw the record identifiers and timestamp.</p>
                                    </div>
                                </label>

                                <label className="ack-choice">
                                    <input type="radio" name="resp" value="ack_value" checked={choice === 'ack_value'} onChange={(e) => setChoice(e.target.value)} />
                                    <div>
                                        <b>Acknowledge + provide a valuation signal</b>
                                        <p className="ack-hint">A lightweight credibility signal. Range is fine.</p>
                                    </div>
                                </label>

                                <label className="ack-choice">
                                    <input type="radio" name="resp" value="request_more" checked={choice === 'request_more'} onChange={(e) => setChoice(e.target.value)} />
                                    <div>
                                        <b>Request more disclosure</b>
                                        <p className="ack-hint">Ask the sender for a bit more context privately (they can decline).</p>
                                    </div>
                                </label>

                                <label className="ack-choice">
                                    <input type="radio" name="resp" value="decline" checked={choice === 'decline'} onChange={(e) => setChoice(e.target.value)} />
                                    <div>
                                        <b>Decline</b>
                                        <p className="ack-hint">No action taken.</p>
                                    </div>
                                </label>
                            </div>

                            {/* Valuation Panel */}
                            {choice === 'ack_value' && (
                                <div style={{ marginTop: '12px' }}>
                                    <div className="ack-k">Valuation signal (optional)</div>
                                    <div style={{ marginTop: '10px' }}>
                                        <select className="ack-select" value={basis} onChange={(e) => setBasis(e.target.value)}>
                                            <option>Based on handle only</option>
                                            <option>Based on handle + follow-up</option>
                                            <option>Not sure / gut feel</option>
                                        </select>
                                    </div>

                                    <div style={{ marginTop: '10px', display: 'grid', gap: '10px' }}>
                                        <div className="ack-k" style={{ marginTop: '4px' }}>Pick a quick range</div>
                                        {['$0', '$1–$99', '$100–$999', '$1k–$9.9k', '$10k–$99k', '$100k–$999k', '$1M+'].map(val => (
                                            <label key={val} className="ack-choice">
                                                <input
                                                    type="radio"
                                                    name="valBucket"
                                                    value={val}
                                                    checked={valBucket === val}
                                                    onChange={(e) => {
                                                        setValBucket(e.target.value);
                                                        setValExact(''); // Clear custom input if radio picked
                                                    }}
                                                />
                                                <div><b>{val}</b></div>
                                            </label>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: '12px' }}>
                                        <div className="ack-k">Optional: exact number or custom range</div>
                                        <input
                                            className="ack-input"
                                            type="text"
                                            placeholder="e.g., $25k or $10k–$50k"
                                            value={valExact}
                                            onChange={(e) => {
                                                setValExact(e.target.value);
                                                if (e.target.value) setValBucket(''); // Clear radio if typing custom
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Request More Panel */}
                            {choice === 'request_more' && (
                                <div style={{ marginTop: '12px' }}>
                                    <div className="ack-k">Request more disclosure</div>
                                    <textarea className="ack-textarea" placeholder="Example: Can you share one more sentence...?" value={moreText} onChange={(e) => setMoreText(e.target.value)}></textarea>
                                </div>
                            )}


                            <div className="ack-actions">
                                <button className="ack-btn primary" onClick={handleSubmit}>Submit response</button>
                                <button className="ack-btn danger" onClick={handleDecline}>Decline</button>
                            </div>

                            {toast && (
                                <div className={`ack-toast show ${toast.kind}`}>
                                    {toast.text}
                                </div>
                            )}

                            <div className="ack-foot">
                                By submitting, you’re only confirming what you saw on this page.
                                No NDA is created. The sender’s notice discourages further disclosure.
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
