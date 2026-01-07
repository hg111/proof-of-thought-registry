// scripts/qa_pdf.ts
import fs from "fs";
import path from "path";
import { buildCertificatePdf } from "../src/lib/pdf";

const outDir = path.join(process.cwd(), "data", "qa");
fs.mkdirSync(outDir, { recursive: true });

const pdfBytes = await buildCertificatePdf({
  id: "PT-QA-TEST",
  issuedAtUtc: new Date().toISOString(),
  title: "QA Certificate",
  holderName: "Haggai Goldfarb",
  holderEmail: "haggai@example.com",
  canonicalText:
    "Hello world.\n\nThis is a long paragraph test.\n" + "More text ".repeat(1000),
    //"Hello world.",
  contentHash: "d5f1705c071d3a07966e152d6238a979ac31db36ee7b877260915da010467f11",
  registryNo: "R-0000000000000001",
  verificationUrl: "http://localhost:3333/verify/PT-QA-TEST",
});

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outPath = path.join(outDir, `qa_certificate_${stamp}.pdf`);
fs.writeFileSync(outPath, pdfBytes);

console.log("Wrote:", outPath);