import crypto from "crypto";

export function newArtifactId() {
  const d = new Date().toISOString().slice(0,10).replace(/-/g,"");
  return `AR-${d}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export function chainHash(prev: string, curr: string) {
  return crypto.createHash("sha256").update(prev + curr).digest("hex");
}