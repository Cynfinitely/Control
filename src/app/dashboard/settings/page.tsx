import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import { ProfileForm, PasswordForm } from "./ProfileForms";
import { ThemeToggle } from "@/components/ThemeProvider";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { name: true, email: true, timezone: true },
  });

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your profile, password, and appearance."
      />

      <div className="space-y-6">
        <ProfileForm
          name={user.name ?? ""}
          email={user.email}
          timezone={user.timezone}
        />
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
