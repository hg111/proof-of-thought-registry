
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { runDailyAnchorJob } from "../src/lib/anchoring/merkle-job";
import { submitL2Anchor, exportBtcAnchorInstruction } from "../src/lib/anchoring/submission";
import { getDb } from "../src/lib/db";

async function main() {
    console.log("🚀 Starting Daily Anchor Job...");

    try {
        // 1. Build Batch & Merkle Root
        const result = await runDailyAnchorJob();

        if (result.leafCount === 0) {
            console.log("Check: No new items to anchor. Exiting.");
            return;
        }

        console.log(`✅ Batch Created: ${result.batchId}`);
        console.log(`   Sequence:    ${result.sequence}`);
        console.log(`   Leaf Count:  ${result.leafCount}`);
        console.log(`   Root:        ${result.root}`);
        console.log(`   Payload:     ${result.payloadHex}`);

        // 2. Submit to L2
        console.log("\nAttempting L2 Submission...");
        const txHash = await submitL2Anchor(result.payloadHex);

        if (txHash) {
            console.log(`✅ L2 Anchored! Tx: ${txHash}`);

            // Update DB
            const db = getDb();
            db.prepare(`
         UPDATE daily_roots 
         SET status = 'ANCHORED_L2', 
             published_url = ?, 
             published_at = ?
         WHERE day_utc = ?
       `).run(
                `https://optimistic.etherscan.io/tx/${txHash}`, // Optimism Mainnet
                new Date().toISOString(),
                result.batchId
            );
        } else {
            console.log("⚠️  L2 Submission skipped or failed (check logs). Status remains PENDING_L2.");
        }

        // 3. Export BTC Instructions
        // Even if L2 failed, we provide BTC instructions since the batch is finalized in DB.
        exportBtcAnchorInstruction(result.payloadHex);

    } catch (error) {
        console.error("❌ Job Failed:", error);
        process.exit(1);
    }
}

main();
