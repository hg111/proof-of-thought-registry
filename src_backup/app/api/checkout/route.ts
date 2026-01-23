import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { config, stripeConfig } from "@/lib/config";
import { dbGetSubmission, dbSetStripeSession } from "@/lib/db";

export const runtime = "nodejs";

function priceForRecordClass(rc: string | null | undefined) {
  if (rc === "MINTED") return stripeConfig.priceMinted;
  if (rc === "ENGRAVED") return stripeConfig.priceEngraved;
  return stripeConfig.priceGenesis; // default
}

export async function POST(req: Request) {
  try {
    const { id, token } = await req.json();
    if (!id || !token) return NextResponse.json({ error: "Missing id/token." }, { status: 400 });

    const sub = dbGetSubmission(String(id));
    if (!sub) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (sub.access_token !== String(token)) return NextResponse.json({ error: "Access denied." }, { status: 403 });

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceForRecordClass(sub.record_class), quantity: 1 }],
      success_url: `${config.appBaseUrl}/success?id=${encodeURIComponent(sub.id)}&t=${encodeURIComponent(sub.access_token)}&animate=true`,
      cancel_url: `${config.appBaseUrl}/start`,
      metadata: { submission_id: sub.id, recordClass: sub.record_class },
      payment_intent_data: { metadata: { submission_id: sub.id, recordClass: sub.record_class } },
    });

    dbSetStripeSession(sub.id, session.id);
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error." }, { status: 400 });
  }
}