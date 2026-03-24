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

  // Generate current week dates (Monday to Sunday)
  const todayDate = new Date();
  const currentDay = todayDate.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1; 
  
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - distanceToMonday);
  
  const currentWeek = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const today = todayDate.toISOString().split("T")[0];

  const chartData = currentWeek.map(dateStr => {
    if (dateStr === today) {
      return { date: dateStr, intake, goal };
    }
    const found = history.find(h => h.date === dateStr);
    return found ? found : { date: dateStr, intake: 0, goal: goal };
  });
  const maxIntakeInHistory = Math.max(...chartData.map(d => d.intake), goal, 1);

  return (
    <main className="flex-1 flex flex-col items-center p-6 w-full max-w-md mx-auto min-h-[100dvh]">
      <header className="w-full text-center mt-4 mb-8">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-md">Your Stats.</h1>
        <p className="text-xs font-semibold mt-1 tracking-widest text-water-200 uppercase mb-6">Consistency is key</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-water-900/40 backdrop-blur-md rounded-2xl text-water-100 font-semibold text-sm shadow-inner border border-water-400/20">
          <span className="opacity-80">Daily Goal:</span>
          <span className="text-water-300 font-bold tracking-wide">{goal} ml</span>
        </div>
      </header>

      <div className="w-full grid grid-cols-2 gap-4 mb-8">
        <Card className="flex flex-col items-center justify-center p-5 text-center">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-400 drop-shadow-sm" strokeWidth={2.5} />
            <span className="text-water-300 font-bold text-sm tracking-wide">Streak</span>
          </div>
          <div className="text-4xl sm:text-5xl font-black text-white px-2 drop-shadow-md">{streak}</div>
          <span className="text-water-400/80 text-[10px] mt-2 uppercase tracking-widest font-bold">Days in a row</span>
        </Card>
        
        <Card className="flex flex-col items-center justify-center p-5 text-center">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-sm" strokeWidth={2.5} />
            <span className="text-water-300 font-bold text-sm tracking-wide">Today</span>
          </div>
          <div className="text-4xl sm:text-5xl font-black text-white px-2 drop-shadow-md">
            {Math.round((intake / goal) * 100)}<span className="text-xl text-water-400 ml-0.5">%</span>
          </div>
          <span className="text-water-400/80 text-[10px] mt-2 uppercase tracking-widest font-bold">Goal completed</span>
        </Card>
      </div>

      <Card className="w-full p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-water-400" strokeWidth={2.5} />
            <h2 className="text-white text-lg font-bold tracking-tight drop-shadow-sm">Tracking History</h2>
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
              const isGoalMet = day.intake > 0 && day.intake >= day.goal;
              const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const dayName = dayNames[idx];
              const isToday = day.date === today;

              return (
                <div key={day.date} className="flex flex-col items-center gap-3 w-10 h-full group">
                  <div className="relative w-full h-full flex-1 flex items-end justify-center bg-water-800/40 border border-water-500/20 rounded-t-xl overflow-hidden shadow-inner">
                    <div 
                      className={`w-full rounded-t-xl transition-all duration-1000 ease-out group-hover:brightness-110 ${
                        isGoalMet 
                          ? "bg-gradient-to-t from-water-600 to-water-400" 
                          : "bg-water-700/60"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${
                    isToday ? 'text-water-200 drop-shadow-sm' : 'text-water-400/80'
                  }`}>
                    {dayName}
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
