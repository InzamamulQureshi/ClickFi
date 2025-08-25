import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monad Clicker",
  description: "Clicker with boosters & mock NFT mint, Next.js + Tailwind",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-gradient-to-br from-[#0f172a] via-[#111827] to-black">
      <body className="text-white">{children}</body>
    </html>
  );
}
