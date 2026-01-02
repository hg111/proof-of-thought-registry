import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { config } from "@/lib/config";
import { dbGetByStripeSession, dbMarkPaidBySession, dbMarkIssued } from "@/lib/db";
import { writeCustodyText, writePdf } from "@/lib/custody";
import { buildCertificatePdf } from "@/lib/pdf";
import { formatRegistryNo } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  const rawBody = Buffer.from(await req.arrayBuffer());

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, config.stripeWebhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed.` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const stripeSessionId = session.id as string;
    const paymentIntent = String(session.payment_intent ?? "");

    const sub = dbGetByStripeSession(stripeSessionId);
    if (!sub) return NextResponse.json({ ok: true });

    dbMarkPaidBySession(stripeSessionId, paymentIntent);

    writeCustodyText(sub.id, sub.canonical_text);

    const issuedAtUtc = new Date().toISOString();
    const verificationUrl = `${config.appBaseUrl}/verify/${encodeURIComponent(sub.id)}`;

    const pdfBytes = await buildCertificatePdf({
      id: sub.id,
      issuedAtUtc,
      title: sub.title,
      holderName: sub.holder_name,
      holderEmail: sub.holder_email,
      canonicalText: sub.canonical_text,
      contentHash: sub.content_hash,
      registryNo: formatRegistryNo(sub.registry_no),
      verificationUrl
    });

    const pdfPath = writePdf(sub.id, pdfBytes);
    dbMarkIssued(sub.id, pdfPath);
  }

  return NextResponse.json({ received: true });
}
