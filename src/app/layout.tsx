import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control",
  description: "Your personal life management helper",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
