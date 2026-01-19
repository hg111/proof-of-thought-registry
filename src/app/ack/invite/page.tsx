'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isTractionUIEnabled } from '@/lib/flags';
import '../ack.css';

export default function AckInvitePage() {
    const router = useRouter();
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Form State
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [category, setCategory] = useState('');
    const [askAck, setAskAck] = useState(true);
    const [askVal, setAskVal] = useState(true);
    const [askComment, setAskComment] = useState(false);
    const [recName, setRecName] = useState('');
    const [recEmail, setRecEmail] = useState('');
    const [message, setMessage] = useState('');
    const [expire, setExpire] = useState(true);
    const [singleUse, setSingleUse] = useState(true);
    const [anon, setAnon] = useState(false);

    // Dynamic Record Data
    const [recordId, setRecordId] = useState<string | null>(null);
    const [record, setRecord] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            setRecordId(params.get('record_id'));

            // Handle "Grant Access" Action
            if (params.get('action') === 'grant') {
                const email = params.get('email');
                if (email) setRecEmail(email);

                setMessage("Here is the access link you requested.");
                setRecName("Requester"); // Placeholder
                // Ensure form defaults are appropriate?
            }
        }
    }, []);

    // Fetch Record Details
    useEffect(() => {
        if (!recordId) return;
        fetch(`/api/traction/record?record_id=${recordId}`)
            .then(res => res.json())
            .then(data => {
                if (data.record) setRecord(data.record);
            })
            .catch(err => console.error(err));
    }, [recordId]);

    // Output State
    const [generated, setGenerated] = useState<{ link: string, text: string, token: string } | null>(null);
    const [copyStatus, setCopyStatus] = useState('Copy message');
    const [sendLoading, setSendLoading] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    // Toast Timer
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

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

    if (!enabled) return null;

    // Logic
    const handleGenerate = async () => {
        try {
            // Step 1: Generate Token Only (No Email)
            const res = await fetch('/api/traction/invite/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    record_id: recordId,
                    creator_name: "The Creator",
                    role_label: "Invitee",
                    title: title.trim(),
                    summary: summary.trim(),
                    reason: message.trim(),
                    message: message.trim(),
                    custom_title: title.trim(),
                    custom_summary: summary.trim(),
                    recipient_name: recName.trim(),
                    // recipient_email: intentionally omitted to prevent auto-send
                })
            });
            const data = await res.json();

            if (!data.success) {
                alert("Error generating link");
                return;
            }

            const link = `${window.location.origin}/ack/recipient?t=${data.token}`;

            // Build the copy/paste text
            const t = title.trim() || "(Untitled)";
            const s = summary.trim() || "(No summary provided)";
            const who = recName.trim() ? `Hi ${recName.trim()},` : "Hi —";
            const noteLine = message.trim() ? `Note from sender: "${message.trim()}"\n\n` : "";

            const text = `${who}

I wanted to run an idea by you - below is a one-line blurb:

Handle: ${t}
Summary: ${s}

${noteLine}I’ve recorded this idea for my own reference in case it becomes relevant later. If you’re open to it, I’d appreciate a quick signal - even just acknowledging you saw it.

You can respond here (takes ~10 seconds):
${link}`;
            setGenerated({ link, text, token: data.token });

        } catch (e) {
            console.error(e);
            alert("Network error");
        }
    };

    const handleSendNow = async () => {
        if (!generated || !recEmail.trim()) {
            alert("Please enter a recipient email to send.");
            return;
        }
        setSendLoading(true);
        try {
            const res = await fetch('/api/traction/invite/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: generated.token,
                    recipient_email: recEmail.trim(),
                    message: message.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                setToast("Email sent successfully ✓");
            } else {
                alert("Failed to send: " + (data.error || "Unknown"));
            }
        } catch (e) {
            console.error(e);
            alert("Network error sending email");
        } finally {
            setSendLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!generated) return;
        try {
            await navigator.clipboard.writeText(generated.text);
            setCopyStatus("Copied ✓");
            setTimeout(() => setCopyStatus("Copy message"), 1100);
        } catch {
            setCopyStatus("Copy failed");
        }
    };

    const handleReset = () => {
        setTitle('');
        setSummary('');
        setCategory('');
        setAskAck(true);
        setAskVal(true);
        setAskComment(false);
        setRecName('');
        setRecEmail('');
        setMessage('');
        setExpire(true);
        setSingleUse(true);
        setAnon(false);
        setGenerated(null);
        setToast(null);
    };


    return (
        <div className="ack-body">
            {toast && <div className="ack-toast">{toast}</div>}
            <div className="ack-wrap">
                <div className="ack-top">
                    <div className="ack-brand">
                        <div className="ack-logo" aria-hidden="true"></div>
                        <div>
                            <h1 style={{ fontSize: '14px', margin: 0 }}>Proof-of-Thought</h1>
                            <div className="ack-pill"><span className="ack-dot"></span> Ack Invite (mock)</div>
                        </div>
                    </div>
                    <div className="ack-pill">
                        <span className="ack-mono">pot_record_id</span>
                        <span style={{ opacity: 0.9, marginLeft: '6px' }}>
                            {record?.registry_no ? `R-${String(record.registry_no).padStart(16, '0')}` : "R-..."}
                        </span>
                    </div>
                </div>

                <div className="ack-card">
                    <header style={{ padding: '16px 16px 0' }}>
                        <div className="ack-kicker">Create invite</div>
                        <h2 className="ack-h2">Acknowledge you didn’t see the idea, but were made aware of it (optional valuation)</h2>
                        <p className="ack-sub">Recipient reviews a short handle (title + 1–2 sentences). The sealed underlying content is not shared.</p>
                    </header>

                    <div style={{ padding: '16px' }}>
                        <div className="ack-section">
                            <div className="ack-row">
                                <div>
                                    <label className="ack-label">Handle title</label>
                                    <input className="ack-input" type="text" maxLength={80} placeholder="e.g., Proof-of-Thought..." value={title} onChange={(e) => setTitle(e.target.value)} />
                                    <div className="ack-hint">{title.length}/80</div>
                                </div>
                                <div>
                                    <label className="ack-label">Category (optional)</label>
                                    <select className="ack-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                                        <option value="">Select…</option>
                                        <option>Invention / IP</option>
                                        <option>Research finding</option>
                                        <option>Creative concept</option>
                                        <option>Product idea</option>
                                        <option>Other</option>
                                    </select>
                                    <div className="ack-hint">Helps the recipient frame a valuation.</div>
                                </div>
                            </div>
                            <div style={{ marginTop: '12px' }}>
                                <label className="ack-label">Handle summary (1–2 sentences)</label>
                                <textarea className="ack-textarea" maxLength={240} placeholder="High-level description without revealing secrets." value={summary} onChange={(e) => setSummary(e.target.value)}></textarea>
                                <div className="ack-hint">{summary.length}/240</div>
                            </div>
                        </div>

                        <div className="ack-section">
                            <label className="ack-label">Ask for</label>
                            <div className="ack-chips">
                                <label className="ack-chip"><input type="checkbox" checked={askAck} onChange={(e) => setAskAck(e.target.checked)} /> “Made aware” acknowledgment</label>
                                <label className="ack-chip"><input type="checkbox" checked={askVal} onChange={(e) => setAskVal(e.target.checked)} /> Valuation signal</label>
                                <label className="ack-chip"><input type="checkbox" checked={askComment} onChange={(e) => setAskComment(e.target.checked)} /> Short comment</label>
                            </div>
                            <div className="ack-hint">
                                “Made aware” = “I reviewed the handle. I did not receive the sealed underlying content.”
                            </div>
                        </div>

                        <div className="ack-section">
                            <div className="ack-row">
                                <div>
                                    <label className="ack-label">Recipient name (optional)</label>
                                    <input className="ack-input" type="text" placeholder="e.g. Dr. Jane Doe" value={recName} onChange={(e) => setRecName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="ack-label">Recipient email (manual send)</label>
                                    <input className="ack-input" type="email" placeholder="name@domain.com" value={recEmail} onChange={(e) => setRecEmail(e.target.value)} />
                                </div>
                            </div>
                            <div style={{ marginTop: '12px' }}>
                                <label className="ack-label">Message (optional)</label>
                                <textarea className="ack-textarea" maxLength={360} placeholder="2-4 lines: why them..." value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
                            </div>
                        </div>

                        <div className="ack-section">
                            <div className="ack-chips">
                                <label className="ack-toggle"><input type="checkbox" checked={expire} onChange={e => setExpire(e.target.checked)} /> Expire link in 7 days</label>
                                <label className="ack-toggle"><input type="checkbox" checked={singleUse} onChange={e => setSingleUse(e.target.checked)} /> Single response max</label>
                                <label className="ack-toggle"><input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} /> Allow private response</label>
                            </div>
                            <div className="ack-callout" style={{ marginTop: '12px' }}>
                                <b>Plain English:</b> This is not an endorsement and not a “witness” role. It’s a recorded response confirming the recipient was made aware of the handle linked to sealed record <span className="ack-mono">R-0000…1</span>.
                            </div>
                        </div>

                        <div className="ack-section">
                            <div className="ack-actions">
                                <button className="ack-btn primary" onClick={handleGenerate}>
                                    Generate invite link
                                </button>
                                <button className="ack-btn" onClick={handleReset}>Reset</button>
                            </div>

                            {generated && (
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--ack-line)' }}>
                                    <label className="ack-label">Invite link (mock)</label>
                                    <div className="ack-mono">{generated.link}</div>
                                    <div style={{ marginTop: '10px' }}>
                                        <label className="ack-label">Copy/paste message (mock)</label>
                                        <textarea
                                            readOnly
                                            className="ack-textarea"
                                            style={{ height: '300px', fontFamily: 'monospace', fontSize: '13px' }}
                                            value={generated.text}
                                        />
                                        <div className="ack-actions" style={{ marginTop: '10px' }}>
                                            <button className="ack-btn ghost" onClick={handleCopy}>{copyStatus}</button>

                                            {/* Send Now Button */}
                                            {recEmail.trim() && (
                                                <button
                                                    className="ack-btn primary"
                                                    onClick={handleSendNow}
                                                    disabled={sendLoading}
                                                    style={{ background: '#22c55e', borderColor: '#22c55e' }}
                                                >
                                                    {sendLoading ? 'Sending...' : 'Send Now'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Live Preview */}
                        <div className="ack-section" style={{ paddingBottom: 0 }}>
                            <div className="ack-kicker">Live preview</div>
                            <div className="ack-divider"></div>
                            <div className="ack-callout" style={{ borderColor: 'rgba(255,255,255,.10)', background: 'rgba(255,255,255,.03)' }}>
                                <div className="ack-kicker" style={{ marginBottom: '6px' }}>Handle shown to recipient</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>{title || "—"}</div>
                                <div style={{ color: 'var(--ack-muted)', fontSize: '13px', lineHeight: 1.45 }}>{summary || "Add a title + 1–2 sentence summary."}</div>
                                <div className="ack-divider"></div>
                                <div className="ack-chips">
                                    {askAck && <span className="ack-chip">Made-aware acknowledgment</span>}
                                    {askVal && <span className="ack-chip">Valuation signal</span>}
                                    {askComment && <span className="ack-chip">Short comment</span>}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
