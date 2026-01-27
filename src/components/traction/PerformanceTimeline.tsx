'use client';

import React, { useEffect, useRef, useState } from 'react';
import '../../app/traction/traction.css';

// --- Types ---
type EventType = 'sealed' | 'invite' | 'ack' | 'val';

interface TimelineEvent {
    type: EventType;
    label: string;
    at: Date;
    data?: any;
}

// --- Helpers ---
function addMonths(date: Date, n: number): Date {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + n);
    if (d.getDate() < day) d.setDate(0);
    return d;
}

function clamp(n: number, a: number, b: number): number {
    return Math.max(a, Math.min(b, n));
}

function pctBetween(date: Date, min: Date, max: Date): number {
    const t = date.getTime();
    const a = min.getTime();
    const b = max.getTime();
    const span = Math.max(1, b - a);
    return ((t - a) / span) * 100;
}

// Format helpers
const fmtMonth = (d: Date) => d.toLocaleString("en-US", { month: "short" });

// --- Config ---
const HORIZON_MONTHS = 12;
const SAFE_GUTTER_PX = 22;

// --- Mock Data Generator (Dynamic) ---
// Generates data ending "yesterday"
function generateMockEvents(baseDate: Date): TimelineEvent[] {
    const t0 = baseDate.getTime();
    const H = 60 * 60 * 1000;
    const D = 24 * H;
    return [
        { type: "sealed", label: "Sealed", at: new Date(t0) },
        { type: "invite", label: "Invites", at: new Date(t0 + 2.4 * H) },   // same day
        { type: "ack", label: "Ack", at: new Date(t0 + 1.9 * D) },   // day ~2
        { type: "val", label: "Valuation", at: new Date(t0 + 3.2 * D) },   // day ~3
        { type: "ack", label: "Ack", at: new Date(t0 + 4.6 * D) },   // day ~5
        { type: "val", label: "Valuation", at: new Date(t0 + 5.5 * D) },   // day ~6
    ];
}

export default function PerformanceTimeline({ signals = [], recordCreated }: { signals?: any[], recordCreated?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rulerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    // Dynamic Base Date: Start 7 days ago so mocks end yesterday/today
    const [baseStart] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7); // Start week ago
        return d;
    });

    // Merge Real Data
    const events = React.useMemo(() => {
        const mocks = generateMockEvents(baseStart);

        // Convert signals to events
        const realEvents: TimelineEvent[] = signals.map(s => ({
            type: s.type === 'ack_value' ? 'val' : 'ack',
            label: s.responder_name || "Anonymous",
            at: new Date(s.created_at),
            data: s
        }));

        // Add Real Sealed Event if available
        if (recordCreated) {
            // Remove mock sealed if we have real one, or just mix them? 
            // Let's keep mocks for "Demo" look, but ensure real data overlays.
            realEvents.push({ type: 'sealed', label: 'Sealed (Real)', at: new Date(recordCreated) });
        }

        return [...mocks, ...realEvents].sort((a, b) => a.at.getTime() - b.at.getTime());
    }, [baseStart, signals, recordCreated]);

    const baseEnd = addMonths(baseStart, HORIZON_MONTHS);
    const baseSpanMs = Math.max(1, baseEnd.getTime() - baseStart.getTime());

    // State for zoom/pan
    // 12 months horizon. Default to showing ~1 week?
    // baseSpanMs is ~12 months (~365 days).
    // To show 7 days: 365 / 7 ≈ 52 zoom level.
    const [zoom, setZoom] = useState(50);
    const [panPx, setPanPx] = useState(0);

    const dragState = useRef({
        isDragging: false,
        startX: 0,
        startPan: 0,
    });

    // Re-render ruler on zoom/pan/resize
    useEffect(() => {
        const rulerEl = rulerRef.current;
        if (!rulerEl) return;

        // Prevent page scroll when wheeling over the ruler
        const preventDefaultWheel = (e: WheelEvent) => {
            e.preventDefault();
        };
        rulerEl.addEventListener('wheel', preventDefaultWheel, { passive: false });

        const render = () => {
            if (trackRef.current) {
                trackRef.current.innerHTML = '';
            } else {
                return;
            }
            const track = trackRef.current;

            const inset = 28;
            const w = rulerEl.clientWidth;
            const usable = Math.max(1, w - inset * 2);

            // Compute Domain
            const MIN_SPAN_MS = 12 * 60 * 60 * 1000; // Min zoom: 12 hours
            const MAX_SPAN_MS = baseSpanMs;
            const visibleSpanMs = clamp(baseSpanMs / zoom, MIN_SPAN_MS, MAX_SPAN_MS);

            // Pan bounds
            const effectivePanPx = clamp(panPx, 0, usable);
            const panFrac = usable <= 1 ? 0 : (effectivePanPx / usable);
            const centerMs = baseStart.getTime() + panFrac * baseSpanMs;

            let domainStart = new Date(centerMs - visibleSpanMs / 2);
            let domainEnd = new Date(centerMs + visibleSpanMs / 2);

            if (domainStart < baseStart) {
                domainStart = new Date(baseStart);
                domainEnd = new Date(baseStart.getTime() + visibleSpanMs);
            }
            if (domainEnd > baseEnd) {
                domainEnd = new Date(baseEnd);
                domainStart = new Date(baseEnd.getTime() - visibleSpanMs);
            }

            // Render helpers
            const innerW = Math.max(1, usable - SAFE_GUTTER_PX * 2);
            const toX = (pct: number) => SAFE_GUTTER_PX + innerW * (pct / 100);

            // 1. Horizon Line
            const line = document.createElement("div");
            Object.assign(line.style, {
                position: "absolute",
                left: "0px",
                right: "0px",
                top: "10px",
                height: "2px",
                background: "rgba(255,255,255,.35)" // Brighter (was .25)
            });
            track.appendChild(line);

            // 2. Ticks
            const spanDays = visibleSpanMs / (24 * 60 * 60 * 1000);

            // Refined Threshold: Use Month view if showing > 45 days
            const useDays = spanDays <= 45;

            if (!useDays) {
                // MONTH VIEW
                for (let i = 0; i <= HORIZON_MONTHS; i++) {
                    const d = addMonths(baseStart, i);
                    const pct = pctBetween(d, domainStart, domainEnd);
                    if (pct < 0 || pct > 100) continue;

                    const t = document.createElement("div");
                    t.className = "traction-minorTick month"; // Class for visibility
                    t.style.left = `${toX(pct)}px`;
                    t.innerHTML = `
            <div class="mStem" style="height: 19px; background: rgba(255,255,255,0.6);"></div>
            <div class="mLab" style="opacity: 0.9; font-weight: 600; color: #fff; margin-top: -8px;">${fmtMonth(d)}</div>
          `;
                    track.appendChild(t);
                }
            } else {
                // DAY VIEW
                const dayMs = 24 * 60 * 60 * 1000;
                const first = new Date(domainStart); first.setHours(0, 0, 0, 0);
                const last = new Date(domainEnd); last.setHours(0, 0, 0, 0);

                // Label density
                const labelStep = spanDays < 10 ? 1 : spanDays < 20 ? 2 : 5;

                let idx = 0;
                for (let tMs = first.getTime(); tMs <= last.getTime(); tMs += dayMs) {
                    const d = new Date(tMs);
                    const pct = pctBetween(d, domainStart, domainEnd);
                    if (pct < 0 || pct > 100) continue;

                    const showLabel = d.getDate() === 1 || (idx % labelStep === 0);

                    const tick = document.createElement("div");
                    tick.className = "traction-minorTick";
                    tick.style.left = `${toX(pct)}px`;
                    tick.innerHTML = `
            <div class="mStem" style="height: ${showLabel ? '15px' : '12px'}; background: rgba(255,255,255,0.5);"></div>
            <div class="mLab" style="opacity: ${showLabel ? 0.9 : 0}; color: #fff; margin-top: -8px;">${showLabel ? d.getDate() : ''}</div>
          `;
                    track.appendChild(tick);
                    idx++;
                }
            }

            // 3. Events
            const minDx = spanDays <= 14 ? 90 : 60;
            const lanes: number[] = [];
            let lastDateStr = "";

            events.forEach(ev => {
                const pct = pctBetween(ev.at, domainStart, domainEnd);
                if (pct < -5 || pct > 105) return;

                const dateStr = ev.at.toDateString();
                if (lastDateStr && dateStr !== lastDateStr) {
                    lanes.length = 0; // Reset stacking for new day
                }
                lastDateStr = dateStr;

                const x = toX(pct);

                let lane = 0;
                let placed = false;
                for (let l = 0; l < lanes.length; l++) {
                    if (x > lanes[l] + minDx) {
                        lanes[l] = x;
                        lane = l;
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    lane = lanes.length;
                    lanes.push(x);
                }

                const el = document.createElement("div");
                let typeClass = "";
                if (ev.type === 'ack') typeClass = " ack";
                if (ev.type === 'val') typeClass = " val";

                // Highlight real recent events
                const isReal = !!ev.data;
                const isFresh = isReal && (Date.now() - ev.at.getTime() < 24 * 60 * 60 * 1000);

                el.className = `traction-tick${typeClass}${isFresh ? ' fresh' : ''}`;
                el.style.left = `${x}px`;
                el.style.setProperty('--lane', String(lane));

                // Spacing logic (Standardized)
                // Stem 12px, Type 2px, Lab -4px (Total ~25pt shift up)
                const baseStemH = 12;
                const typeMargin = '2px';
                const labStyle = ' style="margin-top: -4px;"';

                el.innerHTML = `
            <div class="stem" style="height: ${baseStemH + (lane * 34)}px"></div>
            <div class="dot"${isFresh ? ' style="box-shadow: 0 0 8px #3b82f6;"' : ''}></div>
            <div class="type" style="margin-top: ${typeMargin};">${ev.type === 'sealed' ? 'Sealed' : ev.type === 'val' ? 'Valuation' : ev.type === 'ack' ? 'Ack..nt' : ev.label}</div>
            <div class="lab"${labStyle}>${ev.at.toLocaleString("en-US", { hour: 'numeric', minute: 'numeric', hour12: false })}</div>
        `;
                track.appendChild(el);
            });
        };

        render();
        const ro = new ResizeObserver(render);
        ro.observe(rulerEl);

        return () => {
            ro.disconnect();
            if (rulerEl) rulerEl.removeEventListener('wheel', preventDefaultWheel);
        };

    }, [zoom, panPx, baseStart, events]); // Add events/baseStart to dep array


    // Event Handlers
    const handleWheel = (e: React.WheelEvent) => {
        // e.preventDefault() is handled by the strict listener above to lock page scroll
        // But we still use the React event for logic if it fires
        const ZOOM_SPEED = 0.001;
        const dy = -e.deltaY;
        const factor = Math.exp(dy * ZOOM_SPEED);
        setZoom(z => clamp(z * factor, 1, 100));
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragState.current = {
            isDragging: true,
            startX: e.clientX,
            startPan: panPx,
        };
        if (rulerRef.current) rulerRef.current.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragState.current.isDragging) return;
        const dx = e.clientX - dragState.current.startX;
        // Simple direct linear drag
        const newPan = dragState.current.startPan - dx;
        setPanPx(newPan);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        dragState.current.isDragging = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
        if (rulerRef.current) rulerRef.current.style.cursor = 'grab';
    };


    return (
        <div className="traction-card">
            <div className="traction-pad">
                <div className="traction-rulerTop">
                    <div className="traction-kicker">Traction timeline</div>
                    <div className="traction-sub traction-micro" style={{ margin: 0 }}>First tick = sealed. New ticks = ack/valuation events.</div>
                </div>

                <div
                    className="traction-rulerLine"
                    id="ruler"
                    ref={rulerRef}
                    onWheel={handleWheel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    <div className="traction-rulerTrack" ref={trackRef}></div>
                </div>

                <div className="traction-foot traction-micro" style={{ marginTop: '10px' }}>
                    Horizon shows month marks; events stack automatically when close together.
                    (Scroll/Trackpad to zoom, Drag to pan)
                </div>
            </div>
        </div>
    );
}
