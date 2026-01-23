import { putArtifactFile } from "@/lib/artifactStorage";

export async function putArtifact(parentId: string, artifactId: string, name: string, buf: Buffer) {
  // For MVP: store artifacts locally (same as PDFs)
  const filePath = putArtifactFile(parentId, artifactId, name, buf);
  return filePath; // keep return type as "string" for callers
}