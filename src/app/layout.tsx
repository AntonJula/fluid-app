import type { Metadata } from "next";
import { BottomNav } from "@/components/BottomNav";
import { NotificationManager } from "@/components/NotificationManager";
import { SwipeNavigation } from "@/components/SwipeNavigation";
import { ScrollPreserver } from "@/hooks/useScrollPreservation";
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
        <ScrollPreserver />
        <SwipeNavigation />
        <NotificationManager />
        <div
          className="flex-1 flex flex-col pb-28 relative z-10 w-full h-full"
          style={{
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
