// src/app/api/submissions/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { dbGetSubmission } from "@/lib/db";
import { chainPdfPath } from "@/lib/chainPdf";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = String(ctx.params?.id || "");
    const t = req.nextUrl.searchParams.get("t") || "";
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const sub = dbGetSubmission(id);
    if (!sub) return NextResponse.json({ error: "Not found." }, { status: 404 });

    if (String((sub as any).access_token || "") !== String(t || "")) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    if ((sub as any).status !== "issued") {
      return NextResponse.json({ error: "Certificate not issued yet." }, { status: 409 });
    }

    const p = chainPdfPath(id);
    const full = path.resolve(p);

    if (!fs.existsSync(full)) {
      return NextResponse.json(
        { error: `Chain PDF missing on disk at: ${full}` },
        { status: 404 }
      );
    }

    const buf = fs.readFileSync(full);
    return new NextResponse(buf, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="proof-of-thought-${id}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error." }, { status: 500 });
  }
}