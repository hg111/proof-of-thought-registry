import fs from "fs";
import path from "path";
import { buildCertificatePdf } from "../src/lib/pdf";

const pdfBytes = await buildCertificatePdf({
  id: "A-000000000002",
  issuedAtUtc: new Date().toISOString(),
  recordLabel: "ARTIFACT",
  parentId: "PT-QA-TEST",                 // parent CERTIFICATE ID
  registryNo: "R-0000000000000001",
  canonicalText: "Artifact text…",
  contentHash: "…artifact hash…",
  verificationUrl: "http://localhost:3333/verify/PT-QA-TEST",
  artifactId: "A-000000000002",
  artifactIssuedAtUtc: new Date().toISOString(),
  artifactHash: "…artifact hash…",
  chainHash: "…chain hash…",
});

const outDir = path.join(process.cwd(), "data", "qa");
fs.mkdirSync(outDir, { recursive: true });


const outPath = path.join(outDir, `qa_artifacts_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
fs.writeFileSync(outPath, pdfBytes);
console.log("Wrote:", outPath);