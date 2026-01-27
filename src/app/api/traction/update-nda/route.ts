import { NextRequest, NextResponse } from 'next/server';
import { dbUpdateRecordNDA, dbGetSubmission } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { record_id, enabled, text } = await req.json();

        if (!record_id) {
            return NextResponse.json({ error: 'Missing record_id' }, { status: 400 });
        }

        const record = dbGetSubmission(record_id);
        if (!record) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        dbUpdateRecordNDA(record_id, !!enabled, text || "");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("NDA Update Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
