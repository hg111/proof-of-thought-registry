
import { NextRequest, NextResponse } from 'next/server';
import { dbGetRecentSubmissions } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const records = dbGetRecentSubmissions(20);
        return NextResponse.json({ records });
    } catch (e) {
        console.error("Failed to fetch recent records", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
