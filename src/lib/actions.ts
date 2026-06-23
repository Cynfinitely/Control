import { auth } from "@/lib/auth";

export async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export function parseDate(value: FormDataEntryValue | null): Date {
  if (!value) return new Date();
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? new Date() : d;
}

export function parseOptionalDate(value: FormDataEntryValue | null): Date | null {
  if (!value || String(value).trim() === "") return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

export function num(value: FormDataEntryValue | null, fallback = 0): number {
  if (value === null || String(value).trim() === "") return fallback;
  const n = Number(value);
  return isNaN(n) ? fallback : n;
}

export function str(value: FormDataEntryValue | null): string {
  return value ? String(value).trim() : "";
}

export function optStr(value: FormDataEntryValue | null): string | null {
  const s = str(value);
  return s === "" ? null : s;
}
