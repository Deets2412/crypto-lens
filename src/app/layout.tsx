import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "CryptoLens V2 — Crypto Intelligence, Zero BS",
  description:
    "Overnight crypto intelligence with a cynically honest edge. Blue Chip rankings, Casino-grade speculation analysis, BS Meters, and data-driven recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
