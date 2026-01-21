
import { buildAnchorPayload } from "../src/lib/anchoring/payload";

console.log("Testing buildAnchorPayload...");

// Test Case 1: Sequence 1, Empty Root (all zeros)
const seq = 1;
const root = "00".repeat(32); // 32 bytes of zeros
const expectedPrefix = "504f5431" + "01" + "00000001"; // POT1 + v1 + seq1
const expectedPayload = "0x" + expectedPrefix + root;

try {
    const result = buildAnchorPayload(seq, root);
    console.log("Input Seq:", seq);
    console.log("Input Root:", root);
    console.log("Result:  ", result);
    console.log("Expected:", expectedPayload);

    if (result === expectedPayload) {
        console.log("✅ PASS: Payload matches expected bytes.");
    } else {
        console.error("❌ FAIL: Payload mismatch.");
        process.exit(1);
    }

    // Test Case 2: Max Sequence
    const maxSeq = 0xFFFFFFFF;
    const resultMax = buildAnchorPayload(maxSeq, root);
    const expectedMaxPrefix = "504f5431" + "01" + "ffffffff";
    if (resultMax === "0x" + expectedMaxPrefix + root) {
        console.log("✅ PASS: Max sequence handled correctly.");
    } else {
        console.error("❌ FAIL: Max sequence mismatch.");
        process.exit(1);
    }

} catch (e) {
    console.error("❌ FAIL: Exception thrown", e);
    process.exit(1);
}
