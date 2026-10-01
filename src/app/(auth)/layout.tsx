import Providers from "@/components/Providers";
import Logo from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="rounded-xl bg-white px-6 py-4 shadow-sm dark:bg-slate-800">
              <Logo variant="full" className="h-12" />
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Your personal life management helper
            </p>
          </div>
          {children}
        </div>
      </main>
    </Providers>
  );
}
