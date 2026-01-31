import { NextRequest, NextResponse } from 'next/server';
import { dbSetTieredContent } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { record_id, pitch_text, summary_text } = body;

        if (!record_id) {
            return NextResponse.json({ error: "Missing record_id" }, { status: 400 });
        }

        // TODO: In real app, verify session owner owns this record

        dbSetTieredContent(record_id, pitch_text, summary_text);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Update content error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
