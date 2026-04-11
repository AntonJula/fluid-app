import type { Metadata } from "next";
import { BottomNav } from "@/components/BottomNav";
import { NotificationManager } from "@/components/NotificationManager";
import { SwipeNavigation } from "@/components/SwipeNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fluid | Hydration Tracker",
  description: "A beautiful, calm hydration tracking application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-[100dvh] flex flex-col selection:bg-water-300 selection:text-water-900 bg-background text-foreground">
        <SwipeNavigation />
        <NotificationManager />
        <div
          className="flex-1 flex flex-col pb-28 relative z-10 w-full h-full"
          style={{
            transform: "translateX(var(--swipe-shell-offset, 0px)) scale(var(--swipe-shell-scale, 1))",
            transition: "var(--swipe-shell-transition, transform 220ms ease-out)",
            filter:
              "brightness(calc(1 - var(--swipe-shell-dim, 0))) drop-shadow(0 24px 42px rgba(0, 0, 0, var(--swipe-shell-shadow, 0)))",
            transformOrigin: "center center",
            willChange: "transform, filter",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_34%),linear-gradient(180deg,rgba(2,12,27,0),rgba(2,12,27,0.7))]"
            style={{ opacity: "var(--swipe-shell-dim, 0)" }}
          />
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
