"use client";

import React from "react";
import { Card } from "./ui/Card";

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
    <Card className="w-full max-w-sm mx-auto shadow-sm border-white/50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-water-900 tracking-tight">Daily Goal</h3>
        <select 
          value={goal}
          onChange={handleSelect}
          className="bg-white/50 border border-water-200 text-water-800 text-sm rounded-xl focus:ring-water-400 focus:border-water-400 block p-2 pr-8 outline-none font-bold transition-all shadow-sm"
        >
          {goals.map(g => (
            <option key={g} value={g} className="font-medium">{g / 1000}L</option>
          ))}
        </select>
      </div>
    </Card>
  );
}
