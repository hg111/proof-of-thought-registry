
import { dbGetSubmission, dbMarkIssued, formatRegistryNo } from "@/lib/db";
import { buildCertificatePdf } from "@/lib/pdf";
import { writePdf } from "@/lib/custody";
import { writeChainPdf } from "@/lib/chainPdf";
import { toSealDate } from "@/lib/seal";
import crypto from "crypto";

const id = "PT-20260110-F97024";

console.log(`Force-issuing (complete webhook emulation) for ${id}...`);

async function main() {
    const sub = dbGetSubmission(id);
    if (!sub) {
        console.error("Submission not found!");
        process.exit(1);
    }

    console.log("Found submission:", sub.id, sub.status);

    const issuedAtUtc = toSealDate(new Date().toISOString());
    const verificationUrl = `http://localhost:3000/verify/${encodeURIComponent(sub.id)}`;

    // Hash Logic
    const rawHash = String(sub.content_hash || "");
    const fullHash = rawHash.includes("...") || rawHash.length < 64
        ? crypto.createHash("sha256").update(String(sub.canonical_text || ""), "utf8").digest("hex")
        : rawHash;

    // 1. Build Certificate PDF
    console.log("Generating Certificate PDF...");
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
        sealPngBytes: null, // Basic seal for now
    });

    // 2. Write PDF to Disk
    const pdfObjectKey = writePdf(sub.id, pdfBytes);
    console.log("Saved PDF to:", pdfObjectKey);

    // 3. Update DB to 'issued' with PDF key
    // We pass null for receiptPdfKey initially, it will default to pdfObjectKey
    dbMarkIssued(sub.id, issuedAtUtc, pdfObjectKey, null, null);
    console.log("DB Updated to ISSUED.");

    // 4. Generate Initial Chain PDF (Genesis only)
    console.log("Generating Chain PDF...");
    // dbMarkIssued is needed FIRST so writeChainPdf can find the status/keys? 
    // Actually writeChainPdf reads dbGetSubmission, so we need the PDF key in DB first.
    // That is why we called dbMarkIssued above.
    const chainKey = await writeChainPdf(sub.id);
    console.log("Saved Chain PDF to:", chainKey);

    console.log("DONE. Record is fully fully issued.");
}

main().catch(console.error);
