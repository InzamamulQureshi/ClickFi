import "./globals.css";
import type { Metadata, Viewport } from "next";
import { FarcasterProvider } from "@/lib/farcaster-auth";

export const metadata: Metadata = {
  metadataBase: new URL('https://your-domain.com'), // Add this to fix the warning
  title: "Monad Clicker",
  description: "Click to earn on Monad blockchain! 🚀 Compete with friends and unlock epic boosters!",
  openGraph: {
    title: "Monad Clicker - Web3's Most Addictive Game",
    description: "Click, earn, and dominate on Monad blockchain! 🚀",
    images: [
      {
        url: "/monad-clicker-preview.png",
        width: 600,
        height: 400,
        alt: "Monad Clicker Game Preview"
      }
    ]
  },
  other: {
    // Farcaster MiniApp meta tags
    "fc:miniapp": JSON.stringify({
      name: "Monad Clicker",
      description: "Click to earn on Monad blockchain! Compete with friends and unlock boosters!",
      icon: "/icon.png",
      homeUrl: "/",
      imageUrl: "/preview.png",
      buttonTitle: "Play Now",
      splashImageUrl: "/splash.png",
      splashBackgroundColor: "#1e1b4b"
    }),
    // Backward compatibility
    "fc:frame": "vNext",
    "fc:frame:image": "/preview.png",
    "fc:frame:button:1": "🎮 Play Monad Clicker",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "/"
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7c3aed',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          body { 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #1e1b4b, #312e81, #3730a3);
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
            min-height: 100vh;
          }
        `}</style>
      </head>
      <body suppressHydrationWarning>
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
      </body>
    </html>
  );
}