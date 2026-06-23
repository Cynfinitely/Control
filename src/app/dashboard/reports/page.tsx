import Link from "next/link";
import { requireUser } from "@/lib/session";
import { buildReport, type Period } from "@/lib/reports";
import { formatDate } from "@/lib/date";
import PageHeader from "@/components/PageHeader";

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
  const user = await requireUser();
  const period = (["daily", "weekly", "monthly"].includes(searchParams.period ?? "")
    ? searchParams.period
    : "daily") as Period;

  const report = await buildReport(user.id, period);

  return (
    <div>
      <PageHeader
        title="Reports"
        description={`${formatDate(report.from)} - ${formatDate(report.to)}`}
      />

      <div className="mb-6 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`/dashboard/reports?period=${p.value}`}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              p.value === period ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {report.sections.map((section) => (
          <div key={section.title} className="card">
            <h2 className="section-title mb-3">{section.title}</h2>
            <div className="grid grid-cols-2 gap-3">
              {section.stats.map((s) => (
                <div key={s.label} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
