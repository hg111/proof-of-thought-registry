
import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";
import { config } from "../src/lib/config";

// --- Configuration ---
const DB_PATH = path.resolve(process.cwd(), "data", "registry.sqlite");
const PROTOCOL_ID = "POT1"; // 4 bytes
const VERSION = 0x01;       // 1 byte
const FLAGS = 0x00;         // 1 byte

// --- Types ---
type AnchorPayload = {
    protocolId: string;
    version: number;
    flags: number;
    sequence: number;
    merkleRootHelper: string; // The root hash
    fullPayloadHex: string;   // The 42-byte hex string to sign
};

// --- Helpers ---
function sha256(data: Buffer | string): Buffer {
    return crypto.createHash("sha256").update(data).digest();
}

/**
 * Computes a simple Merkle Root of all issued certificate hashes.
 * In a real production system, this would likely be a more complex sparse tree
 * or an incremental tree. For this MVP, we hash the sorted list of all record hashes.
 * This is "good enough" for N < 100k records as long as sorting is strict.
 */
function computeGlobalMerkleRoot(db: Database.Database): Buffer {
    // 1. Get all sealed artifacts (Genesis + Sealed Pages)
    // We only care about the CONTENT HASHES of things that are definitively ISSUED.
    // Order strictly by ID to ensure deterministic reconstruction.

    // Genesis submissions
    const genesisRows = db.prepare(`
        SELECT content_hash FROM submissions 
        WHERE status = 'issued' 
        ORDER BY id ASC
    `).all() as { content_hash: string }[];

    // Sealed artifacts (pages)
    const artifactRows = db.prepare(`
        SELECT canonical_hash FROM match_artifacts 
        WHERE status = 'sealed' 
        ORDER BY id ASC
    `).all() as { canonical_hash: string }[];

    // detailed leaves
    const leaves: Buffer[] = [];

    for (const row of genesisRows) {
        if (row.content_hash) leaves.push(Buffer.from(row.content_hash, 'hex'));
    }
    for (const row of artifactRows) {
        if (row.canonical_hash) leaves.push(Buffer.from(row.canonical_hash, 'hex'));
    }

    if (leaves.length === 0) {
        console.warn("⚠️  Registry is empty. Returning NULL hash.");
        return Buffer.alloc(32, 0);
    }

    // 2. Build the tree (Simplified implementation: Recursive pair hashing)
    // This is a standard Merkle Tree construction.
    let level = leaves;
    while (level.length > 1) {
        const nextLevel: Buffer[] = [];
        for (let i = 0; i < level.length; i += 2) {
            const left = level[i];
            const right = (i + 1 < level.length) ? level[i + 1] : left; // Duplicate last if odd

            // Hash(Left + Right)
            const combined = Buffer.concat([left, right]);
            nextLevel.push(sha256(combined));
        }
        level = nextLevel;
    }

    return level[0];
}

/**
 * Generates the Official 42-byte Anchor Payload
 */
function generatePayload(sequence: number, root: Buffer): AnchorPayload {
    // Buffer allocation
    // 4 (POT1) + 1 (Ver) + 1 (Flags) + 4 (Seq) + 32 (Root) = 42 bytes
    const buf = Buffer.alloc(42);
    let offset = 0;

    // Protocol ID
    buf.write(PROTOCOL_ID, offset, "ascii");
    offset += 4;

    // Version
    buf.writeUInt8(VERSION, offset);
    offset += 1;

    // Flags
    buf.writeUInt8(FLAGS, offset);
    offset += 1;

    // Sequence (Big Endian uint32)
    buf.writeUInt32BE(sequence, offset);
    offset += 4;

    // Merkle Root
    root.copy(buf, offset);

    return {
        protocolId: PROTOCOL_ID,
        version: VERSION,
        flags: FLAGS,
        sequence: sequence,
        merkleRootHelper: root.toString('hex'),
        fullPayloadHex: "0x" + buf.toString('hex')
    };
}

// --- Main Execution ---
function main() {
    console.log("🏛️   Proof of Thought // Civil Anchor Generator  🏛️");
    console.log("----------------------------------------------------");

    const db = new Database(DB_PATH, { readonly: true });

    // 1. Get Next Sequence Number
    // Ideally this is stored in DB. For now, we query the `ledger_anchors` table
    // to find the max sequence, or prompt the user.
    // Since we haven't implemented `ledger_anchors` fully yet, we default to determining
    // based on existing count or manual input.
    // For this script, we'll accept it as an argument or auto-increment mock.

    const lastAnchor = db.prepare(`SELECT MAX(sequence) as seq FROM ledger_anchors`).get() as { seq: number } | undefined;
    const nextSeq = (lastAnchor?.seq ?? -1) + 1; // Start at 0 if null

    console.log(`Current Registry Height: ${nextSeq}`);

    // 2. Compute Root
    console.log("Computing Global Merkle Root...");
    const root = computeGlobalMerkleRoot(db);
    console.log(`Merkle Root: ${root.toString('hex')}`);

    // 3. Generate Payload
    const payload = generatePayload(nextSeq, root);

    console.log("\n✅  ANCHOR PAYLOAD GENERATED");
    console.log("----------------------------------------------------");
    console.log(`Sequence:     ${payload.sequence}`);
    console.log(`Protocol:     ${payload.protocolId} v${payload.version}`);
    console.log(`Root:         ${payload.merkleRootHelper}`);
    console.log("----------------------------------------------------");
    console.log("HEX DATA (For L2 Transaction or OP_RETURN):");
    console.log(`\n${payload.fullPayloadHex}\n`);
    console.log("----------------------------------------------------");
    console.log("INSTRUCTIONS:");
    console.log("1. Copy the HEX DATA above.");
    console.log("2. Go to your Cold/Hardware setup.");
    console.log("3. L2: Send 0 ETH to SELF with this data in the 'Hex Data' field.");
    console.log("4. BITCOIN: Use OP_RETURN with this hex (minus '0x').");
    console.log("----------------------------------------------------");
}

main();
