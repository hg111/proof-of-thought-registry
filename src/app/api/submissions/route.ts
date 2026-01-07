import { NextResponse } from "next/server";
import { canonicalize } from "@/lib/canonicalize";
import { sha256Hex } from "@/lib/hash";
import { newCertificateId } from "@/lib/ids";
import { newAccessToken } from "@/lib/tokens";
import { dbCreateDraft } from "@/lib/db";
import { safeText, isProbablyEmail } from "@/lib/safety";
import {  RecordClass, priceForRecordClass } from "@/lib/records";


export const runtime = "nodejs";



export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const recordClass = (body?.recordClass as RecordClass) ?? "GENESIS";
    const amountCents = priceForRecordClass(recordClass);
    const currency = "usd";

    const title = safeText(body?.title ?? "", 160) || null;
    const holderName = safeText(body?.holderName ?? "", 120) || null;
    const holderEmailRaw = safeText(body?.holderEmail ?? "", 160);
    const holderEmail = holderEmailRaw ? (isProbablyEmail(holderEmailRaw) ? holderEmailRaw : null) : null;

    const rawText = String(body?.text ?? "");
    const canonicalText = canonicalize(rawText);
    const contentHash = sha256Hex(canonicalText);

    const id = newCertificateId();
    const token = newAccessToken();

 

    dbCreateDraft({
      id,
      title,
      holderName,
      holderEmail,
      canonicalText,
      contentHash,
      accessToken: token,
      amountCents,
      currency,
      recordClass,
    });

    return NextResponse.json({ id, token });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error." }, { status: 400 });
  }
}
