
import { NextRequest, NextResponse } from 'next/server';
import { dbGetSubmission } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get('record_id');

    if (!recordId) {
        return NextResponse.json({ error: 'Missing record_id' }, { status: 400 });
    }

    try {
        const record = dbGetSubmission(recordId);

        if (!record) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        // Check for Access Token (Disclosure)
        const accessToken = searchParams.get('access_token');
        let revealedContent = null;
        let disclosureType = undefined; // Initialize disclosureType

        if (accessToken) {
            // Import dynamically to avoid circular dependency issues if any (though logic is clean)
            const { dbVerifyAccessToken, dbLogAccess } = await import('@/lib/db');

            const verification = dbVerifyAccessToken(accessToken);
            console.log(`[API] VERIFY: Token=${accessToken} Valid=${verification.valid} Record=${verification.recordId} Expected=${record.id}`);
            if (verification.valid && verification.recordId === record.id) {
                const type = verification.disclosureType || 'full';
                disclosureType = type; // Set disclosureType here

                let isNDAFulfilled = true;
                if ((record as any).nda_enabled) {
                    if (!verification.ndaAcceptedAt) {
                        isNDAFulfilled = false;
                    }
                }

                // Only reveal full text if type is 'full' and NDA is fulfilled
                if (type === 'full') {
                    if (isNDAFulfilled) {
                        revealedContent = record.canonical_text;
                    }
                }

                // Pass NDA flags via response properties (dirty attach or clean separate?)
                (req as any)._ndaRequired = (record as any).nda_enabled && !isNDAFulfilled;
                (req as any)._ndaAccepted = !!verification.ndaAcceptedAt;

                // Log Audit Trail
                const ip = req.headers.get('x-forwarded-for') || 'unknown';
                const ua = req.headers.get('user-agent') || 'unknown';

                // Fire and forget logging (don't block response)
                try {
                    dbLogAccess(record.id, verification.tokenId || null, ip, ua);
                } catch (e) {
                    console.error("Failed to log access", e);
                }
            }
        }

        // Mask sensitive fields for public/unauthorized view
        // Ideally we should sanitize `record` before sending, but for MVP Owner/Public mix:
        // We add `revealed_content` if authorized.

        return NextResponse.json({
            record: {
                ...record,
                // Don't send `canonical_text` by default unless owner (implicit) or authorized?
                // Currently `dbGetSubmission` returns everything.
                // We should probably mask `canonical_text` if not owner/authorized.
                // But existing logic relies on frontend to decide?
                // Wait, if `canonical_text` is ALWAYS sent, the blurring is fake security.
                // We MUST mask it here if no token (and not owner context).
                // However, this endpoint is also used by Dashboard (Owner).
                // Dashboard requests usually don't carry a special owner token, 
                // but checking `traction/page.tsx`, it calls `/api/traction/list`.
                // Checking `src/app/v/[id]/page.tsx`, it calls THIS endpoint.
                // So this endpoint IS public facing. We MUST mask `canonical_text`.

                canonical_text: revealedContent ? revealedContent : undefined, // Remove if not revealed
                content_text_masked: !revealedContent // Flag for UI
            },
            revealed: !!revealedContent,

            disclosure_type: disclosureType, // Pass type if we had it
            nda_required: (req as any)._ndaRequired,
            nda_accepted: (req as any)._ndaAccepted
        });

    } catch (error) {
        console.error("Error fetching record:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
