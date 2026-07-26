import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import { DeferredAppServices } from "@/components/DeferredAppServices";
import { FluidMotion } from "@/components/FluidMotion";
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
    "theme-color": "#075985",
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
  themeColor: "#075985",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased h-[100dvh] overflow-hidden selection:bg-water-300 selection:text-water-900 bg-background text-foreground">
        <ScrollPreserver />
        <SwipeNavigation />
        <FluidMotion />
        <DeferredAppServices />
        <div
          data-app-scroll-root="true"
          className="relative z-10 h-[100dvh] w-full overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch]"
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
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
