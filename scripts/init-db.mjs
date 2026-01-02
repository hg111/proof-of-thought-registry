import fs from "fs";
import path from "path";

const dataDir = process.env.DATA_DIR || "./data";
fs.mkdirSync(dataDir, { recursive: true });

const sqlitePath = path.join(dataDir, "registry.sqlite");
if (fs.existsSync(sqlitePath)) {
  console.log("DB already exists:", sqlitePath);
  process.exit(0);
}

console.log("DB file will be created on first run by the app:", sqlitePath);
console.log("Run: npm run dev");
