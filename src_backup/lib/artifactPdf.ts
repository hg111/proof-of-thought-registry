import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

function fmtUtc(isoUtc: string) {
  const s = String(isoUtc || "").trim();
  if (!s) return "—";

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;

  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}.${mm}.${dd} • ${hh}:${mi}:${ss} UTC`;
}

// --- caption helpers (truncate + wrap into max 2 lines, with ellipsis) ---
function firstSentence(s: string) {
  // Keep only first "sentence-like" chunk. Conservative; avoids over-parsing.
  // Split on ., ?, ! followed by space OR end of string.
  const m = s.match(/^(.+?[.!?])(?:\s+|$)/);
  return (m ? m[1] : s).trim();
}

function truncateToWidth(
  text: string,
  font: any,
  size: number,
  maxWidth: number
) {
  const t = String(text || "").trim();
  if (!t) return "";

  if (font.widthOfTextAtSize(t, size) <= maxWidth) return t;

  const ell = "…";
  const ellW = font.widthOfTextAtSize(ell, size);

  // binary search for max substring that fits with ellipsis
  let lo = 0;
  let hi = t.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const sub = t.slice(0, mid).trimEnd();
    const w = font.widthOfTextAtSize(sub, size) + ellW;
    if (w <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  const cut = t.slice(0, lo).trimEnd();
  return cut ? `${cut}${ell}` : ell;
}

function wrapIntoTwoLines(
  text: string,
  font: any,
  size: number,
  maxWidth: number
): [string, string] {
  const t = String(text || "").trim();
  if (!t) return ["", ""];

  // If it fits on one line, return it.
  if (font.widthOfTextAtSize(t, size) <= maxWidth) return [t, ""];

  // Word wrap into at most 2 lines; second line truncated with ellipsis if needed.
  const words = t.split(/\s+/);
  let line1 = "";
  let i = 0;

  for (; i < words.length; i++) {
    const next = line1 ? `${line1} ${words[i]}` : words[i];
    if (font.widthOfTextAtSize(next, size) <= maxWidth) line1 = next;
    else break;
  }

  const rest = words.slice(i).join(" ").trim();
  const line2 = truncateToWidth(rest, font, size, maxWidth);

  return [line1, line2];
}

export async function buildArtifactPdf(args: {
  parentId: string;
  artifactId: string;
  issuedAtUtc: string;
  filename: string;
  canonicalHash: string;
  chainHash: string;
  verifyUrl: string;
  imageBytes?: Uint8Array;
  imageMime?: string;

  // NEW (optional)
  thoughtCaption?: string | null;
}) {
  if (!args.imageBytes || args.imageBytes.length === 0) {
    throw new Error("artifactPdf: missing imageBytes");
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const { height } = page.getSize();

  // Use standard fonts so this stays minimal / non-breaking
  const fontReg = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const M = 54;
  const W = 612;

  const draw = (
    t: string,
    x = M,
    y = 0,
    s = 10,
    font = fontReg,
    color = rgb(0, 0, 0)
  ) => page.drawText(t, { x, y, size: s, font, color });

  let y = height - M;

  draw("PROOF OF THOUGHT™", M, y, 14, fontBold); y -= 26;
  draw("Sealed Artifact Receipt", M, y, 12, fontBold); y -= 18;

  // --- OPTIONAL THOUGHT NOTE (caption) ---
  // Rules:
  // - max 1 sentence
  // - small italic-ish style (small + subtle gray)
  // - never pushes content to another page
  // - if overflow -> truncate with "…"
  const capRaw = String(args.thoughtCaption ?? "").trim();
  if (capRaw) {
    const cap = firstSentence(capRaw);

    const labelSize = 8.5;
    const capSize = 8.5;
    const lineH = 10.5;
    const capColor = rgb(0.25, 0.25, 0.25);

    draw("Thought Note:", M, y, labelSize, fontBold, capColor);
    y -= lineH;

    const maxWidth = W - M * 2;
    const [l1, l2] = wrapIntoTwoLines(cap, fontReg, capSize, maxWidth);
    if (l1) { draw(l1, M, y, capSize, fontReg, capColor); y -= lineH; }
    if (l2) { draw(l2, M, y, capSize, fontReg, capColor); y -= lineH; }

    y -= 8; // breathing room before blocks
  } else {
    y -= 8;
  }

  const block = (k: string, v: string) => {
    draw(k, M, y, 9, fontBold); y -= 14;
    draw(v, M, y, 10, fontReg); y -= 22;
  };

  block("PARENT CERTIFICATE", args.parentId);
  block("ARTIFACT ID", args.artifactId);
  block("ISSUED AT (UTC)", fmtUtc(args.issuedAtUtc));
  block("FILENAME", args.filename);
  block("HASH (SHA-256)", args.canonicalHash);
  block("CHAIN HASH", args.chainHash);
  block("VERIFY", args.verifyUrl);

  // --- EMBED IMAGE PREVIEW ---
  const mime = (args.imageMime || "").toLowerCase();
  const isPng =
    mime.includes("png") || args.filename.toLowerCase().endsWith(".png");

  const embedded = isPng
    ? await pdf.embedPng(args.imageBytes)
    : await pdf.embedJpg(args.imageBytes);

  // Fit into a nice box
  const maxW = 612 - M * 2; // 504
  const maxH = 300;

  const dims = embedded.scale(1);
  const scale = Math.min(maxW / dims.width, maxH / dims.height, 1);

  const w = dims.width * scale;
  const h = dims.height * scale;

  const xImg = M;
  const yImg = 80; // fixed safe area near bottom

  draw("ARTIFACT PREVIEW", M, yImg + h + 10, 9, fontBold);
  page.drawImage(embedded, { x: xImg, y: yImg, width: w, height: h });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}