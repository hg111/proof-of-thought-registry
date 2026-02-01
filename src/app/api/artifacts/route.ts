import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import { newArtifactId, chainHash } from "@/lib/artifacts";
import {
  dbGetSubmission,
  dbLastArtifactForParent,
  dbInsertArtifact,
  dbSetChainPdfKey
} from "@/lib/db";
import { writeChainPdf } from "@/lib/chainPdf";
import { buildArtifactCertificatePdf } from "@/lib/pdf";
import { putArtifactFile, getArtifactPath } from "@/lib/artifactStorage";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

export const maxDuration = 300; // 5 minutes for large uploads

export async function POST(req: NextRequest) {
  const uploadMode = req.headers.get("x-upload-mode");

  // --- RAW STREAMING MODE (For Large Files) ---
  if (uploadMode === "raw") {
    try {
      const parentId = req.headers.get("x-parent-id");
      const filename = req.headers.get("x-filename") || "unknown";
      const mimeType = req.headers.get("x-mimetype") || "application/octet-stream";
      const fileSize = parseInt(req.headers.get("x-size") || "0");
      const thoughtCaption = req.headers.get("x-caption") ? decodeURIComponent(req.headers.get("x-caption")!) : null;
      const t = req.headers.get("x-token") || "";

      if (!parentId || !req.body) {
        return NextResponse.json({ error: "Missing parentId or body" }, { status: 400 });
      }

      const parent = dbGetSubmission(parentId);
      const isDev = process.env.NODE_ENV === "development";
      if (!parent || ((parent.status !== "issued" && parent.status !== "paid") && !isDev)) {
        return NextResponse.json({ error: "Parent not valid" }, { status: 400 });
      }

      // Prepare Streams
      const artifactId = newArtifactId();
      const { full: filePath, key: storageKey } = getArtifactPath(parentId, artifactId, filename);

      const fileStream = fs.createWriteStream(filePath);
      const hasher = crypto.createHash("sha256");

      // Stream Processing (Low Memory)
      // @ts-ignore - Readable.fromWeb matches NextRequest body types mostly
      const webStream = Readable.fromWeb(req.body as any);

      for await (const chunk of webStream) {
        hasher.update(chunk);
        if (!fileStream.write(chunk)) {
          await new Promise((resolve) => fileStream.once("drain", resolve));
        }
      }
      fileStream.end();

      const canonicalHash = hasher.digest("hex");

      // Chain Hash
      const last = dbLastArtifactForParent(parentId);
      const prev = last?.chain_hash || parent.content_hash;
      const ch = chainHash(prev, canonicalHash);

      const verifyUrl = `${process.env.APP_BASE_URL}/verify/${parentId}`;

      // Logic: Restore thumbnail for small images (~10MB safety limit)
      let embedBuffer: Buffer | undefined = undefined;
      if (mimeType.startsWith("image/") && fileSize < 10 * 1024 * 1024) {
        try {
          embedBuffer = fs.readFileSync(filePath);
        } catch (e) { console.error("Failed to read image for thumb", e); }
      }

      // Generate Receipt (Embed if small image)
      const receipt = await buildArtifactCertificatePdf({
        id: artifactId,
        parentCertificateId: parentId,
        issuedAtUtc: new Date().toISOString(),
        registryNo: parent.registry_no ? String(parent.registry_no) : null,
        originalFilename: filename,
        mimeType: mimeType,
        sizeBytes: fileSize, // trusted from header (or use fs.statSync(filePath).size)
        contentHash: canonicalHash,
        chainHash: ch,
        fileBuffer: embedBuffer,
        caption: thoughtCaption,
        verificationUrl: verifyUrl,
      });

      const receiptPath = putArtifactFile(parentId, artifactId, "receipt.pdf", receipt);

      dbInsertArtifact({
        id: artifactId,
        parent_certificate_id: parentId,
        artifact_type: mimeType.startsWith("image/") ? "image" : "file",
        original_filename: filename,
        canonical_hash: canonicalHash,
        chain_hash: ch,
        issued_at: new Date().toISOString(),
        storage_key: storageKey,
        receipt_pdf_key: receiptPath,
        thought_caption: thoughtCaption,
        mime_type: mimeType,
        size_bytes: fileSize,
      });

      // Update Chain PDF
      if (parent.status === "issued") {
        try {
          const chainKey = await writeChainPdf(parentId);
          dbSetChainPdfKey(parentId, chainKey);
        } catch (e) { console.error("Chain update failed", e); }
      }

      return NextResponse.json({ success: true, redirect: `/success?id=${parentId}&t=${t}` });

    } catch (e: any) {
      console.error("Streaming Upload Error:", e);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // --- LEGACY MULTIPART MODE (Small Files) ---
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
  // OPTIMIZATION: Do not pass large buffers to PDF generator to save memory
  const shouldEmbed = file.size < 10 * 1024 * 1024; // 10MB limit for embedding/buffer passing

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

    fileBuffer: shouldEmbed ? buf : undefined, // For optional embedding
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