import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import { NotificationManager } from "@/components/NotificationManager";
import { ServiceWorkerManager } from "@/components/ServiceWorkerManager";
import { SwipeNavigation } from "@/components/SwipeNavigation";
import { ScrollPreserver } from "@/hooks/useScrollPreservation";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Fluid.",
  title: "Fluid. | Hydration Tracker",
  description: "A beautiful, calm hydration tracking application.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/fluid-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/fluid-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/fluid-icon-192.png",
    apple: "/fluid-apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fluid.",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Fluid.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#0b4261",
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
        <ServiceWorkerManager />
        <NotificationManager />
        <div
          className="flex-1 flex flex-col pb-24 relative z-10 w-full h-full"
          style={{
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
            transform: "translate3d(var(--swipe-shell-offset, 0px), 0, 0) scale(var(--swipe-shell-scale, 1))",
            transition: "var(--swipe-shell-transition, transform 180ms ease-out)",
            transformOrigin: "center center",
            willChange: "transform",
          }}
        >
          {children}
          <div
            className="pointer-events-none fixed inset-0 z-[70] bg-water-950"
            style={{ opacity: "var(--swipe-shell-dim, 0)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none fixed inset-y-0 left-0 z-[71] w-16 bg-gradient-to-r from-cyan-100/18 to-transparent blur-sm"
            style={{ opacity: "var(--swipe-edge-left, 0)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none fixed inset-y-0 right-0 z-[71] w-16 bg-gradient-to-l from-cyan-100/18 to-transparent blur-sm"
            style={{ opacity: "var(--swipe-edge-right, 0)" }}
            aria-hidden="true"
          />
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
