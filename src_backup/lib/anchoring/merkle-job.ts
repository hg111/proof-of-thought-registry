import { getDb } from "@/lib/db";
import crypto from "crypto";
import { buildAnchorPayload } from "./payload";

type MerkleJobResult = {
    root: string;
    leafCount: number;
    sequence: number;
    payloadHex: string;
    batchId: string; // The date key
};

/**
 * Computes SHA-256 hash of a string, returns hex.
 */
function sha256(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Deterministic Merkle Tree Construction
 * User Rule: "Pair-hash rule must be consistent (dup last if odd)"
 * Leaves must be sorted lexicographically first.
 */
export function buildMerkleTree(leaves: string[]): string {
    if (leaves.length === 0) {
        // Return empty hash (SHA256 of empty string) or a defined constant?
        // User spec doesn't specify invalid/empty tree, assuming empty batch is valid or blocked.
        // SHA256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
        return sha256("");
    }

    // 1. Sort Leaves
    let level = leaves.sort();

    // 2. Build Layers
    while (level.length > 1) {
        const nextLevel: string[] = [];
        for (let i = 0; i < level.length; i += 2) {
            const left = level[i];
            // Duplicate last if odd
            const right = (i + 1 < level.length) ? level[i + 1] : left;
            const combined = left + right; // Concatenate
            nextLevel.push(sha256(combined));
        }
        level = nextLevel;
    }

    return level[0];
}

/**
 * Runs the Daily Anchor Job
 * - Finds last batch end time
 * - Selects public items since then
 * - Builds Merkle Root
 * - Generates Payload
 * - Persists to DB
 */
export async function runDailyAnchorJob(): Promise<MerkleJobResult> {
    const db = getDb();

    // 0. Idempotency Check
    // If we already created a batch for today (e.g. earlier failed run), return it.
    // This allows us to re-run the script to retry L2 submission without creating a duplicate batch conflict.
    const today = new Date().toISOString().split("T")[0];
    const existing = db.prepare(`SELECT * FROM daily_roots WHERE day_utc = ?`).get(today) as any;
    if (existing) {
        console.log(`ℹ️  Found existing batch for ${today} (Seq: ${existing.sequence_number}). Re-using.`);
        return {
            root: existing.root_hash,
            leafCount: existing.leaf_count,
            sequence: existing.sequence_number,
            payloadHex: existing.payload_hex,
            batchId: existing.day_utc
        };
    }

    // 1. Get Last Batch info
    const lastBatch = db.prepare(`SELECT sequence_number, batch_end_at FROM daily_roots ORDER BY sequence_number DESC LIMIT 1`).get() as any;
    const nextSeq = (lastBatch?.sequence_number || 0) + 1;
    const lastEndAt = lastBatch?.batch_end_at || "1970-01-01T00:00:00Z";

    // 2. Define Batch Window
    // Cutoff: Now (or hardcoded 23:59 previous day). For MVP, we'll anchor "everything pending up to now".
    const batchEndAt = new Date().toISOString();

    // 3. Query Items
    // "is_public = 1" assumed based on DB schema.
    const items = db.prepare(`
    SELECT id, created_at, content_hash, issued_at 
    FROM submissions 
    WHERE is_public = 1 
      AND created_at > ? 
      AND created_at <= ?
  `).all(lastEndAt, batchEndAt) as any[];

    if (items.length === 0) {
        console.log("No new items to anchor.");
        // Early return or create empty batch?
        // Assuming we skip empty batches to save L2 gas.
        return { root: "", leafCount: 0, sequence: nextSeq, payloadHex: "", batchId: "" };
    }

    // 4. Compute Leaves
    // User Rule: "certId|chainId|thoughtId|hash|timestampAttestationId"
    // We mapping this to: id|content_hash|issued_at
    const leaves = items.map(item => {
        // Canonical String Format
        const raw = `${item.id}|${item.content_hash}|${item.issued_at}`;
        return sha256(raw);
    });

    // 5. Build Root
    const root = buildMerkleTree(leaves);

    // 6. Build Payload
    const payloadHex = buildAnchorPayload(nextSeq, root);

    // 7. Persist
    // day_utc key: YYYY-MM-DD. If multiple per day, maybe append seq?
    // User spec implies "Daily", so YYYY-MM-DD makes sense.
    const dayKey = batchEndAt.split("T")[0];

    const stmt = db.prepare(`
    INSERT INTO daily_roots (
      day_utc, root_hash, leaf_count, computed_at, 
      sequence_number, batch_start_at, batch_end_at, payload_hex, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    stmt.run(
        dayKey,
        root,
        leaves.length,
        new Date().toISOString(),
        nextSeq,
        lastEndAt,
        batchEndAt,
        payloadHex,
        "PENDING_L2"
    );

    return {
        root,
        leafCount: leaves.length,
        sequence: nextSeq,
        payloadHex,
        batchId: dayKey
    };
}

