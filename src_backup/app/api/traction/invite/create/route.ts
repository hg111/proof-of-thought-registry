
import { NextRequest, NextResponse } from 'next/server';
import { dbCreateInvite } from '@/lib/db';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            record_id,
            creator_name,
            role_label,
            custom_title,
            custom_summary,
            recipient_name,
            recipient_email,
            message
        } = body;

        if (!record_id) {
            return NextResponse.json({ error: "Missing record_id" }, { status: 400 });
        }

        // Generate secure token
        const token = randomUUID();
        const now = new Date().toISOString();

        // Use provided role or default to generic
        const role = role_label || "Invitee";

        dbCreateInvite(
            token,
            record_id,
            creator_name || "The Creator",
            role,
            now,
            custom_title,
            custom_summary,
            recipient_name
        );

        // Return the operational link
        const inviteLink = `${new URL(req.url).origin}/ack/recipient?t=${token}`;

        // Send Email if requested
        if (recipient_email) {
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

                const subject = `Invited to acknowledge: "${custom_title || 'Untitled'}"`;
                // Exact text requested by user
                const text = `Hi ${recipient_name || 'there'},

I wanted to run an idea by you - below is a one-line blurb:

Handle: ${custom_title || 'Untitled'}
Summary: ${custom_summary || '(No summary provided)'}

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

            } catch (emailErr: any) {
                console.error("Failed to send email:", emailErr);
                // Log full error for debugging
                if (emailErr.response) console.error("SMTP Response:", emailErr.response);
            }
        } else {
            console.log("No recipient_email provided, skipping email.");
        }

        return NextResponse.json({
            success: true,
            link: inviteLink,
            token: token
        });

    } catch (e) {
        console.error("Invite creation failed", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
