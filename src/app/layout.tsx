import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import { NotificationManager } from "@/components/NotificationManager";
import { SwipeNavigation } from "@/components/SwipeNavigation";
import { ScrollPreserver } from "@/hooks/useScrollPreservation";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Fluid",
  title: "Fluid | Hydration Tracker",
  description: "A beautiful, calm hydration tracking application.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fluid",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#082f49",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-[100dvh] flex flex-col selection:bg-water-300 selection:text-water-900 bg-background text-foreground">
        <ScrollPreserver />
        <SwipeNavigation />
        <NotificationManager />
        <div
          className="flex-1 flex flex-col pb-24 relative z-10 w-full h-full"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
            transform: "translateX(var(--swipe-shell-offset, 0px))",
            transition: "var(--swipe-shell-transition, transform 220ms ease-out)",
            willChange: "transform",
          }}
        >
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
