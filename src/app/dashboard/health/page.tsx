import { redirect } from "next/navigation";

export const metadata = { title: "Health" };

export default function HealthPage() {
  redirect("/dashboard/health/migraine");
}
