import fs from "fs";
import path from "path";
import { config } from "@/lib/config";

export function putArtifactFile(parentId: string, artifactId: string, name: string, buf: Buffer) {
  const dir = path.join(config.dataDir, "artifacts", parentId, artifactId);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, buf);
  return filePath;
}