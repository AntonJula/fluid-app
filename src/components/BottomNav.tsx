"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets, BarChart2 } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe w-full max-w-md mx-auto">
      <nav className="flex items-center justify-around w-full max-w-[240px] px-6 py-3 mb-6 bg-white/70 backdrop-blur-xl border border-white/50 rounded-full shadow-xl shadow-water-200/40 transition-all">
        <Link 
          href="/" 
          className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ease-in-out ${
            pathname === "/" ? "text-water-600 scale-110" : "text-water-900/40 hover:text-water-600/70"
          }`}
        >
          <Droplets className="w-5 h-5 mb-0.5" strokeWidth={pathname === "/" ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-wider uppercase">Home</span>
        </Link>
        
        <Link 
          href="/stats" 
          className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ease-in-out ${
            pathname === "/stats" ? "text-water-600 scale-110" : "text-water-900/40 hover:text-water-600/70"
          }`}
        >
          <BarChart2 className="w-5 h-5 mb-0.5" strokeWidth={pathname === "/stats" ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-wider uppercase">Stats</span>
        </Link>
      </nav>
    </div>
  );
}
