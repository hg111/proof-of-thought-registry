
import { NextRequest, NextResponse } from 'next/server';
import { dbGetInvite } from '@/lib/db';
import nodemailer from 'nodemailer';

import { config } from '@/lib/config';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, recipient_email, message } = body;

        if (!token || !recipient_email) {
            return NextResponse.json({ error: "Missing token or email" }, { status: 400 });
        }

        const invite = dbGetInvite(token);
        if (!invite) {
            return NextResponse.json({ error: "Invalid token" }, { status: 404 });
        }

        const inviteLink = `${config.appBaseUrl}/ack/recipient?t=${token}`;

        console.log("Attempting to send email to:", recipient_email);
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT || '587'),
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER || process.env.GMAIL_USER,
                    pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD,
                },
            });

            const subject = `Invited to acknowledge: "${invite.custom_title || 'Untitled'}"`;
            const text = `Hi ${invite.recipient_name || 'there'},

I wanted to run an idea by you - below is a one-line blurb:

Handle: ${invite.custom_title || 'Untitled'}
Summary: ${invite.custom_summary || '(No summary provided)'}

${message ? `Note: "${message}"\n\n` : ''}I’ve recorded this idea for my own reference in case it becomes relevant later. If you’re open to it, I’d appreciate a quick signal - even just acknowledging you saw it.

You can respond here (takes ~10 seconds):
${inviteLink}`;

            const info = await transporter.sendMail({
                from: process.env.EMAIL_FROM || '"Proof-of-Thought" <no-reply@proofofthought.io>',
                to: recipient_email,
                subject: subject,
                text: text,
            });
            console.log(`Email sent: ${info.messageId}`);

            return NextResponse.json({ success: true });

        } catch (emailErr: any) {
            console.error("Failed to send email:", emailErr);
            return NextResponse.json({ error: "Failed to send email", details: emailErr.message }, { status: 500 });
        }

    } catch (e) {
        console.error("Invite send failed", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
