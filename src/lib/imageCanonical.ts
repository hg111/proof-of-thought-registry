import sharp from "sharp";
import crypto from "crypto";

export async function canonicalizeImage(buf: Buffer) {
  const img = sharp(buf, { failOnError: false })
    .rotate()                     // auto-orient
    .toColorspace("srgb")
    .flatten({ background: "#ffffff" })
    .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .raw();

  const { data, info } = await img.toBuffer({ resolveWithObject: true });
  const hash = crypto.createHash("sha256").update(data).digest("hex");

  return {
    canonicalHash: hash,
    rawPixels: data, // canonical bytes
    width: info.width,
    height: info.height,
    channels: info.channels
  };
}