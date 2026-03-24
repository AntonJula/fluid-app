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
      <div className="text-5xl font-bold text-white mb-1 drop-shadow-sm">
        {(intake / 1000).toFixed(1)}L <span className="text-2xl text-water-300 font-normal">/ {(goal / 1000).toFixed(1)}L</span>
      </div>
      <div className="mb-6 w-full p-4 rounded-2xl bg-water-600/20 shadow-inner border border-water-400/20">
        <p className="text-md font-bold text-water-200 mb-1 uppercase tracking-widest">
          {remainingGlasses > 0 ? "You still need" : "Amazing!"}
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-sm my-1">
          {remainingGlasses > 0 ? `${remainingGlasses} more glasses` : "Daily goal reached! 💧"}
        </p>
        {remainingGlasses > 0 && (
          <p className="text-sm font-medium text-water-300 mt-1">
            to crush your daily goal!
          </p>
        )}
      </div>
      
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
