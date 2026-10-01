import { shiftPeriodDate } from "@/lib/period";
import { toMonthKey } from "@/lib/date";
import StepNavigator from "@/components/StepNavigator";

type Props = {
  basePath: string;
  monthKey: string;
  monthLabel: string;
  /** Selected day; carried along only when it falls inside the target month. */
  dayValue?: string;
  extraParams?: Record<string, string>;
  className?: string;
};

export default function MonthNavigator({ basePath, monthKey, monthLabel, dayValue, extraParams, className }: Props) {
  const [year, month] = monthKey.split("-").map(Number);
  const ref = new Date(year, month - 1, 1);
  const todayKey = toMonthKey(new Date());
  const isCurrentMonth = monthKey === todayKey;

  function buildUrl(targetKey: string) {
    const params = new URLSearchParams(extraParams);
    if (targetKey !== todayKey) params.set("month", targetKey);
    if (dayValue && dayValue.startsWith(targetKey)) params.set("day", dayValue);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const prevKey = toMonthKey(shiftPeriodDate("monthly", -1, ref));
  const nextKey = toMonthKey(shiftPeriodDate("monthly", 1, ref));

  return (
    <StepNavigator
      className={className}
      label={monthLabel}
      prev={{ href: buildUrl(prevKey), label: "Previous month" }}
      next={{ href: buildUrl(nextKey), label: "Next month" }}
      reset={isCurrentMonth ? undefined : { href: buildUrl(todayKey), label: "Go to this month", text: "This month" }}
    />
  );
}
