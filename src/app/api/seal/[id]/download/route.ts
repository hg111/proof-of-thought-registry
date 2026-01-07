import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { dbGetSubmission } from "@/lib/db";
import { config } from "@/lib/config";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = String(ctx.params.id || "");
    const url = new URL(req.url);
    const token = url.searchParams.get("t") || "";

    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const sub = dbGetSubmission(id);
    if (!sub) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (sub.access_token !== token) return NextResponse.json({ error: "Access denied." }, { status: 403 });

    if (sub.status !== "issued") {
      return NextResponse.json({ error: "Certificate not issued yet." }, { status: 409 });
    }

    const key = (sub as any).seal_object_key as string | null;
    if (!key) return NextResponse.json({ error: "No seal for this record." }, { status: 404 });

    const fullPath = path.isAbsolute(key) ? key : path.join(config.dataDir, key);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "Seal missing on disk." }, { status: 404 });
    }

    const png = fs.readFileSync(fullPath);
    return new NextResponse(png, {
      headers: {
        "content-type": "image/png",
        "content-disposition": `attachment; filename="Seal-${sub.id}.png"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error." }, { status: 500 });
  }
}