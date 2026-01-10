"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";

// Custom helper to format as UTC explicitly, avoiding browser local timezone shifts.
function safeFormat(dateStr: string | null, fmt: string): string {
    if (!dateStr) return "Pending";
    const d = new Date(dateStr);
    if (!isValid(d)) return dateStr;

    // We assume input dateStr is an ISO UTC string (e.g. from DB)
    // d.getUTCHours() gives the correct UTC hour.
    // date-fns format(d) uses d.getHours() (Local).
    // So we manually construct the format we need.

    // Helper pad
    const p = (n: number) => n.toString().padStart(2, '0');

    const yyyy = d.getUTCFullYear();
    const MM = p(d.getUTCMonth() + 1);
    const dd = p(d.getUTCDate());
    const HH = p(d.getUTCHours());
    const mm = p(d.getUTCMinutes());
    const ss = p(d.getUTCSeconds());

    if (fmt === "yyyy-MM-dd HH:mm") {
        // Requested: 2026.01.10 • 03:43:37 UTC
        // We ignore the exact fmt string args and just return the standardized display format
        // But we must respect if the caller wants ONLY date? 
        // Let's stick to the requested "full format".
        return `${yyyy}.${MM}.${dd} • ${HH}:${mm}:${ss} UTC`;
    }
    if (fmt === "yyyy-MM-dd") {
        // Just date? User didn't specify, but let's keep it consistent.
        return `${yyyy}.${MM}.${dd}`;
    }

    return `${yyyy}.${MM}.${dd} • ${HH}:${mm}:${ss} UTC`;
}


type PublicChain = {
    chain_id: string;
    genesis_certificate_id: string;
    genesis_issued_at_utc: string | null;
    sealed_count: number;
    last_seal_at_utc: string | null;
    custody_status: string;
};

type Anchor = {
    root_hash_hex: string;
    network: string;
    status: string;
    txid: string | null;
    explorer_url: string | null;
};

export default function PublicLedgerPage() {
    const [chains, setChains] = useState<PublicChain[]>([]);
    const [anchor, setAnchor] = useState<Anchor | null>(null);
    const [loading, setLoading] = useState(true);

    // Pagination / Sort state
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(50);
    const [sort, setSort] = useState<"genesis_desc" | "genesis_asc" | "lastseal_desc">("lastseal_desc");

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, sort]);

    async function fetchData() {
        setLoading(true);
        try {
            const res = await fetch(`/api/public-ledger?page=${page}&limit=${limit}&sort=${sort}`);
            const data = await res.json();
            setChains(data.chains);
            setTotal(data.total);
            if (data.anchor) setAnchor(data.anchor);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
            {/* Header */}
            <header className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/" className="font-bold tracking-tight text-xl hover:opacity-70 transition-opacity">
                        Proof of Thought™
                    </Link>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium text-gray-600">Public Ledger</span>
                </div>
                <div className="text-sm font-mono text-gray-500">
                    v1.0.0
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 md:p-12">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Public Chain Ledger
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl text-balance">
                        A transparency log of all publicly visible Proof-of-Thought chains.
                        No private content or keys are disclosed here.
                    </p>
                </div>

                {/* Controls */}
                {/* Controls */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <label className="small">Sort by:</label>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as any)}
                            className="input"
                            style={{ padding: '4px 8px', width: 'auto' }}
                        >
                            <option value="genesis_desc">Newest Chains First</option>
                            <option value="genesis_asc">Oldest Chains First</option>
                            <option value="lastseal_desc">Recently Updated</option>
                        </select>
                    </div>
                    <div className="small mono">
                        Total Chains: {total}
                    </div>
                </div>

                {/* Table Container - Scrollable */}
                {/* Table Container - Scrollable */}
                <div className="ledgerContainer">
                    <div className="ledgerScroll">
                        <table className="ledgerTable">
                            <thead>
                                <tr>
                                    <th className="ledgerTh">Chain ID</th>
                                    <th className="ledgerTh">Genesis Timestamp</th>
                                    <th className="ledgerTh col-center"># of Sealed Thoughts</th>
                                    <th className="ledgerTh">Last Seal</th>
                                    <th className="ledgerTh col-right">Custody Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="ledgerTd col-center" style={{ fontStyle: 'italic' }}>
                                            Loading ledger data...
                                        </td>
                                    </tr>
                                ) : chains.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="ledgerTd col-center">
                                            No public chains found.
                                        </td>
                                    </tr>
                                ) : (
                                    chains.map((chain) => (
                                        <tr key={chain.chain_id} className="ledgerRow">
                                            <td className="ledgerTd mono-id">
                                                {chain.chain_id}
                                            </td>
                                            <td className="ledgerTd">
                                                {safeFormat(chain.genesis_issued_at_utc, "yyyy-MM-dd HH:mm")}
                                            </td>
                                            <td className="ledgerTd col-center">
                                                {chain.sealed_count}
                                            </td>
                                            <td className="ledgerTd">
                                                {chain.last_seal_at_utc ? safeFormat(chain.last_seal_at_utc, "yyyy-MM-dd HH:mm").replace(" UTC", "") : "—"}
                                            </td>
                                            <td className="ledgerTd col-right">
                                                <span className={`statusBadge ${chain.custody_status === 'Active' ? 'statusActive' : 'statusInactive'}`}>
                                                    {chain.custody_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="paginationBar">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            style={{ opacity: page === 1 ? 0.3 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13 }}
                        >
                            &larr; Previous
                        </button>
                        <span className="small">
                            Page {page} of {Math.max(1, totalPages)}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                            style={{ opacity: page >= totalPages ? 0.3 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13 }}
                        >
                            Next &rarr;
                        </button>
                    </div>
                </div>

                {/* Anchor Stub */}
                <div className="mt-16 pt-12 border-t border-gray-200">
                    <h2 className="text-2xl font-bold tracking-tight mb-6">Latest Blockchain Anchor</h2>

                    <div className="bg-neutral-900 text-white rounded-lg p-6 font-mono text-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                            <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                            </svg>
                        </div>

                        {anchor ? (
                            <div className="space-y-4 max-w-3xl relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Network</div>
                                        <div className="font-semibold text-green-400">{anchor.network.toUpperCase()}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Status</div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${anchor.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                            {anchor.status.toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Merkle Root</div>
                                        <div className="break-all text-gray-300">{anchor.root_hash_hex}</div>
                                    </div>
                                    {anchor.txid && (
                                        <div className="md:col-span-2">
                                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Transaction ID</div>
                                            <a href={anchor.explorer_url ?? "#"} target="_blank" rel="noreferrer" className="break-all text-blue-400 hover:text-blue-300 underline underline-offset-2 decoration-blue-400/30">
                                                {anchor.txid}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-500 italic">
                                No anchor data available yet.
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
