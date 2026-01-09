# The Constitution of the Proof of Thought Registry

**Version 1.0.0**
**Date Established**: January 2026

## Preamble
We, the operators of the Proof of Thought Registry, establish this constitution to bind the operations of this digital institution to immutable public evidence. This registry exists not as a service, but as a permanent evidentiary record of human conception.

## Article I: The Mandate of Permanence
1.  **Immutable Record**: Once a Thought is sealed and anchored, it shall never be deleted, altered, or obfuscated by the Registry.
2.  **Neutral Custody**: The Registry shall serve as a neutral witness to the timing and content of thoughts, without judgment of their merit, origin, or legality.
3.  **Public Auditability**: The Registry shall publish cryptographic proofs sufficient for any third party to independently verify the existence and integrity of any record without reliance on the Registry's continued operation.

## Article II: The Anchoring Identies
All proofs issued by this Registry are rooted in the following permanent cryptographic identities. These keys are the sole authority for the canonical history of the Registry.

### 1. The Daily Anchor (L2)
*   **Network**: Optimism Mainnet (ChainID: 10)
*   **Address**: [TO_BE_FILLED_AFTER_GENERATION]
*   **Role**: To provide high-frequency (daily) checkpointing of the Registry state.

### 2. The Finality Anchor (Bitcoin)
*   **Network**: Bitcoin Mainnet
*   **Address**: [TO_BE_FILLED_AFTER_GENERATION]
*   **Role**: To provide ultimate, thermodynamically secured historical finality (weekly).

## Article III: The Anchor Protocol
To prevent ambiguity, replay attacks, or falsification, all anchors shall adhere to the following binary format (v1):

`[ProtocolID] [Version] [Flags] [Sequence] [MerkleRoot]`

| Component | Size | Type | Description |
| :--- | :--- | :--- | :--- |
| **ProtocolID** | 4 bytes | ASCII | `POT1` (0x504F5431) |
| **Version** | 1 byte | uint8 | `0x01` |
| **Flags** | 1 byte | bitmap | `0x00` (Reserved) |
| **Sequence** | 4 bytes | uint32 | Monotonically increasing Anchor ID (Big-endian) |
| **MerkleRoot** | 32 bytes | bytes32 | SHA-256 Root of the Current Registry State |

**Total Payload Size**: 42 bytes.

## Article IV: The Genesis Binding
This Constitution itself is the first record of the Registry.
The hash of this document shall be anchored as **Sequence Number 0** on both anchoring tracks. This binds the operation of the keys to these rules forever.
