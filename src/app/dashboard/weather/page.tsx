import Link from "next/link";
import { requireModule } from "@/lib/session";
import { getUserWeather } from "@/lib/queries/weather";
import PageHeader from "@/components/PageHeader";
import TabNav from "@/components/TabNav";
import EmptyState from "@/components/EmptyState";
import WeatherNow from "./WeatherNow";
import DayForecast from "./DayForecast";
import WeekForecast from "./WeekForecast";

export const metadata = { title: "Weather" };

const VIEWS = [
  { href: "/dashboard/weather?view=day", label: "Daily", id: "day" },
  { href: "/dashboard/weather?view=week", label: "Weekly", id: "week" },
] as const;

export default async function WeatherPage({
  searchParams,
}: {
  searchParams: { view?: string; day?: string };
}) {
  const user = await requireModule("weather");
  const weather = await getUserWeather(user.id);
  const view = searchParams.view === "week" ? "week" : "day";

  if (!weather.pref) {
    return (
      <div>
        <PageHeader title="Weather" description="Daily and weekly forecast for your location." />
        <EmptyState
          icon="cloud-sun"
          title="Set your location"
          description="Choose a city in Settings to see current conditions, an hourly forecast, and the week ahead."
          actionLabel="Go to Settings"
          actionHref="/dashboard/settings#weather-settings-title"
        />
      </div>
    );
  }

  const { pref } = weather;

  return (
    <div>
      <PageHeader
        title="Weather"
        description={[pref.locationName, pref.region].filter(Boolean).join(" · ")}
        action={
          <Link href="/dashboard/settings#weather-settings-title" className="btn-ghost touch-target">
            Change location
          </Link>
        }
      >
        <TabNav items={VIEWS} active={view} variant="pills" aria-label="Forecast view" className="mb-0" />
      </PageHeader>

      {"error" in weather ? (
        <EmptyState
          icon="alert"
          title="Forecast unavailable"
          description="We couldn't reach the weather service. Please try again in a few minutes."
        />
      ) : (
        <>
          <WeatherNow forecast={weather.forecast} />
          {view === "week" ? (
            <WeekForecast forecast={weather.forecast} />
          ) : (
            <DayForecast forecast={weather.forecast} day={searchParams.day ?? weather.forecast.current.time.slice(0, 10)} />
          )}
        </>
      )}
    </div>
  );
}
