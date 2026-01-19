
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

    const signals = dbGetSignalsForRecord(record_id);
    console.log(`[API] Signals for ${record_id}: ${signals.length}`);
    return NextResponse.json({ signals });
}
