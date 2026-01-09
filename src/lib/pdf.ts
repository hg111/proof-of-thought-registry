// src/lib/pdf.ts
import { PDFDocument } from "pdf-lib";
import { rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";


const fontRegularBytes = fs.readFileSync(
  path.join(process.cwd(), "src/assets/fonts/Inter-Regular.ttf")
);
const fontBoldBytes = fs.readFileSync(
  path.join(process.cwd(), "src/assets/fonts/Inter-Bold.ttf")
);

function wrapText(text: string, maxChars: number) {
  const lines: string[] = [];
  const paragraphs = (text || "").split("\n");
  for (const p of paragraphs) {
    if (!p.trim()) {
      lines.push("");
      continue;
    }
    const words = p.split(/\s+/);
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (next.length > maxChars) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function fmtUtc(isoUtc: unknown) {
  const s = String(isoUtc ?? "").trim();
  if (!s) return "—";

  const d = new Date(s);
  const t = d.getTime();
  if (!Number.isFinite(t)) return s;

  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}.${mm}.${dd} • ${hh}:${mi}:${ss} UTC`;
}

type HeaderMeta = {
  id: string;
  registryNo?: string | null;
  issuedAtUtc: string;
  recordLabel: string; // GENESIS / MINTED / ENGRAVED / ARTIFACT...
  parentCertificateId?: string | null; // ✅ parent is a CERT ID (not registry)
  // future-ready (optional)
  artifactId?: string | null;
  artifactIssuedAtUtc?: string | null;
  artifactHash?: string | null;
  chainHash?: string | null;
};

export async function buildCertificatePdf(args: {
  id: string;
  issuedAtUtc: string;

  title?: string | null;
  holderName?: string | null;
  holderEmail?: string | null;

  canonicalText: string;
  contentHash: string;
  verificationUrl: string;
  registryNo?: string | null;

  sealPngBytes?: Buffer | null;

  // chain/meta
  parentId?: string | null; // parent CERTIFICATE ID
  recordLabel?: string | null;

  // optional artifact meta (for later)
  artifactId?: string | null;
  artifactIssuedAtUtc?: string | null;
  artifactHash?: string | null;
  chainHash?: string | null;


}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const PAGE_W = 612;
  const PAGE_H = 792;

  // Bottom reserved zone constants
  const SEAL_TARGET_W = 120;
  const SEAL_PAD_TOP = 10;          // space between content box and bottom zone
  const SEAL_PAD_RIGHT = 0;         // (you already use margin on right)
  const LIM_FONT_SIZE = 8.5;
  const LIM_LINE_H = 11;
  const LIM_MAX_CHARS = 110;        // you already used 110 in wrapText
  const LIM_PAD_TOP = 6;            // small breathing room above limitation text

  // -------------------------
  // Embed assets (Fonts / Images) ONCE at the top level
  // -------------------------
  //const fontSerif = await pdfDoc.embedFont("Times-Roman");
  //const fontSerifBold = await pdfDoc.embedFont("Times-Bold");
  const fontSerif = await pdfDoc.embedFont(fontRegularBytes);
  const fontSerifBold = await pdfDoc.embedFont(fontBoldBytes);
  const fontMono = await pdfDoc.embedFont("Courier");
  //const fontArialBold = await pdfDoc.embedFont("Arial Bold");

  let sharedSealImg: any = null;
  if (args.sealPngBytes && args.sealPngBytes.length > 0) {
    sharedSealImg = await pdfDoc.embedPng(args.sealPngBytes);
  }

  const margin = 54;

  // -------------------------
  // Compact header for pages 2+
  // -------------------------
  const headerFontSize = 9;
  const headerLineH = 12;
  const headerPadBelow = 10;

  // -------------------------
  // Vertical layout safety (prevents seal from trimming text)
  // -------------------------
  // match your actual seal render height (+safe margin)
  // We use the shared image dimensions if available
  let sealBoxH = 0;
  if (sharedSealImg) {
    const scale = SEAL_TARGET_W / sharedSealImg.width;
    sealBoxH = sharedSealImg.height * scale; // roughly 140 usually
  } else if (args.sealPngBytes) {
    sealBoxH = 140; // fallback
  }

  const bottomSafe = margin + sealBoxH + 16;     // margin + seal area + buffer

  // usable vertical span for text
  const yTop = PAGE_H - margin;                  // first writable y


  function drawCompactHeader(page: any, meta: HeaderMeta) {
    let y = PAGE_H - margin;

    const line = (t: string, font = fontSerif) => {
      page.drawText(t, { x: margin, y, size: headerFontSize, font });
      y -= headerLineH;
    };

    // Header style (matches what you outlined)
    const reg = meta.registryNo ?? "—";
    line(`PROOF OF THOUGHT™   Registry ${reg}   ${meta.id}`, fontSerifBold);

    // issued + record (+ parent if present)
    const issued = fmtUtc(meta.issuedAtUtc);
    const parentPart = meta.parentCertificateId ? `   Parent: ${meta.parentCertificateId}` : "";
    line(`Issued: ${issued}   Record: ${meta.recordLabel}${parentPart}`, fontSerif);

    // optional artifact line
    if (meta.artifactId && meta.artifactIssuedAtUtc) {
      line(`Artifact: ${meta.artifactId}   ${fmtUtc(meta.artifactIssuedAtUtc)}`, fontSerif);
    }

    // optional hashes (future)
    if (meta.artifactHash || meta.chainHash) {
      if (meta.artifactHash) line(`Artifact Hash: SHA-256 ${meta.artifactHash}`, fontMono);
      if (meta.chainHash) line(`Chain Hash:    SHA-256 ${meta.chainHash}`, fontMono);
    }

    // divider
    page.drawLine({
      start: { x: margin, y: y + 3 },
      end: { x: PAGE_W - margin, y: y + 3 },
      thickness: 1,
    });

    return y - headerPadBelow;
  }

  function addPageWithHeader(meta: HeaderMeta) {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    const y = drawCompactHeader(page, meta);
    return { page, y };
  }

  const recordLabel = String(args.recordLabel || "GENESIS");

  // -------------------------
  // PAGE 1 (cover page)
  // -------------------------
  const page1 = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const { width, height } = page1.getSize();
  let y = height - margin;

  const drawLine = () => {
    page1.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
    });
  };

  const drawText = (text: string, opts: { font: any; size: number; x?: number; y?: number }) => {
    const x = opts.x ?? margin;
    const yy = opts.y ?? y;
    page1.drawText(text, { x, y: yy, size: opts.size, font: opts.font });
  };

  // Header
  drawText("PROOF OF THOUGHT™", { font: fontSerif, size: 16 });
  y -= 22;
  // Capture baseline Y for aligning seal top edge
  const yCustodianBaseline = y;

  drawText("Independent Digital Evidence Custodian", { font: fontSerif, size: 10 });
  y -= 18;
  drawLine();
  y -= 18;

  // Optional micro-seal on page 1 (top-right), aligned to the custodian line baseline
  if (sharedSealImg) {
    const targetW = 120;
    const scale = targetW / sharedSealImg.width;
    const drawW = sharedSealImg.width * scale;
    const drawH = sharedSealImg.height * scale;

    const xSeal = width - margin - drawW;
    // top edge of seal aligns to bottom letters (baseline) of custodian line
    const ySeal = yCustodianBaseline - drawH;

    page1.drawImage(sharedSealImg, { x: xSeal, y: ySeal, width: drawW, height: drawH });
  }

  drawText("Certificate of Conception & Possession", { font: fontSerifBold, size: 13 });
  y -= 18;

  // Meta blocks (slightly tighter than before to help 1-page fit)
  const label = (t: string) => {
    drawText(t, { font: fontSerifBold, size: 8.5 });
    y -= 12;
  };
  const monoBlock = (t: string) => {
    drawText(t, { font: fontMono, size: 8.5 });
    y -= 15;
  };
  const body = (t: string) => {
    const lines = String(t ?? "").split("\n");
    for (const line of lines) {
      drawText(line, { font: fontSerif, size: 9.5 });
      y -= 12;
    }
    y -= 4;
  };

  if (args.parentId) {
    label("PARENT"); monoBlock(args.parentId);
  }

  label("CERTIFICATE ID"); monoBlock(args.id);
  label("REGISTRY NO."); monoBlock(args.registryNo ?? "—");
  label("ISSUED AT (UTC)"); monoBlock(fmtUtc(args.issuedAtUtc));
  label("RECORD"); monoBlock(recordLabel);

  if (args.title) {
    label("TITLE"); body(args.title);
  }

  if (args.holderName || args.holderEmail) {
    label("HOLDER (DECLARANT)");
    body(
      `${args.holderName ? `Name: ${args.holderName}` : "Name: —"}\n` +
      `${args.holderEmail ? `Email: ${args.holderEmail}` : "Email: —"}`
    );
  }

  drawLine();
  y -= 12;

  // Declaration
  drawText("Declaration", { font: fontSerifBold, size: 10.5 });
  y -= 12;

  const decl =
    "This certificate attests that the Holder possessed the Original Submission in the form recorded below at the stated time. " +
    "The submission was preserved in third-party custody and digitally sealed using cryptographic hashing.";
  for (const line of wrapText(decl, 105)) {
    drawText(line, { font: fontSerif, size: 9.5 });
    y -= 12;
  }

  //y -= 6;
  drawLine();
  y -= 12;

  // Verification & Fingerprint (cover page)
  drawText("Verification & Fingerprint", { font: fontSerifBold, size: 10.5 });
  y -= 14;

  //label("Hash Algorithm"); monoBlock("SHA-256");
  label("Content Hash"); monoBlock(args.contentHash.startsWith("SHA-256:") ? args.contentHash : `SHA-256: ${args.contentHash}`);

  label("Verification");
  for (const line of wrapText(args.verificationUrl, 100)) {
    drawText(line, { font: fontMono, size: 9 });
    y -= 14;
  }

  // ------------------------------------------------------------
  // Bottom reserve (limitation text only — seal is now top-right)
  // ------------------------------------------------------------
  const lim =
    "This certificate establishes third-party custody and timestamped possession evidence. " +
    "It does not constitute legal advice, patent registration, or governmental filing.";

  const limLines = wrapText(lim, LIM_MAX_CHARS);
  const limBlockH = LIM_PAD_TOP + limLines.length * LIM_LINE_H;

  // Reserve enough vertical room at the bottom for the limitation text block
  const bottomReserveY = margin + limBlockH + 10;

  // Try to fit the ORIGINAL SUBMISSION onto page 1 if it’s short enough
  const subLines = wrapText(args.canonicalText, 110);

  // Trim trailing blank lines so we don't generate header-only continuation pages
  while (subLines.length && subLines[subLines.length - 1].trim() === "") {
    subLines.pop();
  }

  const lineSize = 9;
  const lineH = 12;

  // space available for a submission box on page 1
  const boxTitleH = 14 + 8; // title + spacing
  const boxPadTop = 10;
  const boxPadBottom = 10;
  const boxChromeH = boxTitleH + boxPadTop + boxPadBottom;

  const availableH = y - bottomReserveY;

  // How many lines can we fit in the submission box on page 1?
  const maxLinesPage1 = Math.max(0, Math.floor((availableH - boxChromeH) / lineH));
  const linesOnCover = Math.min(subLines.length, maxLinesPage1);

  // Draw submission on page 1 IF we can fit at least 1 line
  let startIdxForPage2 = 0;

  if (linesOnCover > 0) {
    y -= 8;
    drawText("Original Submission (verbatim)", { font: fontSerifBold, size: 10.5 });
    y -= 14;

    const boxX = margin;
    const boxW = width - margin * 2;
    const boxYBottom = bottomReserveY;
    const boxH = y - boxYBottom;

    page1.drawRectangle({
      x: boxX,
      y: boxYBottom,
      width: boxW,
      height: boxH,
      borderWidth: 1,
      borderColor: rgb(0, 0, 0),
      color: rgb(1, 1, 1),
    });

    let ty = y - 12;
    const innerBottom = boxYBottom + 10;

    // IMPORTANT: advance startIdxForPage2 only for lines actually drawn
    while (startIdxForPage2 < linesOnCover && ty > innerBottom) {
      page1.drawText(subLines[startIdxForPage2], {
        x: boxX + 10,
        y: ty,
        size: lineSize,
        font: fontSerif,
      });
      ty -= lineH;
      startIdxForPage2++;
    }
  }

  // If we didn’t fit everything, continue remaining lines on pages 2+
  const needsContinuation = startIdxForPage2 < subLines.length;
  // Optional micro-seal on page 1 (bottom-right)
  // if (args.sealPngBytes && args.sealPngBytes.length > 0) {
  //   const sealImg = await pdfDoc.embedPng(args.sealPngBytes);
  //   const targetW = 120;
  //   const scale = targetW / sealImg.width;
  //   const drawW = sealImg.width * scale;
  //   const drawH = sealImg.height * scale;
  //   const x = width - margin - drawW;
  //   const ySeal = margin;
  //   page1.drawImage(sealImg, { x, y: ySeal, width: drawW, height: drawH });
  // }



  // If seal exists, compute its drawn height (same math you use when drawing it)
  let sealBlockH = 0;
  if (sharedSealImg) {
    // const sealImg = await pdfDoc.embedPng(args.sealPngBytes); // already embedded in sharedSealImg
    const scale = SEAL_TARGET_W / sharedSealImg.width;
    const drawH = sharedSealImg.height * scale;
    sealBlockH = drawH; // no extra padding yet
  }

  // The reserved zone must accommodate BOTH limitation text and seal.
  // They can overlap horizontally, but vertically we must reserve the max.
  const bottomReserveH = Math.max(limBlockH, sealBlockH) + SEAL_PAD_TOP;
  const yBottom = margin + bottomReserveH;

  const limTopY = bottomReserveY - 6;
  // page1.drawLine({
  //   start: { x: margin, y: limTopY },
  //   end: { x: width - margin, y: limTopY },
  //   thickness: 1,
  // });

  let limTextY = limTopY - 12;
  for (const line of limLines) {
    page1.drawText(line, { x: margin, y: limTextY, size: 8.5, font: fontSerif });
    limTextY -= 11;
  }

  // -------------------------
  // PAGES 2+ (only if cover didn’t fit the submission)
  // -------------------------
  // -------------------------
  // PAGES 2+ (only if cover didn’t fit the submission)
  // -------------------------
  if (needsContinuation) {
    const meta: HeaderMeta = {
      id: args.id,
      registryNo: args.registryNo ?? null,
      issuedAtUtc: args.issuedAtUtc,
      recordLabel,
      parentCertificateId: args.parentId ?? null,

      artifactId: args.artifactId ?? null,
      artifactIssuedAtUtc: args.artifactIssuedAtUtc ?? null,
      artifactHash: args.artifactHash ?? null,
      chainHash: args.chainHash ?? null,
    };

    let idx = startIdxForPage2;
    while (idx < subLines.length) {
      const { page, y: yStart } = addPageWithHeader(meta);

      page.drawText("Original Submission (verbatim)", {
        x: margin,
        y: yStart,
        size: 11,
        font: fontSerifBold,
      });

      let yCursor = yStart - 18;

      const boxX = margin;
      const boxW = PAGE_W - margin * 2;

      // Pages 2+ do NOT have the limitation text / seal zone, so use plain margin.
      const boxYBottom = margin;
      const boxH = yCursor - boxYBottom;

      page.drawRectangle({
        x: boxX,
        y: boxYBottom,
        width: boxW,
        height: boxH,
        borderWidth: 1,
        borderColor: rgb(0, 0, 0),
        color: rgb(1, 1, 1),
      });

      const innerX = boxX + 10;
      const innerTop = yCursor - 12;
      const innerBottom = boxYBottom + 10;

      // Guard: if we can't fit even one line, don't emit an empty page
      if (innerTop - innerBottom < lineH) break;

      let ty = innerTop;
      while (idx < subLines.length && ty > innerBottom) {
        page.drawText(subLines[idx], { x: innerX, y: ty, size: lineSize, font: fontSerif });
        ty -= lineH;
        idx++;
      }
    }
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
export async function buildArtifactCertificatePdf(args: {
  id: string; // Artifact ID
  issuedAtUtc: string;
  registryNo?: string | null;
  parentCertificateId: string;

  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  contentHash: string; // Artifact Hash
  chainHash: string; // Linked Hash (Previous PDF hash)

  fileBuffer?: Buffer; // For embedding thumbnail if image
  caption?: string | null;

  verificationUrl: string;
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontSerif = await pdfDoc.embedFont(fontRegularBytes);
  const fontSerifBold = await pdfDoc.embedFont(fontBoldBytes);
  const fontMono = await pdfDoc.embedFont("Courier");

  const PAGE_W = 612;
  const PAGE_H = 792;
  const margin = 54;

  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const { width, height } = page.getSize();
  let y = height - margin;

  const drawText = (text: string, opts: { font: any; size: number; x?: number; y?: number; color?: any }) => {
    const x = opts.x ?? margin;
    const yy = opts.y ?? y;
    page.drawText(text, { x, y: yy, size: opts.size, font: opts.font, color: opts.color ?? rgb(0, 0, 0) });
  };
  const drawLine = () => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: rgb(0, 0, 0)
    });
  };

  // --- Header ---
  drawText("PROOF OF THOUGHT™", { font: fontSerif, size: 16 });
  y -= 22;
  drawText("Independent Digital Evidence Custodian", { font: fontSerif, size: 10 });
  y -= 18;
  drawLine();
  y -= 24;

  drawText("Certificate of Artifact Sealing", { font: fontSerifBold, size: 14 });
  y -= 24;

  // --- Meta Block ---
  const startY = y;
  const col1X = margin;
  const col2X = 320; // Start right column

  // Left Column
  drawText("ARTIFACT ID", { font: fontSerifBold, size: 8.5, color: rgb(0.4, 0.4, 0.4), x: col1X, y: y });
  y -= 12;
  drawText(args.id, { font: fontMono, size: 10, x: col1X, y: y });
  y -= 22;

  drawText("PARENT REGISTER", { font: fontSerifBold, size: 8.5, color: rgb(0.4, 0.4, 0.4), x: col1X, y: y });
  y -= 12;
  drawText(args.parentCertificateId, { font: fontMono, size: 10, x: col1X, y: y });
  y -= 22;

  // Right Column (Reset Y to top of block)
  let yRight = startY;

  drawText("ISSUED (UTC)", { font: fontSerifBold, size: 8.5, color: rgb(0.4, 0.4, 0.4), x: col2X, y: yRight });
  yRight -= 12;
  drawText(fmtUtc(args.issuedAtUtc), { font: fontMono, size: 10, x: col2X, y: yRight });
  yRight -= 22;

  drawText("REGISTRY NO.", { font: fontSerifBold, size: 8.5, color: rgb(0.4, 0.4, 0.4), x: col2X, y: yRight });
  yRight -= 12;
  drawText(args.registryNo ?? "—", { font: fontSerif, size: 10, x: col2X, y: yRight });
  yRight -= 22;

  // Sync Y to lowest point
  y = Math.min(y, yRight);

  y -= 12;
  drawLine();
  y -= 24;

  // --- Artifact Details ---
  drawText("Evidentiary Object Details (Content Manifest)", { font: fontSerifBold, size: 11 });
  y -= 20;

  // Add retrieval note
  drawText("Original bytes retrievable via Vault using private access key.", { font: fontSerif, size: 9, color: rgb(0.3, 0.3, 0.3) });
  y -= 16;

  const detStartY = y;

  // Left: Technicals
  drawText("FILENAME", { font: fontSerifBold, size: 8.5, color: rgb(0.4, 0.4, 0.4), x: col1X, y: y });
  y -= 12;
  drawText(args.originalFilename, { font: fontSerif, size: 10, x: col1X, y: y });
  y -= 20;

  drawText("MIME TYPE", { font: fontSerifBold, size: 8.5, color: rgb(0.4, 0.4, 0.4), x: col1X, y: y });
  y -= 12;
  drawText(args.mimeType, { font: fontSerif, size: 10, x: col1X, y: y });
  y -= 20;

  drawText("SIZE", { font: fontSerifBold, size: 8.5, color: rgb(0.4, 0.4, 0.4), x: col1X, y: y });
  y -= 12;
  drawText(`${args.sizeBytes.toLocaleString()} bytes`, { font: fontSerif, size: 10, x: col1X, y: y });
  y -= 20;

  // Right: Caption & Hash
  yRight = detStartY;

  drawText("ARTIFACT HASH (SHA-256)", { font: fontSerifBold, size: 8.5, color: rgb(0.4, 0.4, 0.4), x: col2X, y: yRight });
  yRight -= 12;
  // Hash might be long, split if needed or small font
  drawText(args.contentHash.substring(0, 32), { font: fontMono, size: 9, x: col2X, y: yRight });
  yRight -= 10;
  drawText(args.contentHash.substring(32), { font: fontMono, size: 9, x: col2X, y: yRight });
  yRight -= 24;

  if (args.caption) {
    drawText("CAPTION", { font: fontSerifBold, size: 8.5, color: rgb(0.4, 0.4, 0.4), x: col2X, y: yRight });
    yRight -= 12;
    const capLines = wrapText(args.caption, 45); // narrow col
    for (const l of capLines) {
      drawText(l, { font: fontSerif, size: 10, x: col2X, y: yRight });
      yRight -= 12;
    }
    yRight -= 12;
  }

  y = Math.min(y, yRight);
  y -= 12;

  // --- Thumbnail / Embedding ---
  // If it's an image, try to embed it.
  const isImage = args.mimeType.startsWith("image/") && (args.mimeType.includes("jpeg") || args.mimeType.includes("png"));

  if (isImage && args.fileBuffer) {
    try {
      let img;
      if (args.mimeType.includes("png")) img = await pdfDoc.embedPng(args.fileBuffer);
      else img = await pdfDoc.embedJpg(args.fileBuffer);

      // Constrain size
      const maxW = PAGE_W - (margin * 2);
      const maxH = 250;
      const scale = Math.min(maxW / img.width, maxH / img.height);

      const w = img.width * scale;
      const h = img.height * scale;

      page.drawImage(img, {
        x: margin,
        y: y - h,
        width: w,
        height: h
      });

      y -= (h + 20);
    } catch (e) {
      console.error("Failed to embed image thumbnail", e);
      drawText("[Image Thumbnail Unavailable]", { font: fontMono, size: 9, color: rgb(0.5, 0.5, 0.5) });
      y -= 20;
    }
  } else {
    // Placeholder for binary/other
    const boxH = 60;
    page.drawRectangle({
      x: margin, y: y - boxH, width: PAGE_W - (margin * 2), height: boxH,
      borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1, color: rgb(0.97, 0.97, 0.97)
    });
    page.drawText("BINARY OBJECT ATTACHED", { x: margin + 20, y: y - 25, size: 12, font: fontSerifBold, color: rgb(0.3, 0.3, 0.3) });
    page.drawText("Refer to artifact hash for verification.", { x: margin + 20, y: y - 45, size: 9, font: fontSerif, color: rgb(0.5, 0.5, 0.5) });
    y -= (boxH + 20);
  }

  // --- Chain Link ---
  drawLine();
  y -= 20;
  drawText("Cryptographic Chain Link", { font: fontSerifBold, size: 11 });
  y -= 16;
  drawText("This certificate is cryptographically linked to the following previous record:", { font: fontSerif, size: 9 });
  y -= 14;
  drawText("PREVIOUS HASH", { font: fontSerifBold, size: 8.5, color: rgb(0.4, 0.4, 0.4) });
  y -= 12;
  // Handle long chain hash wraps if needed, for now just mono
  drawText(args.chainHash, { font: fontMono, size: 9 });
  y -= 18;

  // --- Verification ---
  y -= 10;
  drawText("VERIFICATION URL", { font: fontSerifBold, size: 8.5, color: rgb(0.4, 0.4, 0.4) });
  y -= 12;
  drawText(args.verificationUrl, { font: fontMono, size: 9 });
  y -= 18;

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
