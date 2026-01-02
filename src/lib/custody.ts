import fs from "fs";
import path from "path";
import { config } from "@/lib/config";

export function ensureCustodyDir(id: string) {
  const dir = path.join(config.dataDir, "submissions", id);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeCustodyText(id: string, canonicalText: string) {
  const dir = ensureCustodyDir(id);
  const p = path.join(dir, "submission.txt");
  fs.writeFileSync(p, canonicalText, "utf8");
  return p;
}

export function writePdf(id: string, pdfBytes: Buffer) {
  const dir = ensureCustodyDir(id);
  const p = path.join(dir, "certificate.pdf");
  fs.writeFileSync(p, pdfBytes);
  return p;
}
