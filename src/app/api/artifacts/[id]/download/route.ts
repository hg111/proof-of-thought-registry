import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { dbArtifactById, dbGetSubmission } from "@/lib/db";
import { config } from "@/lib/config";

export const runtime = "nodejs";

function safeResolveUnderDataDir(keyOrPath: string) {
  let key = String(keyOrPath || "").trim();
  if (!key) return null;

  // ✅ Fix legacy keys that already include "data/"
  key = key.replace(/^data[\\/]/, ""); // strips "data/" or "data\"

  const candidate = path.isAbsolute(key) ? key : path.join(config.dataDir, key);

  const resolvedCandidate = path.resolve(candidate);
  const resolvedBase = path.resolve(config.dataDir);

  if (!resolvedCandidate.startsWith(resolvedBase + path.sep) && resolvedCandidate !== resolvedBase) {
    return null;
  }
  return resolvedCandidate;
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = String(ctx.params?.id || "");
    const t = req.nextUrl.searchParams.get("t") || "";
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const art = await dbArtifactById(id);
    if (!art) return NextResponse.json({ error: "Not found." }, { status: 404 });

    // Parent cert controls access
    const parent = dbGetSubmission(String(art.parent_certificate_id || ""));
    if (!parent) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (String(parent.access_token || "") !== String(t || "")) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    if (parent.status !== "issued") {
      return NextResponse.json({ error: "Certificate not issued yet." }, { status: 409 });
    }

    // Your artifacts table stores a key/path like: "receipts/<id>.pdf" (recommended)
    const fullPath = safeResolveUnderDataDir(String(art.receipt_pdf_key || ""));
    if (!fullPath) {
      return NextResponse.json({ error: "Invalid receipt path." }, { status: 500 });
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: `Receipt missing on disk at: ${fullPath}` },
        { status: 404 }
      );
    }

    const buf = fs.readFileSync(fullPath);

    return new NextResponse(buf, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="sealed-${id}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error." }, { status: 500 });
  }
}