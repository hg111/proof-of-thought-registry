import { NextResponse } from "next/server";
import { dbGetSubmission } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const url = new URL(req.url);
  const t = url.searchParams.get("t") || "";

  const sub = dbGetSubmission(id);
  if (!sub || sub.access_token !== t) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const privateUrl = `${process.env.APP_BASE_URL}/success?id=${id}&t=${t}`;

  const txt = `PRIVATE CONTROL LINK
====================

This link grants sovereign control over your Proof-of-Thought ledger.

Keep it safe. Whoever holds it may append sealed pages to your chain.

${privateUrl}
`;

  return new NextResponse(txt, {
    headers: {
      "content-type": "text/plain",
      "content-disposition": `attachment; filename="Proof-of-Thought-Control-Link.txt"`,
    },
  });
}