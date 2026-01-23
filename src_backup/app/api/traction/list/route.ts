
import { NextRequest, NextResponse } from 'next/server';
import { dbGetRecentSubmissions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const idsParam = searchParams.get('ids');
        const ids = idsParam ? idsParam.split(',').filter(Boolean) : undefined;

        const records = dbGetRecentSubmissions(20, ids);
        return NextResponse.json({ records });
    } catch (e) {
        console.error("Failed to fetch recent records", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
