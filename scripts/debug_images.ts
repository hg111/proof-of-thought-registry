
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function main() {
    const images = [
        "/Users/haggai/.gemini/antigravity/brain/f8ab053e-ec4e-4af5-bc0c-2e95ec223a32/uploaded_image_0_1768025100057.jpg",
        "/Users/haggai/.gemini/antigravity/brain/f8ab053e-ec4e-4af5-bc0c-2e95ec223a32/uploaded_image_1_1768025100057.jpg"
    ];

    console.log("Testing PDF embedding for uploaded images...");

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    for (const imgPath of images) {
        if (!fs.existsSync(imgPath)) {
            console.error(`Missing: ${imgPath}`);
            continue;
        }

        const buf = fs.readFileSync(imgPath);
        console.log(`Reading ${path.basename(imgPath)} (${buf.length} bytes)`);

        try {
            // Try JPG first (since file said JPG)
            console.log("Attempting embedJpg...");
            await pdfDoc.embedJpg(buf);
            console.log("✅ Success as JPG");
            continue;
        } catch (e: any) {
            console.log(`❌ Failed as JPG: ${e.message}`);
        }

        try {
            console.log("Attempting embedPng...");
            await pdfDoc.embedPng(buf);
            console.log("✅ Success as PNG");
        } catch (e: any) {
            console.log(`❌ Failed as PNG: ${e.message}`);
        }
    }
}

main();
