import Providers from "@/components/Providers";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-brand-700">Control</h1>
            <p className="mt-1 text-sm text-slate-500">
              Your personal life management helper
            </p>
          </div>
          {children}
        </div>
      </div>
    </Providers>
  );
}
