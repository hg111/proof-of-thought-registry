import { NextResponse } from "next/server";
import fs from "fs";
import { dbGetSubmission } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const url = new URL(req.url);
  const token = url.searchParams.get("t") || "";

  const sub = dbGetSubmission(id);
  if (!sub) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (sub.access_token !== token) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  if (!sub.pdf_path || !fs.existsSync(sub.pdf_path)) {
    return NextResponse.json({ error: "Certificate not issued yet." }, { status: 409 });
  }

  const pdf = fs.readFileSync(sub.pdf_path);
  return new NextResponse(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${sub.id}.pdf"`
    }
  });
}
