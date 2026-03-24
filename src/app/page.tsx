"use client";

import React from "react";
import { useHydration } from "@/hooks/useHydration";
import { WaveBackground } from "@/components/WaveBackground";
import { ProgressCard } from "@/components/ProgressCard";
import { Button } from "@/components/ui/Button";
import { ReminderSettings } from "@/components/ReminderSettings";
import { GoalSettings } from "@/components/GoalSettings";
import { RefreshCw } from "lucide-react";

export default function Home() {
  const { intake, animatedIntake, goal, setGoal, reminderInterval, addDrink, setReminderInterval, resetDaily, mounted } = useHydration();

  if (!mounted) {
    // Render an empty calm placeholder during SSR to prevent hydration issues
    return <main className="min-h-screen bg-water-50" />;
  }

  const progressAttr = Math.min(1, Math.max(0, animatedIntake / goal));
  const fillHeight = progressAttr * 100;

  return (
    <main className="flex-1 flex flex-col items-center p-6 pb-32 pt-10 w-full max-w-md mx-auto relative min-h-[100dvh]">
      <WaveBackground progress={progressAttr} />
      
      <div className="w-full space-y-8 z-10 flex-1 flex flex-col">
        
        <header className="relative w-full text-center mt-2 mb-8 z-20">
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
          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-md">
            Fluid.
          </h1>
          <p className="text-xs font-semibold mt-1 tracking-widest text-water-200 uppercase">
            Daily Hydration
          </p>
        </header>

        <ProgressCard intake={intake} goal={goal} />

        <div className="flex flex-col gap-5 items-center w-full">
          <div className="flex gap-4 justify-center w-full">
            <Button variant="secondary" onClick={() => addDrink(100)} className="flex-1 rounded-2xl py-3.5 shadow-sm">
              <span className="flex flex-col items-center leading-tight gap-0.5">
                <span className="text-water-400 text-[10px] uppercase font-bold tracking-widest">Quick</span>
                <span className="text-sm font-bold text-white">100ml</span>
              </span>
            </Button>
            <Button variant="secondary" onClick={() => addDrink(250)} className="flex-1 rounded-2xl py-3.5 shadow-sm">
              <span className="flex flex-col items-center leading-tight gap-0.5">
                <span className="text-water-400 text-[10px] uppercase font-bold tracking-widest">Glass</span>
                <span className="text-sm font-bold text-white">250ml</span>
              </span>
            </Button>
            <Button variant="secondary" onClick={() => addDrink(500)} className="flex-1 rounded-2xl py-3.5 shadow-sm">
              <span className="flex flex-col items-center leading-tight gap-0.5">
                <span className="text-water-400 text-[10px] uppercase font-bold tracking-widest">Bottle</span>
                <span className="text-sm font-bold text-white">500ml</span>
              </span>
            </Button>
          </div>
          
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full rounded-2xl py-4.5 text-lg shadow-xl shadow-water-500/20 group relative overflow-hidden"
            onClick={() => addDrink(250)}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 flex items-center justify-center gap-2 font-bold tracking-wide">
               + Add Drink
            </span>
          </Button>
        </div>

        <GoalSettings goal={goal} setGoal={setGoal} />
        <ReminderSettings interval={reminderInterval} setInterval={setReminderInterval} />
      </div>
    </main>
  );
}
