import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import { ProfileForm, PasswordForm } from "./ProfileForms";

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { name: true, email: true, timezone: true },
  });

  return (
    <div>
      <PageHeader
        title="Account"
        description="Manage your profile and password."
      />

      <div className="space-y-6">
        <ProfileForm
          name={user.name ?? ""}
          email={user.email}
          timezone={user.timezone}
        />
        <PasswordForm />
      </div>
    </div>
  );
}
