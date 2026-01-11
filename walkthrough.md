# Deployment Walkthrough: Proof of Thought on Render

... [Previous sections 1 and 2 omitted for brevity] ...

#- [x] Document "Post-Launch Workflow" in `walkthrough.md` <!-- id: 36 -->
- [x] Sync `walkthrough.md` to project root <!-- id: 37 -->

## Task: Universal Media Sealing
- [x] **Protocol Upgrade**: Hashing raw bytes for evidentiary rigor (not just image pixels).
- [x] **Universal UI**: "Add Seal" page now accepts *any* file type (Audio, Video, CAD, Binary).
- [x] **Asset Vault**: `GET /api/assets/[id]` endpoint created to retrieve original bytes securely.
- [x] **Evidence Certificate**: New PDF generator (`buildArtifactCertificatePdf`) creates "Content Manifest" certificates with embedded thumbnails or retrieval instructions.
- [x] **Vault Retrieval v1**: Integrated media players and "Download Original" buttons into the Vault UI.Render

## Task: UI/UX Polish (Timeline & Animation)
- [x] **Visual Chain Explorer**: Vertical "metro-style" timeline in `SuccessPage` replaces the plain list. Shows Genesis -> Artifacts sequence clearly.
- [x] **Sealing Animation**: "Hash -> Lock -> Stamp" animation plays during seal creation to provide ceremonial weight.
- [x] **Institutional Forms**: Redesigned `/start` with cleaner typography, section headers, and "Institutional Minimalist" styling.

## 3. Configure Roots Repository (Optional but Recommended)

The app publishes daily Merkle roots to a separate GitHub repository for public transparency.

1.  **Create a Public Repository**: Go to GitHub and create a new public repo (e.g., `proof-of-thought-roots`).
2.  **Generate a Personal Access Token (PAT)**:
    -   Go to GitHub Settings -> Developer Settings -> Personal Access Tokens -> Tokens (classic).
    -   Generate new token.
    -   Scopes: Select `repo` (Full control of private repositories) or at least `public_repo`.
- [x] **Public Ledger (v1)**: `/public-ledger` page displaying opt-in chains with pagination and sorting.
- [x] **Public API**: `GET /api/public-ledger` serving chain data and anchor status.
- [x] **Opt-in Mechanism**: Checkbox in `/start` flow to set `is_public` flag.

## Verification
### Public Ledger & Opt-in
1. **Database Schema**: verified `public_chains`, `ledger_anchors` tables and `is_public` column in `submissions`.
2. **Opt-in Flow**:
   - `is_public` flag successfully passed from `/start` -> `api/submissions` -> `dbCreateDraft`.
   - `dbMarkIssued` triggers `dbUpdatePublicChainIndex` to populate `public_chains`.
3. **Public Access**:
   - `/public-ledger` is accessible without authentication (middleware updated).
   - `GET /api/public-ledger` returns correct JSON structure.
   - `GET /api/public-ledger` returns correct JSON structure.
4. **UI**:
   - Ledger table correctly renders rows with sticky headers and scrollable container.
   - Column formatting is robust (dates, fonts, active status badges).
   - "Sort by" controls and Total Chains count working correctly.
   - Links from `/success` to Ledger verified.

### Local Build
- `npm run build` passed successfully.
- `date-fns` installed for date formatting.

### Docker Note
- New dependency `date-fns` requires Docker image rebuild.

## Screenshots
3.  **Add Secrets to Render**:
    -   `GITHUB_TOKEN`: The PAT you just generated.
    -   `GITHUB_OWNER`: Your username (e.g., `hg111`).
    -   `GITHUB_REPO`: The name of the new repo (e.g., `proof-of-thought-roots`).
    -   `ROOT_PUBLISH_SECRET`: A strong random string (used to secure the manual trigger endpoint).

## 4. Verify Deployment

Once deployed:
1.  Visit your `.onrender.com` URL.
2.  Test the password gate.
3.  Create a test submission.
4.  Verify that it persists (restart the service and check if data remains).

> [!TIP]
> **Database Backups**: Since the database is a single file (`/app/data/registry.sqlite`), you can SSH into the Render instance (via "Shell" tab) and copy it out, or set up a simple cron job to upload it to S3/R2 for backup.

## 5. Troubleshooting & Lessons Learned (Critical)

### Stripe "Split Brain" Configuration
If payments work but webhooks fail (or you see "Invalid API Key: price_..."), you likely have a configuration mismatch:
-   **Symptom**: Application accepts payments, but Webhook shows "0 attempts" or "Signature verification failed".
-   **Cause**: The `STRIPE_SECRET_KEY` in Render belongs to a *different* Stripe account than the one where you configured the Webhook.
-   **Fix**: Ensure the `sk_test_...` key in Render exactly matches the account you are viewing in the Stripe Dashboard.
-   **Note**: "Invalid API Key provided: price_..." usually means the Price ID exists in Account A but you are authenticated with Account B.

### PDF Generation on Starter Plans
Low-RAM servers (512MB) struggle with high-resolution image processing.
-   **Issue**: "Engraved" PDF downloads fail or time out.
-   **Cause**: Embedding 5MB+ High-Res seal images consumes all available RAM during PDF generation.
-   **Fix 1 (Optimization)**: Resize the embedded seal to ~600px (0.3MB) for the PDF document, while keeping the full 2048px version for the standalone PNG download.
-   **Fix 2 (Streaming)**: Use `fs.createReadStream` instead of `fs.readFileSync` in API routes to stream the file to the user, preventing memory spikes.

## 6. Post-Launch Development Workflow

You can continue building safely while the Beta is live. Your local environment and the live site are completely separate.

### The Safety Model
| Environment | Codebase | Database | Stripe Keys | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | Your Mac | `data/registry.sqlite` (Local) | `sk_test_...` (Env: `.env.local`) | **Sandbox**: Break things, reset DB, write new features. |
| **Production** | Render (GitHub `main`) | `registry.sqlite` (Persistent Disk) | `sk_live_...` or `sk_test_...` (Env: Render Dashboard) | **Live**: Real users, real data. Only updates when you `git push`. |

### Recommended Workflow

1.  **Develop Locally**:
    -   Run `npm run dev`.
    -   Write code, test new features.
    -   If you mess up your local database, you can just delete `data/registry.sqlite` and restart to get a fresh one. **This never touches Production.**

2.  **Test**:
    -   Always verify your changes on `localhost:3333` first.
    -   Check that the UI looks right and PDFs generate correctly.

3.  **Deploy**:
    -   When you are happy with the changes:
        ```bash
        git add .
        git commit -m "Description of new feature"
        git push
        ```
    -   Render will detect the push, build the new code, and automatically replace the running server.
    -   **Zero Data Loss**: Your Production database is on a persistent disk and is preserved across updates.

### Handling "Real Money" (Going Live)
If your Beta involves real credit card transactions:
1.  **Get Live Keys**: Go to Stripe Dashboard -> Developers -> API Keys -> Toggle "Test Data" OFF.
2.  **Update Render**:
    -   Paste `pk_live_...` and `sk_live_...` into Render Environment Variables.
    -   Create a **Live Webhook** in Stripe pointing to your `.../api/webhooks/stripe` URL and get the `whsec_...` secret. Update `STRIPE_WEBHOOK_SECRET` in Render.
3.  **Keep Local on Test**: ensure your `.env.local` on your Mac *stays* on `sk_test_...`. This prevents you from accidentally charging real cards while developing!
