// Read-only audit: reports rows that reference a record owned by a different
// user. Changes nothing. Run with the target DATABASE_URL set:
//   node scripts/check-cross-user-links.mjs
// Exit code 1 when anything is found.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// [model, relation field] pairs where both sides carry a userId.
const RELATIONS = [
  ["workFocusItem", "workDay"],
  ["foodLogEntry", "defaultMeal"],
  ["mealPlanItem", "defaultMeal"],
  ["workout", "program"],
  ["dailyReadingEntry", "item"],
  ["learningEntry", "skill"],
  ["jobApplication", "contact"],
  ["interaction", "contact"],
  ["followUp", "contact"],
  ["budgetCategoryRule", "category"],
  ["budgetTransaction", "category"],
  ["budgetTransaction", "importBatch"],
  ["reminder", "event"],
];

// Untyped links stored as linkType + linkId strings.
const LINKS = [
  ["planBlock", "todo", "todo"],
  ["planBlock", "followup", "followUp"],
  ["planBlock", "meal", "mealPlanItem"],
  ["workFocusItem", "career_goal", "careerGoal"],
  ["workFocusItem", "skill", "skill"],
];

let found = 0;

function report(label, rows) {
  if (rows.length === 0) return;
  found += rows.length;
  console.log(`\n${label}: ${rows.length}`);
  for (const row of rows.slice(0, 20)) console.log(`  ${JSON.stringify(row)}`);
  if (rows.length > 20) console.log(`  ... and ${rows.length - 20} more`);
}

for (const [model, relation] of RELATIONS) {
  const rows = await prisma[model].findMany({
    select: { id: true, userId: true, [relation]: { select: { id: true, userId: true } } },
  });
  report(
    `${model}.${relation}`,
    rows
      .filter((row) => row[relation] && row[relation].userId !== row.userId)
      .map((row) => ({ id: row.id, userId: row.userId, linkedId: row[relation].id, linkedUserId: row[relation].userId }))
  );
}

for (const [model, linkType, target] of LINKS) {
  const rows = await prisma[model].findMany({
    where: { linkType, linkId: { not: null } },
    select: { id: true, userId: true, linkId: true },
  });
  if (rows.length === 0) continue;
  const targets = await prisma[target].findMany({
    where: { id: { in: rows.map((row) => row.linkId) } },
    select: { id: true, userId: true },
  });
  const owner = new Map(targets.map((t) => [t.id, t.userId]));
  report(
    `${model} -> ${target} (${linkType})`,
    rows
      .filter((row) => owner.has(row.linkId) && owner.get(row.linkId) !== row.userId)
      .map((row) => ({ id: row.id, userId: row.userId, linkedId: row.linkId, linkedUserId: owner.get(row.linkId) }))
  );
}

await prisma.$disconnect();

if (found === 0) {
  console.log("No cross-user links found.");
} else {
  console.log(`\n${found} cross-user link(s) found. Nothing was changed.`);
  process.exit(1);
}
