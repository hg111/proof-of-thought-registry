
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { recipient_email, proof_url, handle_title } = body;

        if (!recipient_email || !proof_url) {
            return NextResponse.json({ error: "Missing email or URL" }, { status: 400 });
        }

        console.log("Sharing proof link with:", recipient_email);

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER || process.env.GMAIL_USER,
                pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD,
            },
        });

        const subject = `Proof-of-Thought Link: "${handle_title || 'Untitled Record'}"`;
        const text = `Someone shared a Proof-of-Thought public verifier link with you.

Handle: ${handle_title || 'Untitled Record'}

You can view the limited public details here:
${proof_url}

This link allows you to see the timestamp and reduced verification signals without accessing the sealed content.`;

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Proof-of-Thought" <no-reply@proofofthought.io>',
            to: recipient_email,
            subject: subject,
            text: text,
        });

        console.log(`Share email sent: ${info.messageId}`);
        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("Share proof failed", e);
        return NextResponse.json({ error: "Failed to send email", details: e.message }, { status: 500 });
    }
}
