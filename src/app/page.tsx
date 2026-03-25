"use client";

import React from "react";
import { useHydration } from "@/hooks/useHydration";
import { WaveBackground } from "@/components/WaveBackground";
import { ProgressCard } from "@/components/ProgressCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RefreshCw, Sparkles, Droplets, CircleDashed, Flame } from "lucide-react";

const QUICK_AMOUNTS = [
  { label: "Sip", amount: 150 },
  { label: "Glass", amount: 250 },
  { label: "Can", amount: 330 },
  { label: "Bottle", amount: 500 },
];

const MILESTONE_STEPS = [0.2, 0.4, 0.6, 0.8, 1];

export default function Home() {
  const { intake, animatedIntake, goal, addDrink, resetDaily, mounted } = useHydration();

  if (!mounted) {
    return <main className="min-h-screen bg-water-50" />;
  }

  const progressAttr = Math.min(1, Math.max(0, animatedIntake / goal));
  const remaining = Math.max(0, goal - intake);
  const completedToday = intake >= goal;
  const isNewUser = intake === 0;

  return (
    <main className="flex flex-col items-center p-6 pb-24 pt-6 w-full max-w-md mx-auto relative min-h-[100dvh] overflow-hidden">
      <WaveBackground progress={progressAttr} />

      <div className="w-full z-10 flex flex-col gap-5">
        <header className="relative w-full text-center mt-2 z-20">
          <div className="absolute right-0 top-0 z-50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetDaily}
              className="p-2.5 text-water-300 hover:text-white rounded-full bg-water-800/30 hover:bg-water-700/50 backdrop-blur-md transition-all active:rotate-180"
              title="Reset today&apos;s hydration"
            >
              <RefreshCw className="w-5 h-5" strokeWidth={2.5} />
            </Button>
          </div>

          <h1 className="text-6xl font-black tracking-tighter text-white drop-shadow-md">Fluid.</h1>
          <p className="text-xs font-semibold mt-1 tracking-widest text-water-200 uppercase">
            {completedToday ? "Today is complete" : "Build your daily rhythm"}
          </p>
        </header>

        <Card className="w-full px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-water-300/80">
                {completedToday ? "Ocean mode" : "Next milestone"}
              </p>
              <p className="mt-1 text-2xl font-black text-white tracking-tight">
                {completedToday ? "Goal secured" : `${remaining} ml left`}
              </p>
              <p className="mt-1 text-xs font-semibold text-water-400/80">
                {completedToday
                  ? "Perfect place for the shark reward later."
                  : `${Math.ceil(remaining / 250)} quick glasses until the finish line.`}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-water-300/20 bg-water-800/40">
              {completedToday ? (
                <Sparkles className="h-6 w-6 text-water-100" strokeWidth={2.5} />
              ) : (
                <Droplets className="h-6 w-6 text-water-200" strokeWidth={2.5} />
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-5 gap-2">
            {MILESTONE_STEPS.map((step, index) => {
              const unlocked = progressAttr >= step;

              return (
                <div
                  key={step}
                  className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 transition-all duration-500 ${
                    unlocked
                      ? "border-water-200/35 bg-water-400/18 shadow-[0_0_20px_rgba(94,234,212,0.18)]"
                      : "border-water-400/10 bg-water-900/25"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                      unlocked
                        ? "border-water-200/40 bg-water-300/20 text-water-50"
                        : "border-water-500/20 bg-water-900/30 text-water-500/80"
                    }`}
                  >
                    {unlocked ? <Droplets className="h-4 w-4" strokeWidth={2.5} /> : <CircleDashed className="h-4 w-4" strokeWidth={2.2} />}
                  </div>
                  <span className={`text-[10px] font-bold ${unlocked ? "text-water-100" : "text-water-500/80"}`}>
                    {index === MILESTONE_STEPS.length - 1 ? "100%" : `${Math.round(step * 100)}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex-1 flex flex-col justify-center items-center w-full min-h-0">
          <ProgressCard intake={intake} goal={goal} />
        </div>

        {isNewUser && (
          <Card className="w-full px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-water-300/80">First day tip</p>
            <p className="mt-2 text-lg font-bold text-white">Start with one easy tap.</p>
            <p className="mt-1 text-sm text-water-300/80">
              The app feels best when logging water is effortless. Tap a real-life amount and let the streak build itself.
            </p>
          </Card>
        )}

        <section className="w-full">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-water-300/80">Quick add</p>
            <p className="text-xs font-semibold text-water-400/70">Use the amounts you drink most</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {QUICK_AMOUNTS.map((item) => (
              <Button
                key={item.amount}
                variant="secondary"
                onClick={() => addDrink(item.amount)}
                className="rounded-3xl py-4 shadow-sm"
              >
                <span className="flex flex-col items-center leading-tight gap-1">
                  <span className="text-water-400 text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
                  <span className="text-base font-bold text-white">{item.amount}ml</span>
                </span>
              </Button>
            ))}
          </div>
        </section>

        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-3xl py-4.5 text-lg shadow-xl shadow-water-500/20 group relative overflow-hidden"
          onClick={() => addDrink(250)}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <span className="relative z-10 flex items-center justify-center gap-2 font-bold tracking-wide">
            <Flame className="w-5 h-5" strokeWidth={2.5} />
            {completedToday ? "Keep the streak glowing" : "Add 250ml"}
          </span>
        </Button>
      </div>
    </main>
  );
}
