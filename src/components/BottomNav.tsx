"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets, BarChart2 } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe w-full">
      <nav className="flex items-center justify-center gap-12 px-10 py-2.5 mb-8 bg-water-800/30 backdrop-blur-2xl border border-water-300/20 rounded-full shadow-[0_10px_40px_-10px_rgba(4,47,46,0.8)] transition-all w-max mx-auto">
        <Link 
          href="/" 
          className={`flex flex-col items-center gap-1 p-1.5 transition-all duration-300 ease-out ${
            pathname === "/" ? "text-white scale-110 drop-shadow-md" : "text-water-400/60 hover:text-water-200"
          }`}
        >
          <Droplets className="w-5 h-5" strokeWidth={pathname === "/" ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5">Home</span>
        </Link>
        
        <Link 
          href="/stats" 
          className={`flex flex-col items-center gap-1 p-1.5 transition-all duration-300 ease-out ${
            pathname === "/stats" ? "text-white scale-110 drop-shadow-md" : "text-water-400/60 hover:text-water-200"
          }`}
        >
          <BarChart2 className="w-5 h-5" strokeWidth={pathname === "/stats" ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5">Stats</span>
        </Link>
      </nav>
    </div>
  );
}
