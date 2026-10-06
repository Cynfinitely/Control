import { describe, expect, it } from "vitest";
import {
  MODULES,
  MODULE_IDS,
  isModuleId,
  moduleFilter,
  moduleForPath,
  parseDisabledModules,
  serializeDisabledModules,
} from "./modules";
import { navSections, visibleNavSections } from "./nav";
import { REVIEW_STEPS, activeReviewSteps, isReviewComplete, reviewProgress } from "./review";

describe("module registry", () => {
  it("has unique ids and hrefs", () => {
    expect(new Set(MODULE_IDS).size).toBe(MODULES.length);
    expect(new Set(MODULES.map((m) => m.href)).size).toBe(MODULES.length);
  });

  it("gives every module a label and a description for the picker", () => {
    for (const m of MODULES) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(20);
      expect(m.href.startsWith("/dashboard/")).toBe(true);
    }
  });

  it("recognises module ids", () => {
    expect(isModuleId("budget")).toBe(true);
    expect(isModuleId("home")).toBe(false);
    expect(isModuleId(undefined)).toBe(false);
  });
});

describe("disabled module storage", () => {
  it("treats empty and missing values as everything on", () => {
    expect(parseDisabledModules("")).toEqual([]);
    expect(parseDisabledModules(null)).toEqual([]);
    expect(parseDisabledModules(undefined)).toEqual([]);
  });

  it("drops unknown ids, blanks and duplicates, in registry order", () => {
    expect(parseDisabledModules(" weather, nope ,budget,,weather")).toEqual(["weather", "budget"]);
  });

  it("round-trips through the stored CSV", () => {
    const csv = serializeDisabledModules(["reports", "plan", "plan", "unknown"]);
    expect(csv).toBe("plan,reports");
    expect(parseDisabledModules(csv)).toEqual(["plan", "reports"]);
  });
});

describe("moduleFilter", () => {
  const modules = moduleFilter(["budget"]);

  it("reports which modules are on", () => {
    expect(modules.has("budget")).toBe(false);
    expect(modules.has("todos")).toBe(true);
  });

  it("keeps items without a module and items whose module is on", () => {
    const items = [{ id: 1 }, { id: 2, module: "budget" as const }, { id: 3, module: "todos" as const }];
    expect(modules.keep(items).map((i) => i.id)).toEqual([1, 3]);
  });
});

describe("moduleForPath", () => {
  it("maps pages and nested routes to their module", () => {
    expect(moduleForPath("/dashboard/budget")).toBe("budget");
    expect(moduleForPath("/dashboard/budget/categories")).toBe("budget");
    expect(moduleForPath("/dashboard/food/planner?week=2026-W40")).toBe("food");
    expect(moduleForPath("/dashboard/health/migraine")).toBe("migraine");
    expect(moduleForPath("/dashboard/health")).toBe("migraine");
  });

  it("returns null for always-on pages", () => {
    expect(moduleForPath("/dashboard")).toBeNull();
    expect(moduleForPath("/dashboard/settings")).toBeNull();
    expect(moduleForPath("/dashboard/admin")).toBeNull();
  });
});

describe("navigation", () => {
  it("lists Home plus every module when nothing is off", () => {
    const items = navSections.flatMap((s) => s.items);
    expect(items[0]).toMatchObject({ href: "/dashboard", label: "Home" });
    expect(items).toHaveLength(MODULES.length + 1);
  });

  it("hides switched-off modules and drops empty sections", () => {
    const grow = MODULES.filter((m) => m.section === "Grow").map((m) => m.id);
    const sections = visibleNavSections([...grow, "budget"]);
    expect(sections.map((s) => s.title)).toEqual(["Today", "Track", "Reflect"]);
    expect(sections.flatMap((s) => s.items).some((i) => i.module === "budget")).toBe(false);
  });

  it("always keeps Home, even with every module off", () => {
    const sections = visibleNavSections(MODULE_IDS);
    expect(sections.flatMap((s) => s.items).map((i) => i.href)).toEqual(["/dashboard"]);
  });
});

describe("weekly review with modules off", () => {
  it("leaves out steps of switched-off modules and keeps plan-ahead", () => {
    const steps = activeReviewSteps(["budget", "religious"]);
    expect(steps.map((s) => s.id)).toEqual(["inbox", "goals", "people", "plan-ahead"]);
    expect(activeReviewSteps(MODULE_IDS).map((s) => s.id)).toEqual(["plan-ahead"]);
    expect(activeReviewSteps([])).toHaveLength(REVIEW_STEPS.length);
  });

  it("counts progress and completion over the active steps only", () => {
    const steps = activeReviewSteps(["budget", "religious"]);
    const done = ["inbox", "goals", "people", "plan-ahead"];
    expect(reviewProgress(done, steps)).toEqual({ done: 4, total: 4 });
    expect(isReviewComplete(done, steps)).toBe(true);
    expect(isReviewComplete(done)).toBe(false);
  });
});
