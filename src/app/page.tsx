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
        
        <header className="relative w-full text-center mb-2 z-10 transition-colors duration-700">
          <div className="absolute right-0 top-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetDaily} 
              className="p-2 text-water-600 hover:text-water-900 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-sm transition-transform active:rotate-180 shadow-sm"
              title="Reset today's hydration"
            >
              <RefreshCw className="w-5 h-5 text-water-600 hover:text-water-800" strokeWidth={2.5} />
            </Button>
          </div>
          <h1 
            className={`text-5xl font-black tracking-tighter inline-block pb-1 transition-colors duration-700 ${
              progressAttr > 0.82 ? "text-water-900" : "text-white"
            }`}
          >
            Fluid
          </h1>
          <br/>
          <p 
            className={`text-sm font-bold mt-1 inline-block transition-colors duration-700 ${
              progressAttr > 0.82 ? "text-water-800" : "text-water-100"
            }`}
          >
            Daily Hydration Tracker
          </p>
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

        <GoalSettings goal={goal} setGoal={setGoal} />
        <ReminderSettings interval={reminderInterval} setInterval={setReminderInterval} />
      </div>
    </main>
  );
}
