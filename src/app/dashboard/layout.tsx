import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import MainContainer from "@/components/MainContainer";
import ModulesProvider from "@/components/ModulesProvider";
import { requireUser } from "@/lib/session";
import { getModuleState } from "@/lib/queries/modules";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const { disabled: disabledModules } = await getModuleState(user.id);

  return (
    <Providers>
      <div className="flex min-h-screen">
        <Sidebar name={user.name ?? "User"} email={user.email ?? ""} isAdmin={isAdmin} disabledModules={disabledModules} />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 overflow-x-clip pt-14 outline-none md:pt-0">
          <ModulesProvider disabled={disabledModules}>
            <MainContainer>{children}</MainContainer>
          </ModulesProvider>
        </main>
      </div>
      <CommandPalette isAdmin={isAdmin} disabledModules={disabledModules} />
    </Providers>
  );
}
