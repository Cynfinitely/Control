import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import { ProfileForm, PasswordForm } from "./ProfileForms";
import { ThemeToggle } from "@/components/ThemeProvider";
import { getWeatherPreference } from "@/lib/queries/weather";
import WeatherLocationForm from "./WeatherLocationForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const [user, weatherPref] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
      select: { name: true, email: true, timezone: true },
    }),
    getWeatherPreference(sessionUser.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your profile, weather location, password, and appearance."
      />

      <div className="space-y-6">
        <ProfileForm
          name={user.name ?? ""}
          email={user.email}
          timezone={user.timezone}
        />
        <WeatherLocationForm current={weatherPref} />
        <PasswordForm />
        <section className="card space-y-4" aria-labelledby="appearance-title">
          <h2 id="appearance-title" className="section-title">
            Appearance
          </h2>
          <ThemeToggle />
        </section>
      </div>
    </div>
  );
}
