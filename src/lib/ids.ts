import crypto from "crypto";

function yyyymmddUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function newCertificateId(): string {
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `PT-${yyyymmddUTC()}-${rand}`;
}
