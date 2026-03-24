"use client";

import React from "react";
import { useHydration } from "@/hooks/useHydration";
import { Card } from "@/components/ui/Card";
import { Flame, Calendar, Trophy } from "lucide-react";

export default function StatsPage() {
  const { streak, history, intake, goal, mounted } = useHydration();

  if (!mounted) {
    return <main className="min-h-screen bg-water-50" />;
  }

  // Combine today's data with history for a full 7-day view
  const today = new Date().toISOString().split("T")[0];
  const fullHistory = [...history];
  
  const todayIndex = fullHistory.findIndex(h => h.date === today);
  if (todayIndex === -1) {
    fullHistory.push({ date: today, intake, goal });
  } else {
    fullHistory[todayIndex] = { date: today, intake, goal };
  }

  const chartData = fullHistory.slice(-7);
  const maxIntakeInHistory = Math.max(...chartData.map(d => d.intake), goal, 1);

  return (
    <main className="flex-1 flex flex-col items-center p-6 w-full max-w-md mx-auto min-h-[100dvh]">
      <header className="w-full text-center mt-6 mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Your Stats</h1>
        <p className="text-water-200/80 text-sm font-medium mt-1 mb-4">Consistency is key</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-water-800/50 rounded-full text-water-100 font-semibold text-sm shadow-sm ring-1 ring-water-200/50">
          <span>Today's Goal:</span>
          <span className="text-water-300 font-bold">{goal} ml</span>
        </div>
      </header>

      <div className="w-full grid grid-cols-2 gap-4 mb-8">
        <Card className="flex flex-col items-center justify-center p-5 text-center shadow-md shadow-water-200/30">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-400" strokeWidth={2.5} />
            <span className="text-water-600 font-semibold text-sm">Streak</span>
          </div>
          <div className="text-5xl font-black text-water-900 tracking-tight">{streak}</div>
          <span className="text-water-500 text-xs mt-2 uppercase tracking-wide font-medium">Days in a row</span>
        </Card>
        
        <Card className="flex flex-col items-center justify-center p-5 text-center shadow-md shadow-water-200/30">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-400" strokeWidth={2.5} />
            <span className="text-water-600 font-semibold text-sm">Today</span>
          </div>
          <div className="text-4xl font-black text-water-900 tracking-tight">
            {Math.round((intake / goal) * 100)}<span className="text-xl text-water-400">%</span>
          </div>
          <span className="text-water-500 text-xs mt-2 uppercase tracking-wide font-medium">Goal completion</span>
        </Card>
      </div>

      <Card className="w-full p-6 shadow-md shadow-water-200/30">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-water-500" strokeWidth={2.5} />
            <h2 className="text-water-900 font-bold tracking-tight">Last 7 Days</h2>
          </div>
        </div>
        
        {chartData.length === 0 ? (
          <div className="py-8 text-center text-water-500 text-sm">
            Drink some water to start your history!
          </div>
        ) : (
          <div className="flex items-end justify-between h-48 pt-4">
            {chartData.map((day, idx) => {
              const heightPercent = Math.min(100, (day.intake / maxIntakeInHistory) * 100);
              const isGoalMet = day.intake >= day.goal;
              const dateObj = new Date(day.date);
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

              return (
                <div key={day.date} className="flex flex-col items-center gap-3 w-10 h-full">
                  <div className="relative w-full h-full flex-1 flex items-end justify-center bg-water-50 rounded-t-xl overflow-hidden">
                    <div 
                      className={`w-full rounded-t-xl transition-all duration-1000 ease-out ${
                        isGoalMet 
                          ? "bg-gradient-to-t from-water-400 to-water-300" 
                          : "bg-water-200"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-water-600 uppercase tracking-widest">
                    {idx === chartData.length - 1 ? 'Tdy' : dayName}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </main>
  );
}
