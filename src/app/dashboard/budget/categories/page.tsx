import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getBudgetCategories } from "@/lib/queries/budget";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import {
  addCategory,
  renameCategory,
  toggleCategoryHidden,
  moveCategory,
} from "../actions";

function CategorySection({
  title,
  kind,
  categories,
}: {
  title: string;
  kind: "income" | "expense";
  categories: Awaited<ReturnType<typeof getBudgetCategories>>;
}) {
  const items = categories.filter((c) => c.kind === kind);

  return (
    <section className="mb-8">
      <h2 className="section-title mb-3">{title}</h2>
      <form action={addCategory} className="card mb-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="kind" value={kind} />
        <div className="min-w-[200px] flex-1">
          <label className="label">New category</label>
          <input name="name" className="input" placeholder="Category name" required />
        </div>
        <SubmitButton className="btn-primary touch-target">Add</SubmitButton>
      </form>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-slate-400">No categories yet.</p>
        )}
        {items.map((cat) => (
          <div
            key={cat.id}
            className={`card flex flex-wrap items-center gap-3 py-3 ${cat.isHidden ? "opacity-60" : ""}`}
          >
            <div className="flex-1">
              <form action={renameCategory} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={cat.id} />
                <input name="name" className="input max-w-xs" defaultValue={cat.name} required />
                <SubmitButton className="btn-ghost text-xs">Rename</SubmitButton>
              </form>
              <p className="mt-1 text-xs text-slate-400">
                {cat.isPreset ? "Preset" : "Custom"}
                {cat.isHidden ? " · Hidden" : ""}
              </p>
            </div>
            <div className="flex gap-1">
              <form action={moveCategory}>
                <input type="hidden" name="id" value={cat.id} />
                <input type="hidden" name="direction" value="up" />
                <SubmitButton className="btn-ghost px-2 text-xs">↑</SubmitButton>
              </form>
              <form action={moveCategory}>
                <input type="hidden" name="id" value={cat.id} />
                <input type="hidden" name="direction" value="down" />
                <SubmitButton className="btn-ghost px-2 text-xs">↓</SubmitButton>
              </form>
              <form action={toggleCategoryHidden}>
                <input type="hidden" name="id" value={cat.id} />
                <SubmitButton className="btn-ghost text-xs">
                  {cat.isHidden ? "Show" : "Hide"}
                </SubmitButton>
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function BudgetCategoriesPage() {
  const user = await requireUser();
  const categories = await getBudgetCategories(user.id, true);

  return (
    <div>
      <PageHeader
        title="Budget categories"
        description="Customize preset categories or add your own."
        action={
          <Link href="/dashboard/budget" className="btn-ghost touch-target">
            ← Budget
          </Link>
        }
      />

      <CategorySection title="Expense categories" kind="expense" categories={categories} />
      <CategorySection title="Income categories" kind="income" categories={categories} />
    </div>
  );
}
