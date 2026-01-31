
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

        // --- SECURITY & TIERED DISCLOSURE LOGIC ---

        // 1. Determine Context: Public (Registry No) vs Owner (UUID)
        // If recordId looks like "R-..." or "123", it is a Public Interface request.
        // If recordId looks like a UUID, it is an Owner Interface request (Security by Capability).
        const isPublicInterface = /^R-\d+$/.test(recordId) || /^\d+$/.test(recordId);

        // 2. Check for Access Token
        const accessToken = searchParams.get('access_token');
        let revealedContent = null;
        let disclosureType: 'pitch' | 'summary' | 'full' | undefined = undefined;
        let isAuthorizedViewer = false;

        if (accessToken) {
            // Import dynamically to avoid circular dependency
            const { dbVerifyAccessToken, dbLogAccess } = await import('@/lib/db');

            const verification = dbVerifyAccessToken(accessToken);
            console.log(`[API] VERIFY: Token=${accessToken} Valid=${verification.valid} Record=${verification.recordId} Expected=${record.id}`);

            if (verification.valid && verification.recordId === record.id) {
                isAuthorizedViewer = true;
                const type = verification.disclosureType || 'full';
                disclosureType = type as any;

                let isNDAFulfilled = true;
                if ((record as any).nda_enabled) {
                    if (!verification.ndaAcceptedAt) {
                        isNDAFulfilled = false;
                    }
                }

                // Reveal FULL content (Canonical Proof) only if type is 'full' and NDA accepted
                if (type === 'full') {
                    if (isNDAFulfilled) {
                        revealedContent = record.canonical_text;
                    }
                }

                // Pass NDA flags via response properties
                (req as any)._ndaRequired = (record as any).nda_enabled && !isNDAFulfilled;
                (req as any)._ndaAccepted = !!verification.ndaAcceptedAt;

                // Log Audit Trail (Fire and forget)
                const ip = req.headers.get('x-forwarded-for') || 'unknown';
                const ua = req.headers.get('user-agent') || 'unknown';
                try {
                    dbLogAccess(record.id, verification.tokenId || null, ip, ua);
                } catch (e) {
                    console.error("Failed to log access", e);
                }
            }
        }

        // 3. Masking Logic
        // IF Public Interface (Registry No) AND NOT Authorized Viewer:
        //    -> MASK Summary
        //    -> MASK Canonical (Always masked if not revealed above)
        // ELSE (Owner UUID or Authorized):
        //    -> Show Summary (Owner sees it, Authorized viewer sees it if token allows?)
        //       Wait, Authorized Viewer with only 'Pitch' token should NOT see Summary?
        //       Correction: Authorized Viewer logic needs to check `disclosureType`.

        let summaryText = record.summary_text;

        if (isPublicInterface) {
            if (!isAuthorizedViewer) {
                // Public Anonymous Visitor -> HIDE Summary
                summaryText = null;
            } else {
                // Authorized Viewer -> Check Scope
                // If token is 'pitch', hide summary.
                // If token is 'summary' or 'full', show summary.
                if (disclosureType === 'pitch') {
                    summaryText = null;
                }
            }
        }
        // implicit else: Owner (UUID) sees everything.

        return NextResponse.json({
            record: {
                ...record,
                // Mask fields
                canonical_text: revealedContent ? revealedContent : undefined,
                content_text_masked: !revealedContent,

                // Tiered Content
                summary_text: summaryText,
                // Pitch is always public (Teaser)
            },
            revealed: !!revealedContent,

            disclosure_type: disclosureType,
            nda_required: (req as any)._ndaRequired,
            nda_accepted: (req as any)._ndaAccepted
        });

    } catch (error) {
        console.error("Error fetching record:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
