import { NextRequest, NextResponse } from 'next/server';
import { dbCreateAccessToken, dbGetSubmission } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { record_id, label, duration_hours, disclosure_type } = body;

        if (!record_id) {
            return NextResponse.json({ error: "Missing record_id" }, { status: 400 });
        }

        // MVP Auth Check: Ensure record exists.
        // Real app: Check session cookie matches record owner.
        const record = dbGetSubmission(record_id);
        if (!record) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        const token = dbCreateAccessToken(record_id, label || "Anonymous", duration_hours || 72, disclosure_type || "full");
        const origin = new URL(req.url).origin;
        const link = `${origin}/v/${record.verify_slug || record.id}?access_token=${token}`;

        return NextResponse.json({ success: true, token, link });

    } catch (e) {
        console.error("Link gen error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
