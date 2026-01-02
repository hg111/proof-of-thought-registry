import fs from "fs";
import path from "path";

const ROOTS_DIR = path.join(process.cwd(), "data", "daily-roots");

export function getDailyRootForDate(day: string) {
  try {
    const file = path.join(ROOTS_DIR, `${day}.json`);
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}