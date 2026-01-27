
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { dbGetSubmission, dbGetSignalsForRecord } from '@/lib/db';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const record_id = searchParams.get('record_id');

    const dbPath = path.join(config.dataDir, "registry.sqlite");

    if (!record_id) {
        return NextResponse.json({
            status: "Debug API Online",
            dbPath,
            env: {
                DATA_DIR: process.env.DATA_DIR || "(not set)",
                NODE_ENV: process.env.NODE_ENV
            }
        });
    }

    const record = dbGetSubmission(record_id);
    const signals = dbGetSignalsForRecord(record_id);

    return NextResponse.json({
        dbPath,
        record_found: !!record,
        record_id,
        signals_count: signals.length,
        signals_raw: signals,
        record_meta: record ? { created_at: record.created_at, title: record.title } : null
    });
}
