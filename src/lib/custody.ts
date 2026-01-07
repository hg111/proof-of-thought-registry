import fs from "fs";
import path from "path";
import { config } from "@/lib/config";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

/* Canonical custody text */
export function writeCustodyText(certId: string, canonicalText: string) {
  const dir = path.join(config.dataDir, "custody");
  ensureDir(dir);

  const full = path.join(dir, `${certId}.txt`);
  fs.writeFileSync(full, canonicalText, "utf8");
}

/* Certificate PDF */
export function writePdf(certId: string, pdfBytes: Buffer) {
  const dir = path.join(config.dataDir, "pdf");
  ensureDir(dir);

  const key = `pdf/${certId}.pdf`;
  const full = path.join(config.dataDir, key);
  fs.writeFileSync(full, pdfBytes);

  return key;
}

/* Engraved seal PNG */
export function writeSealPng(certId: string, pngBytes: Buffer) {
  const dir = path.join(config.dataDir, "seals");
  ensureDir(dir);

  const key = `seals/${certId}.png`;
  const full = path.join(config.dataDir, key);
  fs.writeFileSync(full, pngBytes);

  return key;
}