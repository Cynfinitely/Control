import { requireModule } from "@/lib/session";
import { formatDayLabel, parseDayParam, parseMonthParam, toDateInputValue, toMonthKey } from "@/lib/date";
import { getMonthMigraineLogs } from "@/lib/queries/migraine";
import { periodLabel } from "@/lib/period";
import PageHeader from "@/components/PageHeader";
import MigraineDiary from "./MigraineDiary";

export const metadata = { title: "Migraine" };

export default async function MigrainePage({
  searchParams,
}: {
  searchParams: { month?: string; day?: string };
}) {
  const user = await requireModule("migraine");
  const monthDate = parseMonthParam(searchParams.month);
  const monthKey = toMonthKey(monthDate);
  const todayKey = toDateInputValue(new Date());
  const monthLabel = periodLabel("monthly", monthKey);

  const parsedDay = searchParams.day ? toDateInputValue(parseDayParam(searchParams.day)) : null;
  // Only honour ?day= when it falls inside the month being shown, so the panel
  // never edits a day the calendar doesn't display.
  const requestedDay = parsedDay && parsedDay.startsWith(monthKey) ? parsedDay : null;
  const defaultDay = monthKey === toMonthKey(new Date()) ? todayKey : null;
  const selectedDay = requestedDay ?? defaultDay;

  const logs = await getMonthMigraineLogs(user.id, monthKey);
  const selectedLabel = selectedDay ? formatDayLabel(parseDayParam(selectedDay)) : "Pick a day";

  return (
    <div>
      <PageHeader
        title="Migraine"
        description="Tap a day, set pain. Add duration and a note when you can."
      />
      <MigraineDiary
        monthKey={monthKey}
        monthLabel={monthLabel}
        todayKey={todayKey}
        selectedDay={selectedDay}
        selectedLabel={selectedLabel}
        logs={logs}
      />
    </div>
  );
}
