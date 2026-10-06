import { redirect } from "next/navigation";
import { requireModule } from "@/lib/session";

export const metadata = { title: "Health" };

export default async function HealthPage() {
  await requireModule("migraine");
  redirect("/dashboard/health/migraine");
}
