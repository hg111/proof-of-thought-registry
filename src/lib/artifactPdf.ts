import { PDFDocument } from "pdf-lib";

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
}) {
  if (!args.imageBytes || args.imageBytes.length === 0) {
    throw new Error("artifactPdf: missing imageBytes");
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const { height } = page.getSize();

  const draw = (t: string, x = 54, y = 0, s = 10) =>
    page.drawText(t, { x, y, size: s });

  let y = height - 54;
  draw("PROOF OF THOUGHT™", 54, y, 14); y -= 26;
  draw("Sealed Artifact Receipt", 54, y, 12); y -= 20;

  const block = (k: string, v: string) => {
    draw(k, 54, y, 9); y -= 14;
    draw(v, 54, y, 10); y -= 22;
  };

  block("PARENT CERTIFICATE", args.parentId);
  block("ARTIFACT ID", args.artifactId);
  block("ISSUED AT (UTC)", args.issuedAtUtc);
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
  const maxW = 612 - 54 * 2; // 504
  const maxH = 300;

  const dims = embedded.scale(1);
  const scale = Math.min(maxW / dims.width, maxH / dims.height, 1);

  const w = dims.width * scale;
  const h = dims.height * scale;

  const xImg = 54;
  const yImg = 80; // fixed safe area near bottom

  draw("ARTIFACT PREVIEW", 54, yImg + h + 10, 9);
  page.drawImage(embedded, { x: xImg, y: yImg, width: w, height: h });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}