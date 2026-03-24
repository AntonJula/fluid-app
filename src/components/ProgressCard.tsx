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
    <Card className="flex flex-col items-center justify-center text-center w-full max-w-sm mx-auto shadow-2xl p-8">
      <h2 className="text-water-400 font-semibold tracking-widest uppercase text-xs mb-3">Today's Intake</h2>
      <div className="text-6xl font-black text-white mb-2 drop-shadow-xl font-sans tracking-tight">
        {(intake / 1000).toFixed(1)}<span className="text-4xl text-water-300/80 font-bold tracking-normal"> L</span> 
        <span className="text-2xl text-water-500/60 font-medium mx-1">/</span> 
        <span className="text-2xl text-water-400 font-medium">{(goal / 1000).toFixed(1)}L</span>
      </div>
      <div className="mb-6 w-full mt-4 p-5 rounded-3xl bg-water-800/30 shadow-inner border border-water-400/10">
        <p className="text-[11px] font-bold text-water-300/80 mb-1.5 uppercase tracking-[0.2em]">
          {remainingGlasses > 0 ? "You still need" : "Amazing!"}
        </p>
        <p className="text-3xl font-black text-white drop-shadow-md my-1 tracking-tight">
          {remainingGlasses > 0 ? `${remainingGlasses} more glasses` : "Daily goal reached! 💧"}
        </p>
        {remainingGlasses > 0 && (
          <p className="text-xs font-semibold text-water-400/80 mt-1.5">
            to crush your daily goal!
          </p>
        )}
      </div>
      
    </Card>
  );
}
