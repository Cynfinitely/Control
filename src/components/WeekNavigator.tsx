import { addDays, formatDate, startOfWeek, toDateInputValue } from "@/lib/date";
import StepNavigator from "@/components/StepNavigator";

type Props = {
  basePath: string;
  /** Any date inside the displayed week (YYYY-MM-DD). */
  weekValue: string;
  /** Query param that carries the week (default "week"). */
  param?: string;
  extraParams?: Record<string, string>;
  /** Disable navigating past the current week. */
  noFuture?: boolean;
  className?: string;
};

export default function WeekNavigator({
  basePath,
  weekValue,
  param = "week",
  extraParams,
  noFuture = false,
  className,
}: Props) {
  const weekStart = startOfWeek(new Date(weekValue + "T00:00:00"));
  const weekEnd = addDays(weekStart, 6);
  const currentStart = startOfWeek(new Date());
  const isCurrent = toDateInputValue(weekStart) === toDateInputValue(currentStart);

  function buildUrl(start: Date) {
    const params = new URLSearchParams(extraParams);
    if (toDateInputValue(start) !== toDateInputValue(currentStart)) params.set(param, toDateInputValue(start));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const nextStart = addDays(weekStart, 7);

  return (
    <StepNavigator
      className={className}
      label={`${formatDate(weekStart)} – ${formatDate(weekEnd)}`}
      sublabel={isCurrent ? "This week" : undefined}
      prev={{ href: buildUrl(addDays(weekStart, -7)), label: "Previous week" }}
      next={{ href: buildUrl(nextStart), label: "Next week", disabled: noFuture && nextStart > new Date() }}
      reset={isCurrent ? undefined : { href: buildUrl(currentStart), label: "Go to this week", text: "This week" }}
    />
  );
}
