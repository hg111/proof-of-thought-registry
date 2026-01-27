/**
 * Canonical Payload Builder for Proof of Thought Anchors
 * Layout (41 bytes):
 * [0-3]   ProtocolID (4 bytes, ASCII) = "POT1"
 * [4]     Version (1 byte) = 0x01
 * [5-8]   SequenceNumber (4 bytes, Big Endian)
 * [9-40]  MerkleRoot (32 bytes)
 */
export function buildAnchorPayload(sequenceNumber: number, merkleRootHex: string): string {
    const PROTOCOL_ID = "POT1";
    const VERSION = 0x01;

    // 1. Validate inputs
    if (!Number.isInteger(sequenceNumber) || sequenceNumber < 0 || sequenceNumber > 0xffffffff) {
        throw new Error("Sequence number must be a 4-byte unsigned integer");
    }

    const cleanRoot = merkleRootHex.replace(/^0x/, "");
    if (cleanRoot.length !== 64) {
        throw new Error(`Merkle root must be a 32-byte hex string (got ${cleanRoot.length} chars)`);
    }

    // 2. Allocate Buffer
    const buf = Buffer.alloc(41);

    // 3. Write Data
    buf.write(PROTOCOL_ID, 0, 4, "ascii"); // Bytes 0-3
    buf.writeUInt8(VERSION, 4); // Byte 4
    buf.writeUInt32BE(sequenceNumber, 5); // Bytes 5-8

    // Write Merkle Root
    const rootBuffer = Buffer.from(cleanRoot, "hex");
    if (rootBuffer.length !== 32) {
        throw new Error("Invalid Merkle Root buffer length");
    }
    rootBuffer.copy(buf, 9); // Bytes 9-40

    // 4. Return Hex (0x prefixed)
    return "0x" + buf.toString("hex");
}
