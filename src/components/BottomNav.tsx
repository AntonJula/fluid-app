"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets, BarChart2, Settings } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";

export function BottomNav() {
  const pathname = usePathname();
  const { hideNav, mounted } = useHydration();

  if (!mounted) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe w-full pointer-events-none transition-all duration-700 ease-out ${
        hideNav ? "translate-y-24 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <nav className="relative flex items-center justify-between w-[92%] max-w-[340px] px-8 py-3 mb-8 bg-water-950/40 backdrop-blur-2xl border border-white/10 border-t-white/20 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all mx-auto pointer-events-auto overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-water-400/0 via-water-400/5 to-water-400/0 pointer-events-none" />
        
        <Link 
          href="/" 
          className={`relative z-10 flex flex-col items-center gap-1 p-1.5 transition-all duration-300 ease-out ${
            pathname === "/" ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-water-400/60 hover:text-water-200"
          }`}
        >
          <Droplets className="w-5 h-5" strokeWidth={pathname === "/" ? 2.5 : 2.5} />
          <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5">Home</span>
        </Link>
        
        <Link 
          href="/stats" 
          className={`relative z-10 flex flex-col items-center gap-1 p-1.5 transition-all duration-300 ease-out ${
            pathname === "/stats" ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-water-400/60 hover:text-water-200"
          }`}
        >
          <BarChart2 className="w-5 h-5" strokeWidth={pathname === "/stats" ? 2.5 : 2.5} />
          <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5">Stats</span>
        </Link>

        <Link 
          href="/settings" 
          className={`relative z-10 flex flex-col items-center gap-1 p-1.5 transition-all duration-300 ease-out ${
            pathname === "/settings" ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-water-400/60 hover:text-water-200"
          }`}
        >
          <Settings className="w-5 h-5" strokeWidth={pathname === "/settings" ? 2.5 : 2.5} />
          <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5">Sett</span>
        </Link>
      </nav>
    </div>
  );
}
