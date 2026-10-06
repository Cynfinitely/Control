import fs from "node:fs";
import path from "node:path";

/**
 * Static scan of every Prisma call in `src/`. Used by static-scope.test.ts to
 * make sure each query on user data names the owning user.
 */

export type PrismaCall = {
  /** Path relative to the repo root, with forward slashes. */
  file: string;
  line: number;
  model: string;
  method: string;
  /** Raw source text of the call's arguments. */
  args: string;
};

const CALL_RE =
  /\b(?:prisma|tx)\s*\.\s*([a-zA-Z]+)\s*\.\s*(findMany|findFirst|findFirstOrThrow|findUnique|findUniqueOrThrow|create|createMany|update|updateMany|upsert|delete|deleteMany|count|aggregate|groupBy)\s*\(/g;

function listSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listSourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Returns the text between the parenthesis at `open` and its matching close. */
function readArgs(source: string, open: number): string {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return source.slice(open + 1);
}

export function scanPrismaCalls(root: string): PrismaCall[] {
  const calls: PrismaCall[] = [];
  for (const file of listSourceFiles(path.join(root, "src"))) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(CALL_RE)) {
      const open = match.index + match[0].length - 1;
      calls.push({
        file: path.relative(root, file).split(path.sep).join("/"),
        line: source.slice(0, match.index).split("\n").length,
        model: match[1],
        method: match[2],
        args: readArgs(source, open),
      });
    }
  }
  return calls;
}
