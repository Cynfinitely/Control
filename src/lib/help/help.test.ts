import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HELP, type HelpEntry } from "./index";
import { MODULES, moduleForPath } from "@/lib/modules";

const entries = Object.entries(HELP) as [string, HelpEntry][];
const APP_DIR = path.resolve(__dirname, "../../app");

/** True when a page file exists for the path (dynamic segments are matched by any [param] folder). */
function routeExists(href: string): boolean {
  const segments = href.split("?")[0].split("/").filter(Boolean);
  let dir = APP_DIR;
  for (const segment of segments) {
    const direct = path.join(dir, segment);
    if (fs.existsSync(direct)) {
      dir = direct;
      continue;
    }
    return false;
  }
  return fs.existsSync(path.join(dir, "page.tsx"));
}

/** Every `help=` key passed to a PageHeader anywhere in the app. */
function keysUsedByPages(dir = APP_DIR, found = new Set<string>()): Set<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) keysUsedByPages(full, found);
    else if (entry.name.endsWith(".tsx")) {
      const source = fs.readFileSync(full, "utf8");
      for (const match of source.matchAll(/<PageHeader\s+help="([^"]+)"/g)) found.add(match[1]);
      for (const match of source.matchAll(/<PageHeader\s+help=\{`([a-z-]+):\$\{/g)) {
        for (const key of Object.keys(HELP)) if (key.startsWith(`${match[1]}:`)) found.add(key);
      }
    }
  }
  return found;
}

describe("page guides", () => {
  it.each(entries)("%s is complete", (_key, entry) => {
    expect(entry.title.length).toBeGreaterThan(2);
    expect(entry.purpose.length).toBeGreaterThan(60);
    expect(entry.steps.length).toBeGreaterThanOrEqual(3);
    expect(entry.capabilities.length).toBeGreaterThanOrEqual(3);
    for (const text of [...entry.steps, ...entry.capabilities, ...(entry.tips ?? [])]) {
      expect(text.trim().length).toBeGreaterThan(10);
    }
  });

  it("has unique titles", () => {
    const titles = entries.map(([, entry]) => entry.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("has at least one guide for every module", () => {
    const covered = new Set(
      [...keysUsedByPages()].map((key) => key.split(":")[0])
    );
    // Guide keys start with the module id, except the migraine page's folder name.
    for (const m of MODULES) expect(covered.has(m.id), `no guide for module ${m.id}`).toBe(true);
  });

  it("every guide is used by a page, and every page key has a guide", () => {
    const used = keysUsedByPages();
    expect([...used].filter((key) => !(key in HELP))).toEqual([]);
    expect(Object.keys(HELP).filter((key) => !used.has(key))).toEqual([]);
  });

  it("related links point at real pages, within the same module or Settings", () => {
    for (const [key, entry] of entries) {
      for (const link of entry.related ?? []) {
        expect(routeExists(link.href), `${key}: ${link.href} is not a page`).toBe(true);
        const target = moduleForPath(link.href);
        if (target === null) {
          expect(link.href.split("?")[0], `${key}: ${link.href}`).toBe("/dashboard/settings");
        } else {
          const own = [...keysUsedByPages()].includes(key) ? key.split(":")[0] : null;
          expect(target, `${key} links to another module: ${link.href}`).toBe(own);
        }
      }
    }
  });
});
