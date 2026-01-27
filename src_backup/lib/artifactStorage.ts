import fs from "fs";
import path from "path";
import { config } from "@/lib/config";

export function putArtifactFile(parentId: string, artifactId: string, name: string, buf: Buffer) {
  // KEY stored in DB (relative to dataDir)
  const key = path.join("artifacts", parentId, artifactId, name).replaceAll("\\", "/");

  // FULL path on disk
  const full = path.join(config.dataDir, key);

  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, buf);

  return key; // ✅ IMPORTANT
}

export function putSubmissionFile(parentId: string, name: string, buf: Buffer) {
  // custody location for genesis / chain receipts
  const dir = path.join(config.dataDir, "submissions", parentId);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, buf);

  // ✅ IMPORTANT: return a RELATIVE key (portable to prod storage later)
  // so DB stores: "submissions/<id>/<name>"
  return path.join("submissions", parentId, name);
}