import fs from "fs";
import path from "path";
import { AppDataSource } from "./database";

const sqlDir = path.resolve(__dirname, "../../sql");

function splitBatches(sql: string) {
  return sql
    .split(/^\s*GO\s*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean);
}

export async function ensureSchema() {
  if (!fs.existsSync(sqlDir)) {
    console.error("Khong tim thay thu muc SQL:", sqlDir);
    return;
  }

  const files = fs
    .readdirSync(sqlDir)
    .filter((name) => name.toLowerCase().endsWith(".sql"))
    .sort();

  for (const file of files) {
    const fullPath = path.join(sqlDir, file);
    const script = fs.readFileSync(fullPath, "utf8");
    for (const batch of splitBatches(script)) {
      try {
        await AppDataSource.query(batch);
      } catch (error) {
        console.error(`ensureSchema skip ${file}:`, (error as Error).message);
      }
    }
  }
}
