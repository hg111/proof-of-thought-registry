import crypto from "crypto";

export function sha256(buf: Buffer) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function merkleRootHex(leavesHex: string[]) {
  if (leavesHex.length === 0) return sha256(Buffer.from("")); // empty root

  let level: Buffer[] = leavesHex.map((h) => Buffer.from(h, "hex"));

  while (level.length > 1) {
    const next: Buffer[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : left; // duplicate last
      const parentHex = sha256(Buffer.concat([left, right]));
      next.push(Buffer.from(parentHex, "hex"));
    }
    level = next;
  }

  return level[0].toString("hex");
}