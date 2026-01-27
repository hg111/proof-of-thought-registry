// src/lib/chainPdf.ts
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { dbGetSubmission, dbArtifactsForParent } from "@/lib/db";
import { config } from "@/lib/config";

// If you want stricter path safety later, reuse your safeResolveUnderDataDir logic.
// For now we trust DB paths because you write them via putArtifactFile().
function safeResolveUnderDataDir(keyOrPath: string) {
  let key = String(keyOrPath || "").trim();
  key = key.replace(/^data[\/\\]/, ""); // ✅ prevent ./data/data/...
  if (!key) return null;

  const candidate = path.isAbsolute(key) ? key : path.join(config.dataDir, key);

  const resolvedCandidate = path.resolve(candidate);
  const resolvedBase = path.resolve(config.dataDir);

  if (!resolvedCandidate.startsWith(resolvedBase + path.sep) && resolvedCandidate !== resolvedBase) {
    return null;
  }
  return resolvedCandidate;
}

function mustReadPdf(keyOrPath: string, label: string) {
  const fullPath = safeResolveUnderDataDir(keyOrPath);

  console.log("[chainPdf] keyOrPath:", keyOrPath);
  console.log("[chainPdf] dataDir:", config.dataDir);
  console.log("[chainPdf] resolved:", fullPath);
  console.log("[chainPdf] mustReadPdf label:", label);

  if (!fullPath) throw new Error(`${label} path is invalid (outside dataDir): ${keyOrPath}`);
  if (!fs.existsSync(fullPath)) throw new Error(`${label} missing on disk at: ${fullPath}`);
  return fs.readFileSync(fullPath);
}

export async function buildChainPdf(parentId: string) {
  const sub = dbGetSubmission(parentId);
  if (!sub) throw new Error(`Parent submission not found: ${parentId}`);

  // NOTE: This assumes you already store a genesis receipt path on the submission row.
  // If your column name differs, change this line accordingly.
  const genesisReceiptPath =
    (sub as any).receipt_pdf_key || (sub as any).receiptPdfKey || "";

  if (!genesisReceiptPath) {
    throw new Error(
      `Submission is missing receipt_pdf_key (genesis PDF path) for: ${parentId}`
    );
  }

  const artifacts = dbArtifactsForParent(parentId);

  // Build output PDF by copying pages from each source PDF
  const out = await PDFDocument.create();

  // 1) Genesis receipt first
  {
    const bytes = mustReadPdf(genesisReceiptPath, "Genesis receipt");
    const src = await PDFDocument.load(bytes);
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const p of pages) out.addPage(p);
  }

  const seen = new Set<string>();

  // 2) Each artifact receipt after
  for (const a of artifacts) {
    const receiptPath = String((a as any).receipt_pdf_key || "");
    if (!receiptPath) continue;

      // ✅ Prevent duplicates even if DB / code inserts twice
    if (seen.has(receiptPath)) continue;
    seen.add(receiptPath);

    const bytes = mustReadPdf(receiptPath, `Artifact receipt ${a.id}`);
    const src = await PDFDocument.load(bytes);
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const p of pages) out.addPage(p);
  }

  const merged = await out.save();
  return Buffer.from(merged);
}

export function chainPdfKey(parentId: string) {
  // DB key (relative to dataDir)
  return path.join("artifacts", parentId, "chain.pdf").replaceAll("\\", "/");
}

export function chainPdfPath(parentId: string) {
  // full path on disk
  return path.join(config.dataDir, chainPdfKey(parentId));
}

export async function writeChainPdf(parentId: string) {
  const buf = await buildChainPdf(parentId);
  const full = chainPdfPath(parentId);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, buf);
  return chainPdfKey(parentId); // ✅ return key
}
