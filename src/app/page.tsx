"use client";

import React from "react";
import { useHydration } from "@/hooks/useHydration";
import { WaveBackground } from "@/components/WaveBackground";
import { ProgressCard } from "@/components/ProgressCard";
import { Button } from "@/components/ui/Button";
import { ReminderSettings } from "@/components/ReminderSettings";

export default function Home() {
  const { intake, goal, reminderInterval, addDrink, setReminderInterval, mounted } = useHydration();

  if (!mounted) {
    // Render an empty calm placeholder during SSR to prevent hydration issues
    return <main className="min-h-screen bg-water-50" />;
  }

  const progressAttr = Math.min(1, Math.max(0, intake / goal));

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 pb-12 w-full max-w-md mx-auto relative min-h-[100dvh]">
      <WaveBackground progress={progressAttr} />
      
      <div className="w-full space-y-8 z-10 flex-1 flex flex-col justify-center pt-8">
        
        <header className="text-center mb-2">
          <h1 className="text-3xl font-bold text-water-900 tracking-tight">Fluid</h1>
          <p className="text-water-600/80 text-sm font-medium">Daily Hydration Tracker</p>
        </header>

        <ProgressCard intake={intake} goal={goal} />

        <div className="flex flex-col gap-4 items-center">
          <div className="flex gap-3 justify-center w-full">
            <Button variant="secondary" onClick={() => addDrink(100)} className="flex-1 rounded-2xl py-3 font-semibold text-water-800 bg-white/70 backdrop-blur hover:bg-white text-sm">
              100 ml
            </Button>
            <Button variant="secondary" onClick={() => addDrink(250)} className="flex-1 rounded-2xl py-3 font-semibold text-water-800 bg-white/70 backdrop-blur hover:bg-white text-sm">
              250 ml
            </Button>
            <Button variant="secondary" onClick={() => addDrink(500)} className="flex-1 rounded-2xl py-3 font-semibold text-water-800 bg-white/70 backdrop-blur hover:bg-white text-sm">
              500 ml
            </Button>
          </div>
          
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full rounded-2xl py-4 text-lg shadow-lg shadow-water-300/50 transform transition hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => addDrink(250)}
          >
            Add Drink (250ml)
          </Button>
        </div>

        <ReminderSettings interval={reminderInterval} setInterval={setReminderInterval} />
      </div>
    </main>
  );
}
