import { NextRequest, NextResponse } from 'next/server';
import { dbAcceptNDA, dbVerifyAccessToken } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        const verification = dbVerifyAccessToken(token);
        if (!verification.valid) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
        }

        dbAcceptNDA(token);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("NDA Accept Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
