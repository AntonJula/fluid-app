"use client";

import React from "react";
import { Trophy } from "lucide-react";
import { Card } from "./ui/Card";

const SECONDARY_NUMBER_ANIMATION_MS = 820;

interface ProgressCardProps {
  intake: number;
  targetIntake?: number;
  goal: number;
  goalAction?: React.ReactNode;
}

function easeOutQuart(progress: number) {
  return 1 - Math.pow(1 - progress, 4);
}

function useAnimatedNumber(target: number, duration = SECONDARY_NUMBER_ANIMATION_MS, initialValue = target) {
  const [displayedValue, setDisplayedValue] = React.useState(initialValue);
  const currentValueRef = React.useRef(initialValue);
  const frameRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      currentValueRef.current = target;
      setDisplayedValue(target);
      return;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      currentValueRef.current = target;
      setDisplayedValue(target);
      return;
    }

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const startValue = currentValueRef.current;
    const change = target - startValue;
    const startedAt = performance.now();

    if (Math.abs(change) < 1) {
      currentValueRef.current = target;
      setDisplayedValue(target);
      return;
    }

    const tick = (timestamp: number) => {
      const elapsed = timestamp - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const nextValue = startValue + change * easeOutQuart(progress);

      currentValueRef.current = nextValue;
      setDisplayedValue(nextValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      currentValueRef.current = target;
      setDisplayedValue(target);
      frameRef.current = null;
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [duration, target]);

  return displayedValue;
}

export function ProgressCard({ intake, targetIntake = intake, goal, goalAction }: ProgressCardProps) {
  const safeGoal = Math.max(goal, 1);
  const progress = Math.min(1, intake / safeGoal);
  const remaining = Math.max(0, goal - targetIntake);
  const animatedRemaining = useAnimatedNumber(remaining, SECONDARY_NUMBER_ANIMATION_MS, safeGoal);
  const displayedRemaining = Math.max(0, Math.round(animatedRemaining));
  const remainingGlasses = displayedRemaining <= 0 ? 0 : Math.ceil(animatedRemaining / 250);
  const percentage = Math.round(progress * 100);
  const isGoalMet = intake >= goal;
  const overGoal = Math.max(0, targetIntake - goal);

  return (
    <Card className="flex w-full max-w-full min-w-0 flex-col items-center justify-center p-4 text-center shadow-xl min-[380px]:p-5 sm:p-7">
      <div className="flex w-full items-start justify-between gap-3 min-[380px]:gap-4">
        <div className="min-w-0 text-left">
          <p className="font-ui text-water-300 text-sm font-bold tracking-wide">Today&apos;s Intake</p>
          <p className="font-ui mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-water-400/75">
            Daily progress
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-[1.5px] border-water-300/16 bg-water-900/18 px-3 py-2 text-right shadow-inner min-[380px]:rounded-2xl">
          <p className="font-numeric text-[1.45rem] font-black leading-none text-white sm:text-[1.7rem]">{percentage}%</p>
          <p className="font-ui mt-1 text-[0.62rem] font-bold uppercase tracking-[0.24em] text-water-300/75">done</p>
        </div>
      </div>

      <div className="font-numeric mt-4 text-5xl font-black text-white drop-shadow-xl sm:text-6xl">
        {(intake / 1000).toFixed(1)}
        <span className="font-ui text-3xl text-water-300/80 font-bold tracking-normal sm:text-4xl"> L</span>
      </div>
      <p className="font-body mt-2 text-sm font-semibold text-water-300/80">
        Goal {(safeGoal / 1000).toFixed(1)}L
      </p>
      {goalAction && <div className="mt-3">{goalAction}</div>}

      <div className={`${goalAction ? "mt-4" : "mt-6"} w-full rounded-[1.1rem] border border-[1.5px] border-water-300/16 bg-water-800/30 p-2 shadow-inner min-[380px]:rounded-3xl`}>
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
        <div className="mt-5 grid w-full grid-cols-2 gap-2.5 text-left animate-in fade-in zoom-in duration-500 sm:gap-3">
          <div className="flex flex-col justify-center rounded-xl border border-[1.5px] border-water-300/14 bg-water-900/35 px-3 py-3 min-[380px]:rounded-2xl min-[380px]:px-4">
            <p className="font-ui text-water-300 text-[0.82rem] sm:text-sm font-bold tracking-wide">Left today</p>
            <p className="font-numeric mt-1.5 flex items-baseline whitespace-nowrap text-[1.15rem] font-black text-white sm:text-[1.65rem]">
              <span className="tabular-nums">{displayedRemaining}</span>
              <span className="font-ui ml-1 text-[0.82rem] sm:text-base font-bold text-water-300/80">ml</span>
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-xl border border-[1.5px] border-water-300/14 bg-water-900/35 px-3 py-3 min-[380px]:rounded-2xl min-[380px]:px-4">
            <p className="font-ui text-water-300 text-[0.82rem] sm:text-sm font-bold tracking-wide">Quick target</p>
            <p className="font-numeric mt-1.5 flex flex-wrap items-baseline gap-x-1.5 text-[1.05rem] font-black text-white sm:text-[1.65rem]">
              <span className="tabular-nums">{remainingGlasses}</span>
              <span className="font-ui text-[0.82rem] font-bold tracking-normal text-water-300/80 sm:text-base">
                {remainingGlasses === 1 ? "glass" : "glasses"}
              </span>
            </p>
          </div>
        </div>
      )}

      {isGoalMet && (
        <div className="relative mt-5 flex w-full flex-col items-center justify-center overflow-hidden rounded-[1.1rem] border border-[1.5px] border-emerald-200/22 bg-gradient-to-br from-emerald-300/20 via-cyan-300/12 to-water-500/20 px-4 py-5 shadow-[0_0_34px_rgba(45,212,191,0.16)] animate-in fade-in zoom-in duration-500 min-[380px]:rounded-3xl min-[380px]:px-5 min-[380px]:py-6">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent pointer-events-none" />
          <div className="absolute -top-16 h-32 w-32 rounded-full bg-emerald-200/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 h-32 w-40 rounded-full bg-cyan-300/14 blur-2xl pointer-events-none" />

          <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[1.5px] border-emerald-100/26 bg-emerald-200/14 shadow-[0_0_28px_rgba(45,212,191,0.22),inset_0_1px_0_rgba(255,255,255,0.18)]">
            <div className="absolute inset-2 rounded-full border border-cyan-100/20" />
            <Trophy className="h-8 w-8 text-emerald-100 drop-shadow-[0_0_12px_rgba(167,243,208,0.55)]" strokeWidth={2.4} />
          </div>

          <div className="relative z-10 flex items-center text-water-200">
            <p className="font-ui text-[13px] font-bold uppercase tracking-[0.24em]">Goal Achieved</p>
          </div>
          <p className="font-ui mt-2 max-w-[15rem] text-2xl font-black leading-tight text-white text-center relative z-10">
            You&apos;re fully hydrated today!
          </p>
          {overGoal > 0 && (
            <p className="font-body relative z-10 mt-2 rounded-full border border-[1.5px] border-emerald-200/18 bg-emerald-300/12 px-3 py-1 text-xs font-bold text-emerald-100">
              +{overGoal} ml over goal
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
