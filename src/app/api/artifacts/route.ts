import { NextRequest, NextResponse } from "next/server";
import { canonicalizeImage } from "@/lib/imageCanonical";
import { newArtifactId, chainHash } from "@/lib/artifacts";
import {
  dbGetSubmission,
  dbLastArtifactForParent,
  dbInsertArtifact,
} from "@/lib/db";
import { writeChainPdf } from "@/lib/chainPdf";
import { buildArtifactPdf } from "@/lib/artifactPdf";
import { putArtifactFile } from "@/lib/artifactStorage";
import { dbSetChainPdfKey } from "@/lib/db";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const parentId = String(form.get("parentId") || "");
  const file = form.get("file") as File | null;
  if (!parentId || !file) return NextResponse.json({ error: "missing" }, { status: 400 });

  const parent = dbGetSubmission(parentId);
  if (!parent || parent.status !== "issued")
    return NextResponse.json({ error: "parent not issued" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const { canonicalHash } = await canonicalizeImage(buf);
  
  const thoughtCaptionRaw = form.get("thoughtCaption");
  const thoughtCaption =
    thoughtCaptionRaw == null ? null : String(thoughtCaptionRaw).trim() || null;

  // get last chain hash (genesis or last artifact)
  const last = dbLastArtifactForParent(parentId);
  const prev = last?.chain_hash || parent.content_hash;
  const ch = chainHash(prev, canonicalHash);

  const artifactId = newArtifactId();
  const origPath = putArtifactFile(parentId, artifactId, file.name, buf);

  const verifyUrl = `${process.env.APP_BASE_URL}/verify/${parentId}`;
  const receipt = await buildArtifactPdf({
    parentId,
    artifactId,
    issuedAtUtc: new Date().toISOString(),
    filename: file.name,
    canonicalHash,
    chainHash: ch,
    verifyUrl,
    imageBytes: new Uint8Array(buf),
    imageMime: file.type || "image/png",
    thoughtCaption,
  });
  const receiptPath = putArtifactFile(parentId, artifactId, "receipt.pdf", receipt);

  dbInsertArtifact({
    id: artifactId,
    parent_certificate_id: parentId,
    artifact_type: "image",
    original_filename: file.name,
    canonical_hash: canonicalHash,
    chain_hash: ch,
    issued_at: new Date().toISOString(),
    storage_key: origPath,
    receipt_pdf_key: receiptPath,
    thought_caption: thoughtCaption,
 });

 const chainKey = await writeChainPdf(parentId);
 dbSetChainPdfKey(parentId, chainKey);
 
 // ✅ update the accumulated chain PDF (Genesis + all artifacts in order)
 await writeChainPdf(parentId);
 
const t = String(form.get("t") || "");
return NextResponse.redirect(
  `${process.env.APP_BASE_URL}/success?id=${encodeURIComponent(parentId)}&t=${encodeURIComponent(t)}`,
  { status: 303 }
);
}