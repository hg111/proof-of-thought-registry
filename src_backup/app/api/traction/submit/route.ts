
import { NextRequest, NextResponse } from 'next/server';
import { dbInsertSignal } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { record_id, type, responder_name, responder_role, val_bucket, val_exact, note, invite_token } = body;

        // Basic validation
        if (!record_id || !type) {
            console.error("Submit Failed: Missing fields", { record_id, type });
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        console.log("Submit request received:", { record_id, type, responder_name, val_bucket });

        // Logic check: if "invite_token" validation is added later (Phase 3), do it here.
        // For now, it's public/open for the MVP demo.

        const newSignal = {
            id: randomUUID(),
            record_id,
            type,
            responder_name: responder_name || null,
            responder_role: responder_role || null,
            val_bucket: val_bucket || null,
            val_exact: val_exact || null,
            note: note || null,
            created_at: new Date().toISOString()
        };

        dbInsertSignal(newSignal);

        return NextResponse.json({ success: true, id: newSignal.id });

    } catch (e) {
        console.error("Submit Error:", e);
        return NextResponse.json({ error: "Failed to submit signal" }, { status: 500 });
    }
}
