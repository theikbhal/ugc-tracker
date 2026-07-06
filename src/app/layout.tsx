import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UGC Tracker",
  description: "Track UGC creators, DMs, and apps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
