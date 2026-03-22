import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

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
      <body className={`${outfit.variable} font-sans antialiased min-h-[100dvh] flex flex-col selection:bg-water-300 selection:text-water-900 bg-background text-foreground`}>
        <div className="flex-1 flex flex-col pb-28 relative w-full h-full">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
