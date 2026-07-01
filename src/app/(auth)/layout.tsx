import Providers from "@/components/Providers";
import Logo from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="rounded-xl bg-white px-6 py-4 shadow-sm">
              <Logo variant="full" className="h-12" />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Your personal life management helper
            </p>
          </div>
          {children}
        </div>
      </div>
    </Providers>
  );
}
