import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { newArtifactId, chainHash } from "@/lib/artifacts";
import {
  dbGetSubmission,
  dbLastArtifactForParent,
  dbInsertArtifact,
} from "@/lib/db";
import { writeChainPdf } from "@/lib/chainPdf";
import { buildArtifactCertificatePdf } from "@/lib/pdf";
import { putArtifactFile } from "@/lib/artifactStorage";
import { dbSetChainPdfKey } from "@/lib/db";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const parentId = String(form.get("parentId") || "");
  const file = form.get("file") as File | null;
  if (!parentId || !file) return NextResponse.json({ error: "missing" }, { status: 400 });

  const parent = dbGetSubmission(parentId);
  const isDev = process.env.NODE_ENV === "development";
  if (!parent || ((parent.status !== "issued" && parent.status !== "paid") && !isDev)) {
    console.error(`Artifact Upload Failed: Parent ${parentId}, status=${parent?.status}`);
    return NextResponse.json({
      error: "parent not issued",
      debug: {
        id: parentId,
        status: parent?.status || "not_found",
        exists: !!parent,
        isDev
      }
    }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // 1. Raw Hash (Universal Evidence)
  const canonicalHash = crypto.createHash("sha256").update(buf).digest("hex");

  const thoughtCaptionRaw = form.get("thoughtCaption");
  const thoughtCaption =
    thoughtCaptionRaw == null ? null : String(thoughtCaptionRaw).trim() || null;

  // 2. Chain Hash
  const last = dbLastArtifactForParent(parentId);
  const prev = last?.chain_hash || parent.content_hash;
  const ch = chainHash(prev, canonicalHash);

  const artifactId = newArtifactId();
  const origPath = putArtifactFile(parentId, artifactId, file.name, buf);

  const verifyUrl = `${process.env.APP_BASE_URL}/verify/${parentId}`;

  // 3. Generate Certificate (Universal)
  const receipt = await buildArtifactCertificatePdf({
    id: artifactId,
    parentCertificateId: parentId,
    issuedAtUtc: new Date().toISOString(),
    registryNo: parent.registry_no ? String(parent.registry_no) : null,

    originalFilename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    contentHash: canonicalHash,
    chainHash: ch,

    fileBuffer: buf, // For optional embedding
    caption: thoughtCaption,
    verificationUrl: verifyUrl,
  });

  const receiptPath = putArtifactFile(parentId, artifactId, "receipt.pdf", receipt);

  dbInsertArtifact({
    id: artifactId,
    parent_certificate_id: parentId,
    artifact_type: file.type?.startsWith("image/") ? "image" : "file", // simplifying for now
    original_filename: file.name,
    canonical_hash: canonicalHash,
    chain_hash: ch,
    issued_at: new Date().toISOString(),
    storage_key: origPath,
    receipt_pdf_key: receiptPath,
    thought_caption: thoughtCaption,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
  });

  // 4. Update Chain PDF (Optional/Best Effort in Dev)
  if (parent.status === "issued") {
    try {
      const chainKey = await writeChainPdf(parentId);
      dbSetChainPdfKey(parentId, chainKey);
    } catch (e: any) {
      // In dev mode, missing PDF is expected if parent is draft
      if (isDev) {
        console.warn("[Dev Warning] Failed to update chain PDF (expected if draft):", e.message);
      } else {
        throw e; // Rethrow in prod
      }
    }
  }

  const t = String(form.get("t") || "");
  return NextResponse.redirect(
    `${process.env.APP_BASE_URL}/success?id=${encodeURIComponent(parentId)}&t=${encodeURIComponent(t)}`,
    { status: 303 }
  );
}