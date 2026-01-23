
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { dbGetArtifact, dbGetSubmission } from "@/lib/db";
import { config } from "@/lib/config";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
    try {
        const id = ctx.params.id; // artifactId
        const t = req.nextUrl.searchParams.get("t") || "";
        const forceDownload = req.nextUrl.searchParams.get("download") === "1";

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const artifact = dbGetArtifact(id);
        if (!artifact) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Auth Check: Parent submission must match token
        const parent = dbGetSubmission(artifact.parent_certificate_id);
        if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

        if (String(parent.access_token) !== String(t)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Resolve file path
        const safeKey = artifact.storage_key.replace(/^data[\/\\]/, "");
        const fullPath = path.resolve(config.dataDir, safeKey);

        if (!fs.existsSync(fullPath)) {
            return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
        }

        const stat = fs.statSync(fullPath);
        const fileStream = fs.createReadStream(fullPath);

        const mime = artifact.mime_type || "application/octet-stream";
        const filename = artifact.original_filename || `artifact-${id}.bin`;

        // Disposition
        // If image/pdf/audio/video -> inline (unless forceDownload)
        // Else -> attachment
        const canPreview =
            mime.startsWith("image/") ||
            mime === "application/pdf" ||
            mime.startsWith("audio/") ||
            mime.startsWith("video/");

        const dispositionType = (canPreview && !forceDownload) ? "inline" : "attachment";

        return new NextResponse(fileStream as any, {
            headers: {
                "content-type": mime,
                "content-disposition": `${dispositionType}; filename="${filename}"`,
                "content-length": stat.size.toString(),
                "cache-control": "no-store",
            },
        });

    } catch (e: any) {
        console.error("Asset retrieval error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
