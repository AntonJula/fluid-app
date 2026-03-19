import React from "react";
import { Card } from "./ui/Card";

interface ProgressCardProps {
  intake: number;
  goal: number;
}

export function ProgressCard({ intake, goal }: ProgressCardProps) {
  const percentage = Math.min(100, (intake / goal) * 100);
  const remainingGlasses = Math.ceil(Math.max(0, goal - intake) / 250);

  return (
    <Card className="flex flex-col items-center justify-center text-center w-full max-w-sm mx-auto">
      <h2 className="text-water-600 font-medium tracking-wide uppercase text-sm mb-2">Today's Intake</h2>
      <div className="text-5xl font-bold text-water-900 mb-1">
        {(intake / 1000).toFixed(1)}L <span className="text-2xl text-water-400 font-normal">/ {(goal / 1000).toFixed(1)}L</span>
      </div>
      <p className="text-sm text-water-600/80 mb-6">
        {remainingGlasses > 0 ? `${remainingGlasses} glasses left to reach your goal` : "Daily goal reached! Great job 💧"}
      </p>
      
      {/* Linear Progress Bar */}
      <div className="w-full h-4 bg-water-100 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-water-500 rounded-full transition-all duration-700 ease-out shadow-sm"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </Card>
  );
}
