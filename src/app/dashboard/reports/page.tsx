import { requireModule } from "@/lib/session";
import { buildReport, type Period } from "@/lib/reports";
import { getDisabledModules } from "@/lib/queries/modules";
import { moduleFilter } from "@/lib/modules";
import { formatDate, formatRange } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import SegmentedControl from "@/components/SegmentedControl";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";

export const metadata = { title: "Reports" };

const PERIODS: { value: Period; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const user = await requireModule("reports");
  const period = (["daily", "weekly", "monthly"].includes(searchParams.period ?? "")
    ? searchParams.period
    : "daily") as Period;

  const [report, disabledModules] = await Promise.all([buildReport(user.id, period), getDisabledModules(user.id)]);
  const sections = moduleFilter(disabledModules).keep(report.sections);
  const range =
    formatDate(report.from) === formatDate(report.to)
      ? formatDate(report.from)
      : formatRange(report.from, report.to);

  return (
    <div>
      <PageHeader help="reports" title="Reports" description={range}>
        <SegmentedControl
          aria-label="Report period"
          value={period}
          options={PERIODS.map((p) => ({
            value: p.value,
            label: p.label,
            href: `/dashboard/reports?period=${p.value}`,
          }))}
        />
      </PageHeader>

      {sections.length === 0 ? (
        <EmptyState
          icon="chart"
          title="Nothing to report yet"
          description="Reports summarize the modules you have switched on. Turn modules on in Settings and start logging to see your numbers here."
          actionLabel="Open Settings"
          actionHref="/dashboard/settings#modules"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <section key={section.title} className="card" aria-label={section.title}>
              <h2 className="section-title mb-3">{section.title}</h2>
              <div className="grid grid-cols-2 gap-3">
                {section.stats.map((s) => (
                  <StatCard
                    key={s.label}
                    surface="tile"
                    size="sm"
                    label={s.label}
                    value={s.value}
                    href={s.href}
                    icon={s.href ? "arrowRight" : undefined}
                    className={s.href ? "hover:bg-brand-50 dark:hover:bg-brand-950/60" : undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
