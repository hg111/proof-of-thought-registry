// src/lib/seal.ts
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { config } from "@/lib/config";

type Variant = "MINTED" | "ENGRAVED";
type BgMode = "transparent" | "white";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`Seal engraver failed (code ${code}).\n${out}\n${err}`));
    });
  });
}


export function toSealDate(isoUtc: string) {
  // "2026-01-03T20:38:56.901Z" -> "2026.01.03 • 20:38:56 UTC"
  const d = new Date(isoUtc);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}.${mm}.${dd} • ${hh}:${mi}:${ss} UTC`;
}

function toSealDateSafe(isoUtc: string) {
  const s = String(isoUtc || "-").trim();
  if (!s) return "—";

  // If someone already passed a pre-formatted string like "2026.01.04 • 07:36:13 UTC"
  if (s.includes("•") && s.toUpperCase().includes("UTC")) return s;

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s; // don't produce NaN.NaN…

  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}.${mm}.${dd} • ${hh}:${mi}:${ss} UTC`;
}

function fullHexHash(input: string) {
  // keep only hex, no prefixes, no ellipses
  return (input || "").toLowerCase().replace(/[^0-9a-f]/g, "");
}

export async function generateSealPng(args: {
  certId: string;
  issuedAtUtcIso: string;
  variant: Variant;
  registryNo: string;          // NEW
  contentHash: string;         // NEW (full)
  verificationUrl: string;     // NEW
  holderName: string;          // NEW
  bg?: BgMode;
  resize?: number;             // NEW: Explicit output size
}) {
  const scriptPath = path.join(process.cwd(), "scripts", "generate_seal.py");

  // ✅ always 2x template for both tiers
  const template = "proof_of_thought_timestamp_seal_template-2x.png";
  // ✅ Always 2x template for both tiers
  const inputPath = path.join(process.cwd(), "scripts", "templates", "proof_of_thought_timestamp_seal_template-2x.png");
  const tmpDir = path.join(config.dataDir, "tmp");
  ensureDir(tmpDir);

  const outPath = path.join(tmpDir, `seal_${args.certId}_${args.variant}.png`);

  const dateText = toSealDateSafe(args.issuedAtUtcIso); // ✅ fixed width, dots, UTC, no spill
  const hashHex = `SHA-256: ${fullHexHash(args.contentHash)}`; // ✅ restores prefix

  // Detect correct font path (Docker/Linux vs Local/Mac)
  // Alpine 'font-noto' installs to /usr/share/fonts/noto/
  let fontPath = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";
  if (process.platform === "linux") {
    fontPath = "/usr/share/fonts/noto/NotoSans-Bold.ttf";
    if (!fs.existsSync(fontPath)) {
      // Fallback to regular if bold is missing
      fontPath = "/usr/share/fonts/noto/NotoSans-Regular.ttf";
    }
  }

  const scriptArgs = [
    scriptPath,
    "--date", dateText,
    "--cert_id", args.certId,
    "--registry_no", args.registryNo || "",
    "--hash", hashHex,
    "--verify", args.verificationUrl || "",
    "--holder", args.holderName || "",
    "--font", fontPath,

    // ✅ NEW: tell python which output mode + background to use
    "--variant", args.variant,                 // "MINTED" | "ENGRAVED"
    "--bg", args.bg ?? "transparent",          // "transparent" | "white"

    "--input", inputPath,
    "--output", outPath,
  ];

  if (args.resize) {
    scriptArgs.push("--resize", String(args.resize));
  }

  await run("python3", scriptArgs);

  return fs.readFileSync(outPath);
}