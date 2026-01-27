
import { NextRequest, NextResponse } from 'next/server';
import { dbGetSignalsForRecord } from '@/lib/db';
import Database from "better-sqlite3";
import { config } from "@/lib/config";
import path from "path";

// Quick hack reset for MVP demo purposes
export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const record_id = searchParams.get('record_id');

    if (!record_id) {
        return NextResponse.json({ error: "Missing record_id" }, { status: 400 });
    }

    try {
        const dbPath = path.join(config.dataDir, "registry.sqlite");
        const db = new Database(dbPath);
        db.prepare("DELETE FROM traction_signals WHERE record_id = ?").run(record_id);
        // Also reset invites if needed, but for now just signals
        // db.prepare("DELETE FROM traction_invites WHERE record_id = ?").run(record_id);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
    }
}
