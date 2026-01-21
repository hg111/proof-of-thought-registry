
import { ethers } from "ethers";

/**
 * Option A: Hot Wallet Automation for L2
 * Sends a 0-value transaction with `data` = payloadHex
 */
export async function submitL2Anchor(payloadHex: string): Promise<string | null> {
    const rpcUrl = process.env.L2_RPC_URL;
    const privateKey = process.env.ANCHOR_PRIVATE_KEY;
    // If no target provided, send to self (burning gas for data availability)
    const targetAddress = process.env.L2_TARGET_ADDRESS;

    if (!rpcUrl || !privateKey) {
        console.warn("⚠️  Skipping L2 Anchor: Missing L2_RPC_URL or ANCHOR_PRIVATE_KEY");
        return null;
    }

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const address = await wallet.getAddress();

        console.log(`[L2] Anchoring from ${address}...`);

        const tx = await wallet.sendTransaction({
            to: targetAddress || address, // Send to self if no target
            value: 0,
            data: payloadHex
        });

        console.log(`[L2] Transaction sent: ${tx.hash}`);
        await tx.wait(1); // Wait for 1 confirmation
        console.log(`[L2] Transaction confirmed.`);

        return tx.hash;

    } catch (error) {
        console.error(`[L2] Anchor failed:`, error);
        return null;
    }
}

/**
 * Option B: Bitcoin Offline Export
 * Generates instructions for manual OP_RETURN transaction.
 */
export function exportBtcAnchorInstruction(payloadHex: string) {
    console.log("\n========================================");
    console.log("🔒 BITCOIN ANCHOR INSTRUCTIONS (MANUAL)");
    console.log("========================================");
    console.log("1. Open your Bitcoin cold wallet or Electrum.");
    console.log("2. Create a new transaction.");
    console.log("3. Add an Output: OP_RETURN");
    console.log("4. Data (Hex):");
    console.log(`   ${payloadHex}`);
    console.log("========================================\n");
    return payloadHex;
}
