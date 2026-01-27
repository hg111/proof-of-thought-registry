
import { NextRequest, NextResponse } from 'next/server';
import { dbGetSignalsForRecord } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const record_id = searchParams.get('record_id');

    if (!record_id) {
        return NextResponse.json({ error: "Missing record_id" }, { status: 400 });
    }

    // In a real app, verify the session/user owns this record.
    // For MVP demo, returns data publicly if you have the ID.
    const { dbGetAccessLogs, dbGetAccessTokens, dbGetInvitesForRecord } = await import('@/lib/db');

    const signals = dbGetSignalsForRecord(record_id);
    const accessLogs = dbGetAccessLogs(record_id);
    const tokens = dbGetAccessTokens(record_id);
    const invites = dbGetInvitesForRecord(record_id);

    // Merge logs + invites into a single activity stream
    const combinedLogs = [
        ...accessLogs.map(l => ({ ...l, type: 'view', atMs: l.accessed_at })),
        ...invites.map(i => ({
            id: `inv-${i.token}`,
            type: 'invite',
            recipient_name: i.recipient_name || 'Recipient',
            role_label: i.role_label,
            accessed_at: new Date(i.created_at).getTime(), // Normalize to number for sorting
            atMs: new Date(i.created_at).getTime(),
            ip_address: 'Invites sent', // Mock for UI compat if needed
            token_label: i.recipient_name ? `${i.recipient_name}` : `Invited via email`
        }))
    ].sort((a: any, b: any) => b.atMs - a.atMs);

    // Grouping logic could happen here, or client side. Returning raw mixed list for now.

    console.log(`[API] Signals for ${record_id}: ${signals.length}`);
    return NextResponse.json({ signals, logs: combinedLogs, tokens });
}
