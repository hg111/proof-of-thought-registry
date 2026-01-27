// src/lib/mint.ts

import { dbGetSubmission, dbMarkIssued } from "@/lib/db";
import { buildCertificatePdf } from "@/lib/pdf";
import { writeCustodyText, writePdf } from "@/lib/custody";
import { formatRegistryNo } from "@/lib/db";
import { config } from "@/lib/config";

export async function mintSubmission(submissionId: string) {
  const sub = dbGetSubmission(submissionId);
  if (!sub) throw new Error("Submission not found");

  if (sub.status === "issued") return sub;

  const issuedAtUtc = new Date().toISOString();
  const verificationUrl = `${config.appBaseUrl}/verify/${encodeURIComponent(sub.id)}`;

  // 1) custody text
  writeCustodyText(sub.id, sub.canonical_text);

  // 2) build PDF bytes
  const pdfBytes = await buildCertificatePdf({
    id: sub.id,
    issuedAtUtc,
    title: sub.title,
    holderName: sub.holder_name,
    holderEmail: sub.holder_email,
    canonicalText: sub.canonical_text,
    contentHash: sub.content_hash,
    registryNo: formatRegistryNo(sub.registry_no),
    verificationUrl,
  });

  // 3) write PDF -> get pdf object key (string)
  const pdfObjectKey = writePdf(sub.id, pdfBytes);

  // 4) mark issued (sealObjectKey omitted => null)
  dbMarkIssued(sub.id, issuedAtUtc, pdfObjectKey);

  return dbGetSubmission(sub.id);
}