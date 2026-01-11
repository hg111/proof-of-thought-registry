import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { dbGetSubmission, dbSetSealObjectKey } from "@/lib/db";
import { config } from "@/lib/config";
import { generateSealPng } from "@/lib/seal";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = String(ctx.params.id || "");
    const url = new URL(req.url);
    const token = url.searchParams.get("t") || "";

    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const sub = dbGetSubmission(id);
    if (!sub) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (sub.access_token !== token) return NextResponse.json({ error: "Access denied." }, { status: 403 });

    if (sub.status !== "issued" && sub.status !== "paid") {
      return NextResponse.json({ error: "Certificate not issued yet." }, { status: 409 });
    }

    const key = (sub as any).seal_object_key as string | null;
    let fullPath = "";

    // If key exists, check if file exists
    if (key) {
      fullPath = path.isAbsolute(key) ? key : path.join(config.dataDir, key);
    }

    // Lazy Gen Logic:
    // If NO key, OR (key exists but file missing) -> Generate
    if (!key || (key && !fs.existsSync(fullPath))) {
      console.log(`[SealDownload] Lazy generating seal for ${sub.id}`);

      // Ensure we have a valid ISO string, or fallback to now
      const issuedAt = (sub as any).issued_at || new Date().toISOString();

      const pngBuffer = await generateSealPng({
        certId: sub.id,
        issuedAtUtcIso: issuedAt,
        variant: "ENGRAVED", // Force Engraved for this download route
        registryNo: (sub as any).registry_no ? `R-${String((sub as any).registry_no).padStart(16, "0")}` : "R-0000000000000000",
        contentHash: (sub as any).content_hash,
        verificationUrl: `${config.appBaseUrl}/verify/${sub.id}`,
        holderName: (sub as any).holder_name || "",
        bg: "white" // Standalone download should be white bg? Or check user pref? Standard is white for "Download Seal".
      });

      // Define path
      const filename = `seal_${sub.id}_ENGRAVED.png`;
      const relativePath = path.join("seals", filename);
      fullPath = path.join(config.dataDir, relativePath);

      // Ensure dir
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, pngBuffer);

      // Update DB
      dbSetSealObjectKey(sub.id, relativePath);
    }

    // Final check
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "Seal generation failed." }, { status: 500 });
    }

    const png = fs.readFileSync(fullPath);
    return new NextResponse(png, {
      headers: {
        "content-type": "image/png",
        "content-disposition": `attachment; filename="Seal-${sub.id}.png"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[SealDownload] Error:", e);
    return NextResponse.json({ error: e?.message || "Error." }, { status: 500 });
  }
}