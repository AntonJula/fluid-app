import React from "react";
import { Card } from "./ui/Card";

interface ProgressCardProps {
  intake: number;
  goal: number;
}

export function ProgressCard({ intake, goal }: ProgressCardProps) {
  const progress = Math.min(1, intake / goal);
  const remaining = Math.max(0, goal - intake);
  const remainingGlasses = Math.ceil(remaining / 250);
  const percentage = Math.round(progress * 100);
  const isGoalMet = intake >= goal;

  return (
    <Card className="flex flex-col items-center justify-center text-center w-full max-w-sm mx-auto shadow-2xl p-7">
      <div className="flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-[0.22em] text-water-300/80">
        <span>Today&apos;s Intake</span>
        <span>{percentage}% done</span>
      </div>

      <div className="mt-4 text-6xl font-black text-white drop-shadow-xl font-sans tracking-tight">
        {(intake / 1000).toFixed(1)}
        <span className="text-4xl text-water-300/80 font-bold tracking-normal"> L</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-water-300/80">
        Goal {(goal / 1000).toFixed(1)}L
      </p>

      <div className="mt-6 w-full rounded-3xl border border-water-400/15 bg-water-800/30 p-2 shadow-inner">
        <div className="h-4 overflow-hidden rounded-full bg-water-950/50">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isGoalMet
                ? "bg-gradient-to-r from-water-300 via-water-200 to-water-300 shadow-[0_0_18px_rgba(153,246,228,0.45)]"
                : "bg-gradient-to-r from-water-600 via-water-400 to-water-300"
            }`}
            style={{ width: `${Math.max(8, Math.min(100, percentage))}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid w-full grid-cols-2 gap-3 text-left">
        <div className="rounded-2xl border border-water-400/10 bg-water-900/35 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-water-400/80">Left Today</p>
          <p className="mt-2 text-2xl font-black text-white">{remaining} ml</p>
        </div>
        <div className="rounded-2xl border border-water-400/10 bg-water-900/35 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-water-400/80">Quick Goal</p>
          <p className="mt-2 text-2xl font-black text-white">
            {isGoalMet ? "Done" : `${remainingGlasses} glasses`}
          </p>
        </div>
      </div>

      <div className="mt-5 w-full rounded-3xl bg-water-800/30 px-5 py-4 shadow-inner border border-water-400/10">
        <p className="text-[11px] font-bold text-water-300/80 uppercase tracking-[0.2em]">
          {isGoalMet ? "Reward unlocked" : "Next push"}
        </p>
        <p className="mt-1 text-2xl font-black text-white tracking-tight">
          {isGoalMet ? "Daily goal reached!" : `${remaining} ml to go`}
        </p>
        <p className="mt-1 text-xs font-semibold text-water-400/80">
          {isGoalMet
            ? "You showed up today. The fun finale can land here later."
            : "A couple of taps and the water level will feel noticeably better."}
        </p>
      </div>
    </Card>
  );
}
