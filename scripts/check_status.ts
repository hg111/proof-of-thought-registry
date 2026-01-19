
import { dbGetSubmission } from "@/lib/db";
const id = "PT-20260110-AB0A54";
const sub = dbGetSubmission(id);
console.log(JSON.stringify(sub, null, 2));
if (!sub) console.log("SUBMISSION NOT FOUND");
