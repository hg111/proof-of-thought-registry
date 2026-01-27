
import { NextRequest, NextResponse } from 'next/server';
import { dbGetInvite, dbGetSubmission } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('t');

    if (!token) {
        return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // 1. Fetch Invite
    const invite = dbGetInvite(token);
    if (!invite) {
        return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
    }

    if (invite.is_used === 1) {
        // Optionally block if single-use, but for now we might just warn
    }

    // 2. Fetch Linked Record (for contextual fields like timestamp hash, etc.)
    const record = dbGetSubmission(invite.record_id);

    return NextResponse.json({
        valid: true,
        invite: {
            ...invite,
            // Fallback for UI if custom fields weren't set (legacy invites)
            custom_title: invite.custom_title || record?.title || "Untitled",
            custom_summary: invite.custom_summary || "No summary provided.",
        },
        record: record ? {
            id: record.id,
            registry_no: record.registry_no,
            created_at: record.created_at,
            content_hash: record.content_hash,
            // Do NOT send canonical_text or sensitive fields
        } : null
    });
}
