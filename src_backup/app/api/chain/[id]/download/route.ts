// src/app/api/chain/[id]/download/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { dbGetSubmission } from "@/lib/db";
import { config } from "@/lib/config";
import { writeChainPdf, chainPdfPath } from "@/lib/chainPdf";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = String(ctx.params?.id || "");
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

    // If chain already exists, serve it. Otherwise generate it on-demand.
    const full = chainPdfPath(id);
    if (!fs.existsSync(full)) {
      await writeChainPdf(id);
    }

    if (!fs.existsSync(full)) {
      return NextResponse.json({ error: "Chain PDF not found on disk." }, { status: 404 });
    }

    const pdfBytes = fs.readFileSync(full);

    return new NextResponse(pdfBytes, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="Proof-of-Thought-CHAIN-${sub.id}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error." }, { status: 500 });
  }
}