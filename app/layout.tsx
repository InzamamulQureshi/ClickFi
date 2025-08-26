import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Monad Clicker | Web3 Gaming on Lightning-Fast Blockchain",
  description: "Click to earn tokens on Monad's blazing-fast blockchain! Unlock boosters, mint NFTs, and climb the leaderboards in this addictive Web3 clicker game.",
  keywords: ["Monad", "Web3", "Clicker Game", "Blockchain", "NFT", "Gaming", "Farcaster"],
  authors: [{ name: "Monad Clicker Team" }],
  metadataBase: new URL('https://monad-clicker.vercel.app'), // Change this to your actual domain
  openGraph: {
    title: "Monad Clicker - Web3's Most Addictive Game",
    description: "Click, earn, and dominate on Monad blockchain! 🚀",
    type: "website",
    images: [
      {
        url: "/og-image.png", // You'll need to create this
        width: 1200,
        height: 630,
        alt: "Monad Clicker Game"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Monad Clicker - Web3 Gaming Revolution",
    description: "The most addictive clicker game on blockchain! Click to earn on Monad ⚡",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#7c3aed',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <body className="text-white antialiased">
        <div className="min-h-screen relative overflow-hidden">
          {/* Global background effects */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}