
import { NextRequest, NextResponse } from 'next/server';
import { dbGetSubmission, dbInsertSignal } from '@/lib/db';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { record_id, requester_email, request_type } = body;

        if (!record_id || !requester_email || !request_type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Get Record Owner
        const record = dbGetSubmission(record_id);
        if (!record) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        if (!record.holder_email) {
            // Edge case: Old record without owner email? Or just not set.
            // For MVP, we log it but maybe can't send email.
            console.warn("Disclosure request for record without holder_email:", record_id);
            return NextResponse.json({ error: "Owner email not found for this record." }, { status: 400 });
        }

        // 2. Store Signal (So owner sees it in dashboard)
        const signalId = crypto.randomUUID();
        dbInsertSignal({
            id: signalId,
            record_id: record.id,
            type: 'request_access',
            responder_name: requester_email, // Using email as name for now
            responder_role: 'Requester',
            val_bucket: null,
            val_exact: null,
            note: `Requested: ${request_type}`,
            created_at: new Date().toISOString()
        });

        // 3. Email Owner
        console.log(`Sending disclosure request email to owner: ${record.holder_email} from ${requester_email}`);

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER || process.env.GMAIL_USER,
                pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD,
            },
        });

        const subject = `Access Request: "${record.title || 'Untitled'}"`;
        const text = `You have a new access request for your Proof-of-Thought record.

Record: R-${String(record.registry_no).padStart(16, '0')}
Title: ${record.title || 'Untitled'}

Requester: ${requester_email}
Requested Tier: ${request_type}

To grant access, click this direct link to open your **Deal Room**:
${new URL(req.url).origin}/traction/access?record_id=${record.id}

1. Go to "Create Access Link"
2. Select "${request_type}" disclosure
3. Click "Generate Secure Link"

(This is an automated notification.)`;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Proof-of-Thought" <no-reply@proofofthought.io>',
            to: record.holder_email,
            replyTo: requester_email, // Allow owner to just hit reply!
            subject: subject,
            text: text,
        });

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("Disclosure request failed", e);
        return NextResponse.json({ error: "Internal Error", details: e.message }, { status: 500 });
    }
}
