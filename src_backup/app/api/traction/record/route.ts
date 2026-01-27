
import { NextRequest, NextResponse } from 'next/server';
import { dbGetSubmission } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get('record_id');

    if (!recordId) {
        return NextResponse.json({ error: 'Missing record_id' }, { status: 400 });
    }

    try {
        const record = dbGetSubmission(recordId);

        if (!record) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        // Return the full record (mask sensitive fields if needed, but for owner view it's fine)
        return NextResponse.json({ record });
    } catch (error) {
        console.error("Error fetching record:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
