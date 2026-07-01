import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const url = process.env.DATABASE_URL ?? "";
const isPostgres = url.startsWith("postgresql://") || url.startsWith("postgres://");
const provider = isPostgres ? "postgresql" : "sqlite";

let schema = fs.readFileSync(schemaPath, "utf8");
schema = schema.replace(/provider = "(sqlite|postgresql)"/, `provider = "${provider}"`);

if (isPostgres) {
  if (!schema.includes("directUrl")) {
    schema = schema.replace(
      /url\s+= env\("DATABASE_URL"\)/,
      `url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")`
    );
  }
} else {
  schema = schema.replace(/\n\s*directUrl = env\("DIRECT_URL"\)/, "");
  schema = schema.replace(/url\s+= env\("DATABASE_URL"\)/, `url      = env("DATABASE_URL")`);
}

fs.writeFileSync(schemaPath, schema);

console.log(`Prisma provider set to ${provider} (from DATABASE_URL)`);
