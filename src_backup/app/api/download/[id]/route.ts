// src/app/api/download/[id]/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { dbGetSubmission } from "@/lib/db";
import { config } from "@/lib/config";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = String(ctx.params.id || "");
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const url = new URL(req.url);
    const token = url.searchParams.get("t") || "";

    const sub = dbGetSubmission(id);
    if (!sub) return NextResponse.json({ error: "Not found." }, { status: 404 });

    if (sub.access_token !== token) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    if (sub.status !== "issued") {
      return NextResponse.json({ error: "Certificate not issued yet." }, { status: 409 });
    }

    const key =
      String((sub as any).receipt_pdf_key || "").trim() ||
      String((sub as any).pdf_object_key || "").trim() ||
      String((sub as any).pdf_path || "").trim() ||
      null;


    if (!key) return NextResponse.json({ error: "Missing PDF key." }, { status: 500 });

    function safeResolveUnderDataDir(keyOrPath: string) {
      let k = String(keyOrPath || "").trim();
      if (!k) return null;

      // prevent ./data/data/... if any legacy rows leak in
      k = k.replace(/^data[\/\\]/, "");

      const candidate = path.isAbsolute(k) ? k : path.join(config.dataDir, k);

      const resolvedCandidate = path.resolve(candidate);
      const resolvedBase = path.resolve(config.dataDir);

      if (
        !resolvedCandidate.startsWith(resolvedBase + path.sep) &&
        resolvedCandidate !== resolvedBase
      ) {
        return null;
      }
      return resolvedCandidate;
    }

    const fullPath = safeResolveUnderDataDir(key);
    if (!fullPath) {
      return NextResponse.json({ error: "Invalid PDF path." }, { status: 500 });
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "PDF not found on disk." }, { status: 404 });
    }

    const pdfBytes = fs.readFileSync(fullPath);

    return new NextResponse(pdfBytes, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="Proof-of-Thought-${sub.id}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error." }, { status: 500 });
  }
}