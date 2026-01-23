import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { config } from "@/lib/config";

export async function GET() {
    try {
        const tmpDir = path.join(config.dataDir, "tmp");
        if (!fs.existsSync(tmpDir)) {
            return NextResponse.json({ status: "skipped", message: "dir not found" });
        }

        const files = fs.readdirSync(tmpDir);
        let deleted = 0;
        let sizeFreed = 0;

        for (const file of files) {
            if (file.endsWith(".png")) {
                const p = path.join(tmpDir, file);
                const stats = fs.statSync(p);
                sizeFreed += stats.size;
                fs.unlinkSync(p);
                deleted++;
            }
        }

        return NextResponse.json({
            status: "success",
            deletedCount: deleted,
            freedBytes: sizeFreed,
            message: `Cleaned ${deleted} files from ${tmpDir}`
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
