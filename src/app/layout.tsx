import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control",
  description: "Your personal life management helper",
  icons: {
    icon: [{ url: "/icon.png", sizes: "48x48", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
