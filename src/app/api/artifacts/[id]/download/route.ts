import { NextRequest, NextResponse } from "next/server";
import { dbArtifactById, dbGetSubmission } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const t = req.nextUrl.searchParams.get("t") || "";

  const art = await dbArtifactById(id);
  if (!art) return NextResponse.json({ error: "not found" }, { status: 404 });

  const parent = dbGetSubmission(art.parent_certificate_id);
  if (!parent || parent.access_token !== t)
    return NextResponse.json({ error: "access denied" }, { status: 403 });

  const filePath = path.resolve(art.receipt_pdf_key);
  if (!fs.existsSync(filePath))
    return NextResponse.json({ error: "file missing" }, { status: 404 });

  const buf = fs.readFileSync(filePath);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sealed-${id}.pdf"`,
    },
  });
}