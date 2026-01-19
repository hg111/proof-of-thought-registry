import { dbGetSubmission, dbGetPublicChains, dbUpdatePublicChainIndex } from "../src/lib/db";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "registry.sqlite");
const db = new Database(dbPath);

const ID = "PT-20260110-5F768B";

console.log(`Inspecting ID: ${ID}`);

const validId = ID.trim();

// 1. Check Submissions
const sub = db.prepare("SELECT * FROM submissions WHERE id = ?").get(validId) as any;
console.log("Submission Status:", sub ? sub.status : "NOT FOUND");
console.log("Submission Issued At:", sub ? sub.issued_at : "N/A");
console.log("Submission PDF Key:", sub ? sub.pdf_object_key : "N/A");

// 2. Check Public Chains Before Fix
let pub = db.prepare("SELECT * FROM public_chains WHERE genesis_certificate_id = ?").get(validId) as any;
console.log("OLD Public Genesis Date:", pub ? pub.genesis_issued_at_utc : "NOT FOUND");

// 3. FORCE UPDATE
console.log("Applying Fix...");
dbUpdatePublicChainIndex(validId);

// 4. Check Public Chains After Fix
pub = db.prepare("SELECT * FROM public_chains WHERE genesis_certificate_id = ?").get(validId) as any;
console.log("NEW Public Genesis Date:", pub ? pub.genesis_issued_at_utc : "NOT FOUND");
