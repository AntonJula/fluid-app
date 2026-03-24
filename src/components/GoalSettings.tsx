"use client";

import React from "react";
import { Card } from "./ui/Card";

import { ChevronDown } from "lucide-react";

interface GoalSettingsProps {
  goal: number;
  setGoal: (goal: number) => void;
}

export function GoalSettings({ goal, setGoal }: GoalSettingsProps) {
  const goals = [1000, 1500, 2000, 2500, 3000, 3500, 4000];

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGoal(Number(e.target.value));
  };

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white tracking-tight text-lg">Daily Goal</h3>
        <div className="relative">
          <select 
            value={goal}
            onChange={handleSelect}
            className="bg-water-800/50 border border-water-500/30 text-white text-sm rounded-xl focus:ring-water-300 focus:border-water-300 block p-2 pr-9 outline-none font-bold transition-all shadow-inner backdrop-blur-md appearance-none"
          >
            {goals.map(g => (
              <option key={g} value={g} className="font-medium bg-water-900 text-white">{g / 1000}L</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-water-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={3} />
        </div>
      </div>
    </Card>
  );
}
