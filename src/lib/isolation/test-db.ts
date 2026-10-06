import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../../..");

/**
 * The database-backed tests need the SQLite Prisma client (the local and CI
 * default). When the schema has been switched to PostgreSQL they are skipped.
 */
export function sqliteClientAvailable(): boolean {
  const schema = fs.readFileSync(path.join(ROOT, "prisma/schema.prisma"), "utf8");
  return /provider = "sqlite"/.test(schema);
}

/**
 * Creates an empty SQLite database with the current schema and points
 * DATABASE_URL at it. Call before the first import of "@/lib/db".
 */
export function createTestDatabase(name: string): { cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `control-${name}-`));
  const url = `file:${path.join(dir, "test.db")}`;
  process.env.DATABASE_URL = url;
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
  return { cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}
