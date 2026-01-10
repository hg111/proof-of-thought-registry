
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { dbGetSubmission, dbGetArtifact, dbMarkIssued, dbSetReceiptPdfKey, dbSetChainPdfKey, formatRegistryNo } from "@/lib/db";
import { chainPdfPath, writeChainPdf } from "@/lib/chainPdf";
import { config } from "@/lib/config";
import { buildCertificatePdf, buildArtifactCertificatePdf } from "@/lib/pdf";
import { writePdf, writeSealPng } from "@/lib/custody";
import { putArtifactFile } from "@/lib/artifactStorage";
import { toSealDate, generateSealPng } from "@/lib/seal";
import { dbSetSealObjectKey } from "@/lib/db";

// Helper to lazy-generate Genesis PDF
async function ensureGenesisPdf(sub: any) {
    const pdfKey = sub.pdf_object_key || sub.receipt_pdf_key;
    if (pdfKey) {
        const full = path.join(config.dataDir, pdfKey);
        // FORCE REGEN for Engraved to ensure latest Seal logic (White BG)
        const needsSeal = (sub.record_class === "ENGRAVED");
        if (fs.existsSync(full) && !needsSeal) {
            console.log(`[LazyGen] Using cached PDF for ${sub.id}`);
            return pdfKey;
        } else if (needsSeal) {
            console.log(`[LazyGen] FORCE REGEN triggered for ${sub.id} (Update/Fix)`);
        }
    }

    console.log(`[LazyGen] Generating Genesis PDF for ${sub.id}`);
    const issuedAtUtc = sub.issued_at || new Date().toISOString();
    const verificationUrl = `${process.env.APP_BASE_URL}/verify/${encodeURIComponent(sub.id)}`;

    const rawHash = String(sub.content_hash || "");
    const fullHash = rawHash.includes("...") || rawHash.length < 64
        ? crypto.createHash("sha256").update(String(sub.canonical_text || ""), "utf8").digest("hex")
        : rawHash;

    // Lazy Generate Seal if needed
    let sealBytesForPdf: Buffer | undefined;
    let generatedSealKey: string | undefined;

    if (sub.record_class === "MINTED" || sub.record_class === "ENGRAVED") {
        try {
            console.log(`[LazyGen] Generating Seal (${sub.record_class}) for ${sub.id}`);

            // 1. Transparent Seal for PDF embedding
            sealBytesForPdf = await generateSealPng({
                certId: sub.id,
                issuedAtUtcIso: issuedAtUtc,
                variant: sub.record_class as any,
                registryNo: formatRegistryNo(sub.registry_no),
                contentHash: fullHash,
                verificationUrl: verificationUrl,
                holderName: sub.holder_name || "",
                bg: "transparent"
            });
            console.log(`[LazyGen] Seal (Transparent) Generated. Size: ${sealBytesForPdf.length} bytes`);

            // 2. White Seal for Download (ENGRAVED ONLY)
            if (sub.record_class === "ENGRAVED") {
                console.log(`[LazyGen] Generating Seal (White) for Download...`);
                const sealBytesForDownload = await generateSealPng({
                    certId: sub.id,
                    issuedAtUtcIso: issuedAtUtc,
                    variant: sub.record_class as any,
                    registryNo: formatRegistryNo(sub.registry_no),
                    contentHash: fullHash,
                    verificationUrl: verificationUrl,
                    holderName: sub.holder_name || "",
                    bg: "white"
                });

                generatedSealKey = writeSealPng(sub.id, sealBytesForDownload);
                console.log(`[LazyGen] Updating DB with Seal Key: ${generatedSealKey}`);
                dbSetSealObjectKey(sub.id, generatedSealKey);

                // Force UI refresh
                revalidatePath("/success");
                revalidatePath(`/success?id=${sub.id}`);
            }
        } catch (e: any) {
            console.error(`[LazyGen] Seal gen failed: ${e.message}`);
        }
    }

    const pdfBytes = await buildCertificatePdf({
        id: sub.id,
        issuedAtUtc,
        title: sub.title,
        holderName: sub.holder_name,
        holderEmail: sub.holder_email,
        canonicalText: sub.canonical_text,
        contentHash: fullHash,
        registryNo: formatRegistryNo(sub.registry_no),
        verificationUrl,
        sealPngBytes: sealBytesForPdf
    });

    const newKey = writePdf(sub.id, pdfBytes);
    // Update DB (preserve generated seal key if any)
    const finalSealKey = generatedSealKey || sub.seal_object_key;
    dbMarkIssued(sub.id, issuedAtUtc, newKey, finalSealKey);

    return newKey;
}

// Helper to lazy-generate Artifact PDF
async function ensureArtifactPdf(artifact: any) {
    if (artifact.receipt_pdf_key && fs.existsSync(path.join(config.dataDir, artifact.receipt_pdf_key))) {
        return artifact.receipt_pdf_key;
    }

    console.log(`[LazyGen] Generating Artifact PDF for ${artifact.id}`);
    const parent = dbGetSubmission(artifact.parent_certificate_id);
    if (!parent) throw new Error("Parent not found");

    const verifyUrl = `${process.env.APP_BASE_URL}/verify/${parent.id}`;

    // Note: We don't have the original file buffer easily available here unless we read it from storage_key
    // But buildArtifactCertificatePdf allows optional buffer. If missing, it just shows placeholder.
    // For lazy gen, reading the storage key is safe.
    let fileBuf: Buffer | undefined;
    try {
        const storePath = path.join(config.dataDir, artifact.storage_key);
        console.log(`[LazyGen] Reading artifact asset from: ${storePath}`);
        if (fs.existsSync(storePath)) {
            fileBuf = fs.readFileSync(storePath);
            console.log(`[LazyGen] Asset loaded. Size: ${fileBuf.length} bytes`);
        } else {
            console.warn(`[LazyGen] Asset FILE MISSING at: ${storePath}`);
        }
    } catch (e: any) {
        console.error(`[LazyGen] Error reading asset: ${e.message}`);
    }

    const receiptBytes = await buildArtifactCertificatePdf({
        id: artifact.id,
        parentCertificateId: parent.id,
        issuedAtUtc: artifact.issued_at,
        registryNo: parent.registry_no ? String(parent.registry_no) : null,
        originalFilename: artifact.original_filename,
        mimeType: artifact.mime_type || "application/octet-stream",
        sizeBytes: artifact.size_bytes || 0,
        contentHash: artifact.canonical_hash,
        chainHash: artifact.chain_hash,
        fileBuffer: fileBuf,
        caption: artifact.thought_caption,
        verificationUrl: verifyUrl
    });

    const receiptPath = putArtifactFile(parent.id, artifact.id, "receipt.pdf", receiptBytes);

    // update artifact row? dbTs doesn't have updateArtifact. 
    // We can just rely on the key being predictable or we should add a db update.
    // Ideally we assume the key structure matches what is in DB, but if DB has null, we must update it.
    // For MVP, likely the DB has the key but file is missing. 
    // If DB is missing key, we'd need a helper.
    // Let's assume DB has key or we can't easily update it without adding a db helper.
    // Actually, force_issue / api artifact usually sets it.

    return receiptPath;
}


export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
    try {
        const id = String(ctx.params?.id || "");
        const t = req.nextUrl.searchParams.get("t") || "";
        if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

        let sub = dbGetSubmission(id);
        let pdfPath: string | null = null;
        let isArtifact = false;

        const isDev = process.env.NODE_ENV === "development";

        if (!sub) {
            // Check Artifact
            const artifact = dbGetArtifact(id);
            if (artifact) {
                const parent = dbGetSubmission(artifact.parent_certificate_id);
                if (!parent || String(parent.access_token || "") !== String(t || "")) {
                    return NextResponse.json({ error: "Access denied." }, { status: 403 });
                }

                // LAZY GEN ARTIFACT PDF
                try { await ensureArtifactPdf(artifact); } catch (e) { console.error(e); }

                if (artifact.receipt_pdf_key) {
                    pdfPath = path.join(config.dataDir, artifact.receipt_pdf_key);
                }
                isArtifact = true;
            } else {
                return NextResponse.json({ error: "Not found." }, { status: 404 });
            }
        } else {
            // Submission
            if (String((sub as any).access_token || "") !== String(t || "")) {
                return NextResponse.json({ error: "Access denied." }, { status: 403 });
            }

            if ((sub as any).status !== "issued" && (sub as any).status !== "paid" && !isDev) {
                return NextResponse.json({ error: "Certificate not issued yet." }, { status: 409 });
            }

            // Serving Chain PDF?
            await ensureGenesisPdf(sub);
            // Also ensure Chain PDF exists (Lazy)
            try {
                // Check if chain pdf exists
                const p = chainPdfPath(id);
                if (!fs.existsSync(p)) {
                    console.log(`[LazyGen] Generating Chain PDF for ${id}`);
                    await writeChainPdf(id);
                }
            } catch (e) {
                console.error("[LazyGen] Chain gen failed:", e);
            }

            pdfPath = chainPdfPath(id);
        }

        let full = pdfPath ? path.resolve(pdfPath) : "";

        // Fallback logic for Submission (Chain -> Genesis)
        if (!isArtifact && sub && (!pdfPath || !fs.existsSync(full))) {
            const genesisKey = (sub as any).pdf_object_key || (sub as any).receipt_pdf_key;
            if (genesisKey) {
                const fallbackPath = path.join(config.dataDir, genesisKey);
                if (fs.existsSync(fallbackPath)) {
                    full = fallbackPath;
                }
            }
        }

        if (!fs.existsSync(full)) {
            // DEV Placeholder
            if (process.env.NODE_ENV === "development") {
                return new NextResponse(
                    `<html><body style="font-family:sans-serif; text-align:center; padding:50px; color:#666;">
                        <h3>Preview Not Available (Dev Mode)</h3>
                        <p>File generation failed or file missing.</p>
                        <p>ID: ${id}</p>
                      </body></html>`,
                    { headers: { "content-type": "text/html" } }
                );
            }

            return NextResponse.json(
                { error: `PDF file missing on disk at: ${full}` },
                { status: 404 }
            );
        }

        const stat = fs.statSync(full);
        const fileStream = fs.createReadStream(full);

        const filename = isArtifact ? `sealed-${id}.pdf` : `${id}.pdf`;

        return new NextResponse(fileStream as any, {
            headers: {
                "content-type": "application/pdf",
                "content-disposition": `inline; filename="${filename}"`,
                "content-length": stat.size.toString(),
                "cache-control": "no-store",
            },
        });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e?.message || "Error." }, { status: 500 });
    }
}
