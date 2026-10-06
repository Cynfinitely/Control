import { requireModule } from "@/lib/session";
import { getBudgetCategories, getUncategorizedCount } from "@/lib/queries/budget";
import PageHeader from "@/components/PageHeader";
import Breadcrumb from "@/components/Breadcrumb";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";
import BudgetNav from "../BudgetNav";
import {
  addCategory,
  renameCategory,
  toggleCategoryHidden,
  moveCategory,
} from "../actions";

export const metadata = { title: "Budget categories" };

type Categories = Awaited<ReturnType<typeof getBudgetCategories>>;

function CategorySection({
  title,
  kind,
  categories,
}: {
  title: string;
  kind: "income" | "expense";
  categories: Categories;
}) {
  const items = categories.filter((c) => c.kind === kind);
  const inputId = `new-category-${kind}`;

  return (
    <section className="mb-8" aria-labelledby={`${kind}-categories`}>
      <h2 id={`${kind}-categories`} className="section-title mb-3">
        {title}
      </h2>
      <ActionForm
        action={addCategory}
        resetOnSuccess
        className="card mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <input type="hidden" name="kind" value={kind} />
        <div className="min-w-0 flex-1 sm:min-w-[200px]">
          <label className="label" htmlFor={inputId}>
            New {kind} category
          </label>
          <input id={inputId} name="name" className="input" placeholder="Category name" required />
        </div>
        <SubmitButton className="btn-primary touch-target" pendingLabel="Adding…">
          Add
        </SubmitButton>
      </ActionForm>

      {items.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel="h3"
          icon="wallet"
          title={`No ${kind} categories yet`}
          description="Add one above to start sorting transactions."
        />
      ) : (
        <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
          {items.map((cat, index) => {
            const renameId = `rename-${cat.id}`;
            return (
              <li
                key={cat.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3"
              >
                <div className="min-w-0 flex-1">
                  <ActionForm action={renameCategory} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={cat.id} />
                    <label htmlFor={renameId} className="sr-only">
                      Name for {cat.name}
                    </label>
                    <input
                      id={renameId}
                      name="name"
                      className={`input min-w-0 flex-1 sm:max-w-xs ${cat.isHidden ? "text-slate-500 dark:text-slate-400" : ""}`}
                      defaultValue={cat.name}
                      required
                    />
                    <SubmitButton className="btn-ghost btn-sm min-h-[40px]" pendingLabel="Saving…">
                      Rename
                    </SubmitButton>
                  </ActionForm>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    {cat.isPreset ? "Preset" : "Custom"}
                    {cat.isHidden && (
                      <span className="badge-muted">
                        <Icon name="eyeOff" className="h-3 w-3" />
                        Hidden
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <ActionForm action={moveCategory} successMessage={false}>
                    <input type="hidden" name="id" value={cat.id} />
                    <input type="hidden" name="direction" value="up" />
                    <SubmitIconButton
                      icon={<Icon name="chevronUp" className="h-4 w-4" />}
                      aria-label={`Move ${cat.name} up`}
                      disabled={index === 0}
                      className="btn-icon disabled:opacity-30"
                    />
                  </ActionForm>
                  <ActionForm action={moveCategory} successMessage={false}>
                    <input type="hidden" name="id" value={cat.id} />
                    <input type="hidden" name="direction" value="down" />
                    <SubmitIconButton
                      icon={<Icon name="chevronDown" className="h-4 w-4" />}
                      aria-label={`Move ${cat.name} down`}
                      disabled={index === items.length - 1}
                      className="btn-icon disabled:opacity-30"
                    />
                  </ActionForm>
                  <ActionForm action={toggleCategoryHidden}>
                    <input type="hidden" name="id" value={cat.id} />
                    <SubmitButton
                      className="btn-ghost btn-sm min-h-[40px]"
                      aria-label={`${cat.isHidden ? "Show" : "Hide"} ${cat.name}`}
                    >
                      <Icon name={cat.isHidden ? "eye" : "eyeOff"} className="h-4 w-4" />
                      {cat.isHidden ? "Show" : "Hide"}
                    </SubmitButton>
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default async function BudgetCategoriesPage() {
  const user = await requireModule("budget");
  const [categories, uncategorizedCount] = await Promise.all([
    getBudgetCategories(user.id, true),
    getUncategorizedCount(user.id),
  ]);

  return (
    <div>
      <PageHeader help="budget:categories"
        title="Budget categories"
        description="Rename, reorder or hide preset categories, or add your own. Hidden categories disappear from pickers."
        breadcrumb={<Breadcrumb items={[{ label: "Budget", href: "/dashboard/budget" }, { label: "Categories" }]} />}
      >
        <BudgetNav active="categories" uncategorizedCount={uncategorizedCount} />
      </PageHeader>

      <CategorySection title="Expense categories" kind="expense" categories={categories} />
      <CategorySection title="Income categories" kind="income" categories={categories} />
    </div>
  );
}
