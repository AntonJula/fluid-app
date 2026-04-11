import React from "react";
import Image from "next/image";
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
      <div className="flex w-full items-start justify-between gap-4">
        <div className="text-left">
          <p className="text-water-300 text-sm font-bold tracking-wide">Today&apos;s Intake</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-water-400/75">
            Daily progress
          </p>
        </div>
        <div className="rounded-2xl border border-water-300/10 bg-water-900/18 px-3 py-2 text-right shadow-inner">
          <p className="text-[1.7rem] font-black leading-none tracking-tight text-white">{percentage}%</p>
          <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.24em] text-water-300/75">done</p>
        </div>
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

      {!isGoalMet && (
        <div className="mt-5 grid w-full grid-cols-2 gap-3 text-left animate-in fade-in zoom-in duration-500">
          <div className="rounded-2xl border border-water-400/10 bg-water-900/35 px-4 py-3 flex flex-col justify-center">
            <p className="text-water-300 text-sm font-bold tracking-wide">Left today</p>
            <p className="mt-1.5 text-[1.65rem] font-black tracking-tight text-white">
              {remaining}
              <span className="ml-1 text-base font-bold text-water-300/80">ml</span>
            </p>
          </div>
          <div className="rounded-2xl border border-water-400/10 bg-water-900/35 px-4 py-3 flex flex-col justify-center">
            <p className="text-water-300 text-sm font-bold tracking-wide">Quick target</p>
            <p className="mt-1.5 text-[1.65rem] font-black tracking-tight text-white">
              {remainingGlasses} {remainingGlasses === 1 ? "glass" : "glasses"}
            </p>
          </div>
        </div>
      )}

      {isGoalMet && (
        <div className="mt-5 w-full rounded-3xl bg-gradient-to-br from-water-400/20 to-water-600/20 px-5 py-6 shadow-[0_0_30px_rgba(56,189,248,0.15)] border border-water-300/30 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.3)_0%,transparent_60%)] pointer-events-none" />
          
          <div className="relative w-[220px] h-[220px] -mt-8 -mb-12 drop-shadow-[0_0_25px_rgba(56,189,248,0.8)] shark-pulse pointer-events-none">
            <Image 
              src="/Fierce shark head in glowing frame.png" 
              alt="Goal Met Shark" 
              fill
              className="object-contain scale-110"
              unoptimized
            />
          </div>
          
          <p className="text-[14px] font-bold text-water-200 uppercase tracking-[0.25em] mb-1 relative z-10">
            Goal Achieved
          </p>
          <p className="text-2xl font-black text-white tracking-tight text-center relative z-10">
            You&apos;re fully hydrated today!
          </p>

          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes shark-pulse-soft {
                  0%, 100% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.85; transform: scale(0.96); }
                }
                .shark-pulse {
                  animation: shark-pulse-soft 3.5s ease-in-out infinite;
                }
              `
            }}
          />
        </div>
      )}
    </Card>
  );
}
