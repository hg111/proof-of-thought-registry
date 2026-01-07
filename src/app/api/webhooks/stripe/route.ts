// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { toSealDate } from "@/lib/seal";
import crypto from "crypto";
import Stripe from "stripe";

import { config, stripeConfig } from "@/lib/config";
import {
  dbGetByStripeSession,
  dbMarkPaidBySession,
  dbMarkIssued,
  formatRegistryNo,
} from "@/lib/db";
import { writeCustodyText, writePdf, writeSealPng } from "@/lib/custody";
import { buildCertificatePdf } from "@/lib/pdf";
import type { RecordClass } from "@/lib/records";
import { generateSealPng } from "@/lib/seal";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      stripeConfig.webhookSecret
    );
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const stripeSessionId = session.id as string;
  const paymentIntent = String(session.payment_intent ?? "");

  const sub = dbGetByStripeSession(stripeSessionId);
  if (!sub) return NextResponse.json({ ok: true });

  const incomingRecordClass = (session.metadata?.recordClass as RecordClass) ?? sub.record_class;

  // mark paid + persist record_class
  dbMarkPaidBySession(stripeSessionId, paymentIntent, incomingRecordClass);

  // custody text
  writeCustodyText(sub.id, sub.canonical_text);

  // issuance data
  const issuedAtUtc = toSealDate(new Date().toISOString());
  const verificationUrl = `${config.appBaseUrl}/verify/${encodeURIComponent(sub.id)}`;

  // Ensure full 64-hex SHA-256 (no ellipses)
  const rawHash = String(sub.content_hash || "");
  const fullHash =
    rawHash.includes("...") || rawHash.length < 64
      ? crypto.createHash("sha256").update(String(sub.canonical_text || ""), "utf8").digest("hex")
      : rawHash;

  // optional seal (MINTED + ENGRAVED)
  let sealObjectKey: string | null = null;
  let sealBytesForPdf: Buffer | null = null;

  if (incomingRecordClass === "MINTED" || incomingRecordClass === "ENGRAVED") {
    const registryNo = formatRegistryNo(sub.registry_no);
    const holderName = String(sub.holder_name || "");

    // 1) transparent seal for embedding in the PDF
    sealBytesForPdf = await generateSealPng({
      certId: sub.id,
      issuedAtUtcIso: issuedAtUtc,
      variant: incomingRecordClass === "ENGRAVED" ? "ENGRAVED" : "MINTED",
      registryNo,
      contentHash: fullHash,
      verificationUrl,
      holderName,
      bg: "transparent",
    });

    // 2) stored seal on disk
    //    - MINTED: store transparent
    //    - ENGRAVED: store white background for standalone download
    if (incomingRecordClass === "ENGRAVED") {
      const sealBytesWhite = await generateSealPng({
        certId: sub.id,
        issuedAtUtcIso: issuedAtUtc,
        variant: "ENGRAVED",
        registryNo,
        contentHash: fullHash,
        verificationUrl,
        holderName,
        bg: "white",
      });

      sealObjectKey = writeSealPng(sub.id, sealBytesWhite);
    } else {
      sealObjectKey = writeSealPng(sub.id, sealBytesForPdf);
    }
  }

  // build pdf (embed seal for MINTED/ENGRAVED)
  const pdfBytes = await buildCertificatePdf({
    id: sub.id,
    issuedAtUtc,
    title: sub.title,
    holderName: sub.holder_name,
    holderEmail: sub.holder_email,
    canonicalText: sub.canonical_text,
    contentHash: fullHash,
    registryNo: formatRegistryNo(sub.registry_no),
    verificationUrl,
    sealPngBytes: sealBytesForPdf,
  });

  const pdfObjectKey = writePdf(sub.id, pdfBytes);

  // IMPORTANT: pass sealObjectKey as 4th arg
  dbMarkIssued(sub.id, issuedAtUtc, pdfObjectKey, sealObjectKey);

  return NextResponse.json({ received: true });
}