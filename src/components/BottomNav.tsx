"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets, BarChart2, Settings } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe w-full pointer-events-none">
      <nav className="flex items-center justify-between w-[92%] max-w-[340px] px-8 py-2.5 mb-8 bg-water-900/15 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all mx-auto pointer-events-auto">
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

        <Link 
          href="/settings" 
          className={`flex flex-col items-center gap-1 p-1.5 transition-all duration-300 ease-out ${
            pathname === "/settings" ? "text-white scale-110 drop-shadow-md" : "text-water-400/60 hover:text-water-200"
          }`}
        >
          <Settings className="w-5 h-5" strokeWidth={pathname === "/settings" ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5">Sett</span>
        </Link>
      </nav>
    </div>
  );
}
