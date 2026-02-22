import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "CoinDebrief — Crypto Intelligence, Zero BS",
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
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
