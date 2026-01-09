
import { dbCreateDraft, dbMarkIssued } from "../src/lib/db";
import { newCertificateId } from "../src/lib/ids";
import { newAccessToken } from "../src/lib/tokens";

// Hack to ensure we can use db which uses process.cwd()
console.log("Data Dir:", process.cwd() + "/data");

const id = newCertificateId();
const token = newAccessToken();

console.log(`Creating Public Draft (${id})...`);
dbCreateDraft({
    id,
    title: `Public Ledger Test ${Math.floor(Math.random() * 1000)}`,
    holderName: "Test User",
    holderEmail: "test@example.com",
    canonicalText: `This is public test thought number ${Date.now()}.`,
    contentHash: "hash_" + Date.now(),
    accessToken: token,
    amountCents: 2900,
    currency: "usd",
    recordClass: "GENESIS",
    isPublic: true
});

console.log("Marking as issued...");
const now = new Date().toISOString();
dbMarkIssued(id, now, "test-pdf-key", "test-seal-key");

console.log("SUCCESS: Public chain created!");
console.log("Please refresh http://localhost:3333/public-ledger");
