import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import { requireUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <Providers>
      <div className="flex min-h-screen">
        <Sidebar
          name={user.name ?? "User"}
          email={user.email ?? ""}
          isAdmin={user.role === "admin"}
        />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
        </main>
      </div>
    </Providers>
  );
}
