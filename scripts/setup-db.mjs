import { execSync } from "child_process";

const url = process.env.DATABASE_URL ?? "";
const isPostgres = url.startsWith("postgresql://") || url.startsWith("postgres://");

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 10_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runMigrateDeploy(attempt) {
  console.log(`Running prisma migrate deploy (attempt ${attempt}/${MAX_ATTEMPTS})...`);
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}

async function migrateWithRetry() {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      runMigrateDeploy(attempt);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        console.warn(
          `Migration attempt ${attempt} failed. Retrying in ${RETRY_DELAY_MS / 1000}s (Neon may be waking up)...`
        );
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  console.error(`All ${MAX_ATTEMPTS} migration attempts failed.`);
  throw lastError;
}

if (isPostgres) {
  if (process.env.DIRECT_URL) {
    console.log("Using DIRECT_URL for migrations.");
  } else {
    console.warn("DIRECT_URL is not set — falling back to DATABASE_URL for migrations.");
  }
  await migrateWithRetry();
} else {
  execSync("npx prisma db push", { stdio: "inherit" });
}
