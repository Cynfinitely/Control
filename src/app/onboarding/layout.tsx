import Providers from "@/components/Providers";
import Logo from "@/components/Logo";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <main id="main-content" className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-slate-900 sm:py-12">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-6 flex justify-center">
            <div className="rounded-xl bg-white px-6 py-4 shadow-sm dark:bg-slate-800">
              <Logo variant="full" className="h-10" />
            </div>
          </div>
          {children}
        </div>
      </main>
    </Providers>
  );
}
