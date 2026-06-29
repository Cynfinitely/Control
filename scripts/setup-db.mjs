import { execSync } from "child_process";

const url = process.env.DATABASE_URL ?? "";
const isPostgres = url.startsWith("postgresql://") || url.startsWith("postgres://");

if (isPostgres) {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} else {
  execSync("npx prisma db push", { stdio: "inherit" });
}
