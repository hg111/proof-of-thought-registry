# Proof of Thought™: System Architecture & Implementation Milestones
**Technical Reduction to Practice Summary for Intellectual Property Documentation**

## 1. System Architecture (MVP Implementation)

The "Proof of Thought™" system has been successfully reduced to practice as a deployable web application. The architecture is designed to enforce the core evidentiary principles: **Creation**, **Custody**, **Verification**, and **Disclosure**.

### 1.1 Technology Stack
*   **Runtime Environment**: Node.js v20 (Dockerized Linux Container on Render.com)
*   **Framework**: Next.js 14 (React Server Components for Auditability; Client Components for Interactivity)
*   **Database**: SQLite (v3) in WAL (Write-Ahead-Log) mode.
    *   *Design Choice*: A single-file relational database ensures atomicity and simplifies custodial portability (the entire "Registry" is a single file).
*   **Storage**: Local Persistent Disk (simulating custodial vault storage).
*   **Cryptography**: Node.js `crypto` module (SHA-256 for all hashing).
*   **PDF Generation**: `pdf-lib` (creating cryptographically bound PDF artifacts).

### 1.2 Data Schema (Custodial Registry)
The schema enforces the **Genesis-Chain** model.
*   **Table `submissions` (Genesis)**: Stores the root of each thought chain.
    *   `id`: `PT-YYYYMMDD-HEX` (Unique Certificate ID)
    *   `content_hash`: SHA-256 of the canonical input.
    *   `issued_at`: ISO-8601 UTC Trusted Timestamp.
    *   `unit_label`: Configurable vocabulary (e.g., "THOUGHT", "RECORD") allowing semantic customization.
    *   `record_class`: "GENESIS", "MINTED", "ENGRAVED" (Service Tiers).
*   **Table `artifacts` (Chain)**: Stores the append-only sequence of related thoughts.
    *   `parent_certificate_id`: Foreign Key linking to Genesis.
    *   `chain_hash`: SHA-256(Current_Content + Predecessor_Chain_Hash). **Implements the "Continuity of Ideation" claim.**
    *   `issued_at`: Independent timestamp for each link in the chain.
*   **Table `public_chains` (Ledger)**: A derived index for public transparency (Selective Disclosure).

---

## 2. Core Technical Primitives Implemented

The following theoretical claims have been successfully instantiated in software code:

### 2.1 Genesis Sealing & Timestamping
*   **Logic**: Users submit raw text/files -> System computes SHA-256 hash -> Stripe Payment confirms intent -> System captures server-side UTC time -> Records immutable entry in `submissions` table.
*   **Primitive**: `dbMarkIssued(id, issuedAtUtc, ...)` ensures that a record transition from "Draft" -> "Issued" is atomic and irreversible.

### 2.2 Cryptographic Chaining (The "Continuity" Claim)
*   **Logic**: When adding a new artifact (e.g., a v2 sketch) to a Genesis record:
    1.  The system retrieves the *last known hash* of the chain (`H_prev`).
    2.  It takes the new content (`C_new`).
    3.  It computes `H_new = SHA-256(C_new + H_prev)`.
    4.  It stores `H_new` as the `chain_hash` for the new artifact.
*   **Result**: It is mathematically impossible to insert, remove, or reorder a thought in the middle of a chain without invalidating all subsequent `chain_hash` values.

### 2.3 Lazy Issuance & Just-in-Time Sealing
*   **Innovation**: To optimize compute while maintaining integrity, the system implements "Lazy Issuance".
    *   The "Sealed Certificate" (PDF) is not generated until the moment of first access/download.
    *   This ensures the timestamp reflects the *finalization* event and allows for post-payment system checks before sealing.

### 2.4 Universal Binary Custody
*   **Logic**: The API (`/api/artifacts`) accepts any MIME type stream.
*   **Implementation**: Files (Images, PDFs, CAD, ZIPs) are hashed as raw binary buffers. This proves specific digital possession without requiring the system to interpret the file content (preserving privacy).

### 2.5 Dynamic Evidence Generation
*   **Evidentiary PDF**: The system programmatically assembles a PDF containing the Content, the Hash, and a QR Verification Code.
*   **Machine-Engraved Seal**: For "Engraved" tier records, the system generates a high-resolution PNG seal with the hash and timestamp visually "burned" into the graphic using backend image manipulation (`canvas`/`sharp`).

---

## 3. Implementation Milestones (Reduction to Practice)

The codebase currently fulfills the following milestones:

| Milestone | Status | Description |
| :--- | :--- | :--- |
| **01. Genesis Core** | ✅ **COMPLETE** | Full flow: Creation -> Payment -> Sealing -> PDF Receipt. |
| **02. Custodial Vault** | ✅ **COMPLETE** | Private `/vault` interface for owners to view sealed content without public disclosure. |
| **03. Chain Extension** | ✅ **COMPLETE** | Ability to append multiple artifacts to a Genesis root with cryptographic linking. |
| **04. Public Ledger** | ✅ **COMPLETE** | `/public-ledger` displays a transparency log of all issued chains (Status, ID count, Timestamps). |
| **05. Selective Disclosure** | ✅ **COMPLETE** | Public Verification URLs (`/verify/[id]`) work only for valid IDs; Private vault requires Token. |
| **06. Custom Semantics** | ✅ **COMPLETE** | v1.1 Feature allows users to define "Unit Labels" (e.g. "Theory", "sketch") for their chains. |
| **07. Anchor Prep** | 🚧 **Ready** | Architecture supports "Anchoring" Merkle Roots to Bitcoin/Ethereum (Data structures present). |

---

## 4. Conclusion for IP Team

The **Proof of Thought™** system is no longer merely a conceptual design; it is a **functioning software artifact**.
The code explicitly implements the claims regarding:
1.  **Immutable Timestamping**
2.  **Cryptographic Chaining**
3.  **Custodial Preservation**
4.  **Evidentiary Certificate Generation**

The specific implementation using robust web technologies (Next.js/SQLite) demonstrates the commercial viability and technical feasibility of the system described in the provisional application.
