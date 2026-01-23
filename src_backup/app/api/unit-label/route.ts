
import { NextRequest, NextResponse } from "next/server";
import { dbGetSubmission, dbArtifactsForParent, dbSetUnitLabel } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_LABELS = new Set([
    "THOUGHT", "IDEA", "CONCEPT", "PAGE", "BLOCK", "ITEM", "ARTIFACT",
    "CHAPTER", "SCENE", "DRAFT", "VERSION", "MODULE", "MODEL", "DESIGN",
    "PROOF", "EXPERIMENT", "HYPOTHESIS", "CLAIM", "RECORD", "ENTRY", "NOTE",
    "BUILD", "RELEASE", "FRAME", "SEGMENT", "UNIT"
]);

export async function POST(req: NextRequest) {
    try {
        const { id, accessKey, label } = await req.json();

        if (!id || !accessKey || !label) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Verify Access
        const sub = dbGetSubmission(id);
        if (!sub || sub.access_token !== accessKey) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Validate Label (Custom allowed, max 24 chars, alphanumeric + specific symbols + colon for split)
        const cleanLabel = label.trim().toUpperCase();
        if (!cleanLabel || cleanLabel.length > 48 || !/^[A-Z0-9\-_ :]+$/.test(cleanLabel)) {
            return NextResponse.json({ error: "Invalid label format (Alphanumeric, max 48 chars)" }, { status: 400 });
        }

        // 3. Update (Lock removed per user request)
        dbSetUnitLabel(id, cleanLabel);

        return NextResponse.json({ success: true, label });
    } catch (e) {
        console.error("Unit Label Error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
