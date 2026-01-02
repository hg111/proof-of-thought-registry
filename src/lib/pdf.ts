import { PDFDocument } from "pdf-lib";
import { StandardFonts } from "pdf-lib";
import { rgb } from "pdf-lib";  

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
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([612, 792]); // US Letter (8.5x11)
  const { width, height } = page.getSize();

  const fontSerif = await pdfDoc.embedFont("Times-Roman");
  const fontSerifBold = await pdfDoc.embedFont("Times-Bold");
  const fontMono = await pdfDoc.embedFont("Courier");

  const margin = 54;
  let y = height - margin;

  const drawLine = () => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
    });
  };

  const drawText = (text: string, opts: { font: any; size: number; x?: number; y?: number } ) => {
    const x = opts.x ?? margin;
    const yy = opts.y ?? y;
    page.drawText(text, { x, y: yy, size: opts.size, font: opts.font });
  };

  // Header
  drawText("PROOF OF THOUGHT™", { font: fontSerifBold, size: 16 });
  y -= 16 + 6;
  drawText("Independent Digital Evidence Custodian", { font: fontSerif, size: 10 });
  y -= 10 + 10;
  drawLine();
  y -= 18;

  drawText("Certificate of Conception & Possession", { font: fontSerifBold, size: 13 });
  y -= 13 + 16;

  // Meta blocks
  const label = (t: string) => {
    drawText(t, { font: fontSerifBold, size: 10 });
    y -= 10 + 4;
  };
  const mono = (t: string) => {
    drawText(t, { font: fontMono, size: 10 });
    y -= 10 + 10;
  };
  const body = (t: string) => {
    const lines = String(t ?? "").split("\n");
    for (const line of lines) {
      drawText(line, { font: fontSerif, size: 10 });
      y -= 10 + 3;
    }
    y -= 7; // extra breathing room after a block
  };

  label("CERTIFICATE ID"); mono(args.id);
  label("REGISTRY NO."); mono(args.registryNo ?? "—");
  label("ISSUED AT (UTC)"); mono(args.issuedAtUtc);

  if (args.title) {
    label("TITLE"); body(args.title);
  }

  if (args.holderName || args.holderEmail) {
    label("HOLDER (DECLARANT)");
    body(
      `${args.holderName ? `Name: ${args.holderName}` : "Name: —"}\n\n` +
      `${args.holderEmail ? `Email: ${args.holderEmail}` : "Email: —"}`
    );
  }

  drawLine();
  y -= 18;

  // Declaration
  drawText("Declaration", { font: fontSerifBold, size: 11 });
  y -= 11 + 8;

  const decl = "This certificate attests that the Holder possessed the Original Submission in the form recorded below at the stated time. The submission was preserved in third-party custody and digitally sealed using cryptographic hashing.";
  for (const line of wrapText(decl, 100)) {
    drawText(line, { font: fontSerif, size: 10 });
    y -= 10 + 3;
  }
  y -= 10;

  // Original submission box
  drawText("Original Submission (verbatim)", { font: fontSerifBold, size: 11 });
  y -= 11 + 8;

  const boxX = margin;
  const boxW = width - margin * 2;
  const boxH = 260;
  const boxY = y - boxH;



  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxW,
    height: boxH,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
    color: rgb(1, 1, 1),  // explicit white fill (not black)
    //opacity: 0,           // effectively “no fill”
  });

  let ty = y - 12;
  const textLines = wrapText(args.canonicalText, 110).slice(0, 9999);
  for (const line of textLines) {
    if (ty < boxY + 10) break;
    page.drawText(line, { x: boxX + 10, y: ty, size: 9, font: fontSerif });
    ty -= 9 + 3;
  }

  y = boxY - 18;

  // Fingerprint
  drawText("Digital Fingerprint", { font: fontSerifBold, size: 11 });
  y -= 11 + 8;

  label("Hash Algorithm"); mono("SHA-256");
  label("Content Hash"); mono(args.contentHash);

  label("Verification");
  // URL in mono, wrapped
  for (const line of wrapText(args.verificationUrl, 95)) {
    drawText(line, { font: fontMono, size: 9 });
    y -= 9 + 3;
  }
  y -= 10;

  drawLine();
  y -= 16;

  drawText("Limitation of Purpose", { font: fontSerifBold, size: 10 });
  y -= 10 + 6;

  const lim = "This certificate establishes third-party custody and timestamped possession evidence. It does not constitute legal advice, patent registration, or governmental filing.";
  for (const line of wrapText(lim, 105)) {
    drawText(line, { font: fontSerif, size: 9 });
    y -= 9 + 3;
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}