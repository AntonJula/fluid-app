"use client";

import React from "react";
import { useHydration } from "@/hooks/useHydration";
import { WaveBackground } from "@/components/WaveBackground";
import { ProgressCard } from "@/components/ProgressCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RefreshCw, Sparkles, Droplets, CircleDashed, Flame } from "lucide-react";
import { SipIcon, GlassIcon, MugIcon, BottleIcon } from "@/components/DrinkIcons";

const QUICK_AMOUNTS = [
  { label: "Sip", amount: 150, Icon: SipIcon },
  { label: "Glass", amount: 250, Icon: GlassIcon },
  { label: "Mug", amount: 330, Icon: MugIcon },
  { label: "Bottle", amount: 500, Icon: BottleIcon },
];

const MILESTONE_STEPS = [0.2, 0.4, 0.6, 0.8, 1];

export default function Home() {
  const { intake, goal, addDrink, resetDaily, mounted } = useHydration();

  if (!mounted) {
    return <main className="min-h-screen bg-water-50" />;
  }

  const progressAttr = Math.min(1, Math.max(0, intake / goal));
  const completedToday = intake >= goal;

  return (
    <main className="flex flex-col items-center p-6 pb-24 pt-6 w-full max-w-md mx-auto relative min-h-[100dvh] overflow-hidden">
      <WaveBackground progress={progressAttr} />

      <div className="w-full z-10 flex flex-col gap-8 h-full flex-1">
        <header className="relative w-full text-center mt-2 z-20">
          <div className="absolute right-0 top-0 z-50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetDaily}
              className="p-2.5 text-water-300 hover:text-white rounded-full bg-water-800/30 hover:bg-water-700/50 backdrop-blur-md transition-all active:rotate-180"
              title="Reset today's hydration"
            >
              <RefreshCw className="w-5 h-5" strokeWidth={2.5} />
            </Button>
          </div>

          <h1 className="text-6xl font-black tracking-tighter text-white drop-shadow-md font-poppins">Fluid.</h1>
          <p className="text-xs font-semibold mt-1 tracking-widest text-water-200 uppercase">
            {completedToday ? "Today is complete" : "Build your daily rhythm"}
          </p>
        </header>

        <div className="flex-1 flex flex-col justify-center items-center w-full min-h-0 mt-8 mb-4">
          <ProgressCard intake={intake} goal={goal} />
        </div>

        <section className="w-full mt-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-[12px] uppercase tracking-[0.2em] font-bold text-water-200/90">Quick add</p>
            <p className="text-xs font-semibold text-water-300/80">Tap to log</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {QUICK_AMOUNTS.map((item) => (
              <Button
                key={item.amount}
                variant="secondary"
                onClick={() => addDrink(item.amount)}
                className="group relative overflow-hidden rounded-[1.5rem] py-4 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5)] border border-water-300/30 bg-gradient-to-b from-water-700/60 to-water-900/60 hover:from-water-600/70 hover:to-water-800/70 hover:-translate-y-1 hover:shadow-[0_12px_24px_-6px_rgba(56,189,248,0.3)] hover:border-water-300/60 backdrop-blur-xl transition-all duration-300 active:scale-[0.97]"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col items-center justify-center gap-1 w-full relative z-10">
                  <div className="flex items-center gap-1.5 text-water-200 group-hover:text-white transition-colors">
                    <item.Icon className="w-6 h-6 drop-shadow-md" />
                    <span className="text-[11px] uppercase font-bold tracking-[0.2em]">{item.label}</span>
                  </div>
                  <span className="text-2xl font-black text-white drop-shadow-lg group-hover:scale-105 transition-transform duration-300">{item.amount}<span className="text-[13px] text-water-300 font-bold tracking-normal ml-0.5">ml</span></span>
                </div>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
