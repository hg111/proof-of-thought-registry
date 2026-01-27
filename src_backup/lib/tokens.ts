import crypto from "crypto";

export function newAccessToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}
