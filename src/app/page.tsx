"use client";

import React from "react";
import { useHydration } from "@/hooks/useHydration";
import { WaveBackground } from "@/components/WaveBackground";
import { ProgressCard } from "@/components/ProgressCard";
import { Button } from "@/components/ui/Button";
import { Check, Minus, RefreshCw, RotateCcw, X } from "lucide-react";
import { SipIcon, GlassIcon, MugIcon, BottleIcon } from "@/components/DrinkIcons";
import { useSwipeUiState } from "@/hooks/useSwipeUiState";

const QUICK_AMOUNTS = [
  { label: "Sip", amount: 150, Icon: SipIcon },
  { label: "Mug", amount: 330, Icon: MugIcon },
  { label: "Bottle", amount: 500, Icon: BottleIcon },
];
const SHIMMER_DELAYS = ["4.8s", "7.9s", "2.6s", "6.1s"];

function formatLogTime(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default function Home() {
  const { intake, goal, drinkLog, addDrink, subtractDrink, undoLastDrink, resetDaily, mounted } = useHydration();
  const { navigationTick } = useSwipeUiState();
  const [isResetConfirming, setIsResetConfirming] = React.useState(false);

  if (!mounted) {
    return <main className="min-h-screen bg-water-50" />;
  }

  const progressAttr = Math.min(1, Math.max(0, intake / goal));
  const completedToday = intake >= goal;
  const latestLog = drinkLog.slice(0, 3);

  const handleReset = () => {
    if (!isResetConfirming) {
      setIsResetConfirming(true);
      window.setTimeout(() => setIsResetConfirming(false), 4000);
      return;
    }

    resetDaily();
    setIsResetConfirming(false);
  };

  return (
    <main className="flex flex-col items-center p-6 pb-24 pt-6 w-full max-w-md mx-auto relative min-h-[100dvh] overflow-hidden">
      <WaveBackground progress={progressAttr} />

      <div key={`home-${navigationTick}`} className="w-full z-10 flex flex-col gap-5 h-full flex-1 animate-[page-rise_520ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
        <header className="relative w-full text-center mt-2 z-20">
          <div className="absolute right-0 top-0 z-50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                isResetConfirming
                  ? "bg-rose-500/25 text-rose-100 hover:bg-rose-500/35"
                  : "text-water-300 hover:text-white bg-water-800/30 hover:bg-water-700/50 active:rotate-180"
              }`}
              title={isResetConfirming ? "Tap again to reset today's hydration" : "Reset today's hydration"}
            >
              {isResetConfirming ? <Check className="w-5 h-5" strokeWidth={2.5} /> : <RefreshCw className="w-5 h-5" strokeWidth={2.5} />}
            </Button>
          </div>

          <h1 className="font-display text-6xl font-black text-white drop-shadow-md">Fluid.</h1>
          <p className="font-ui text-xs font-semibold mt-1 tracking-widest text-water-200 uppercase">
            {completedToday ? "Today is complete" : "Build your daily rhythm"}
          </p>
        </header>

        <div className="flex flex-col items-center w-full min-h-0 mt-4">
          <ProgressCard intake={intake} goal={goal} />
        </div>

        <section className="w-full mt-1 space-y-3">
          <div className="flex items-center justify-between mb-3 px-2">
            <p className="font-ui text-[12px] uppercase tracking-[0.2em] font-bold text-water-200/90">Quick add</p>
            <p className="font-body text-xs font-semibold text-water-300/80">Tap to log</p>
          </div>

          <button
            onClick={() => addDrink(250)}
            className="group relative flex min-h-[6.8rem] w-full items-center justify-between overflow-hidden rounded-[1.5rem] border border-cyan-100/25 bg-gradient-to-br from-cyan-300/26 via-water-500/18 to-emerald-300/18 px-5 py-4 text-left shadow-[0_18px_40px_rgba(8,47,73,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-100/40 hover:brightness-110 active:scale-[0.98]"
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-cyan-100">
                <GlassIcon className="h-7 w-7 drop-shadow-md" />
                <span className="font-ui text-[0.78rem] font-black uppercase tracking-[0.18em]">Daily glass</span>
              </div>
              <p className="font-body mt-2 max-w-[13rem] text-sm font-semibold leading-snug text-water-100/82">
                The fastest way to keep the habit moving.
              </p>
            </div>
            <div className="relative z-10 text-right">
              <p className="font-numeric text-5xl font-black leading-none text-white drop-shadow-xl">250</p>
              <p className="font-ui mt-1 text-xs font-black uppercase tracking-[0.24em] text-cyan-100/75">ml</p>
            </div>
          </button>

          <div className="grid grid-cols-3 gap-3">
            {QUICK_AMOUNTS.map((item) => (
              <button
                key={item.amount}
                onClick={() => addDrink(item.amount)}
                className="group relative overflow-hidden flex flex-col items-center justify-center gap-2 rounded-[1.25rem] py-4 px-2 border border-white/10 bg-white/5 shadow-[0_8px_16px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-lg hover:bg-white/10 hover:border-white/20 hover:shadow-[0_12px_24px_rgba(56,189,248,0.2),inset_0_1px_2px_rgba(255,255,255,0.2)] hover:-translate-y-1 transition-all duration-300 active:scale-[0.97] outline-none"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div
                  className="pointer-events-none absolute inset-y-[-14%] -left-[120%] w-[205%] rotate-[14deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.14),rgba(255,255,255,0.46),rgba(255,255,255,0.14),rgba(255,255,255,0))] opacity-0 blur-[4px] animate-[quick-add-shimmer_15s_linear_infinite]"
                  style={{ animationDelay: SHIMMER_DELAYS[QUICK_AMOUNTS.findIndex((quickAmount) => quickAmount.amount === item.amount)] }}
                />
                <div className="flex items-center gap-1.5 text-water-200 group-hover:text-white transition-colors duration-300 relative z-10">
                  <item.Icon className="w-5 h-5 drop-shadow-md" />
                  <span
                    className={`font-ui text-[10px] uppercase font-extrabold ${
                      item.label === "Sip" ? "text-[13px] tracking-[0.12em]" : "tracking-[0.18em]"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <span className="font-numeric text-2xl font-black text-white drop-shadow-lg group-hover:scale-105 transition-transform duration-300 relative z-10 mt-1">
                  {item.amount}
                  <span className="font-ui text-[11px] text-water-300 font-extrabold tracking-normal ml-0.5">ml</span>
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={undoLastDrink}
              disabled={drinkLog.length === 0}
              className="rounded-[1.15rem] border-white/10 bg-water-950/28 px-4 py-3 text-water-100 disabled:opacity-35"
            >
              <RotateCcw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              Undo
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => subtractDrink(250)}
              disabled={intake === 0}
              className="rounded-[1.15rem] border-rose-200/15 bg-rose-500/10 px-4 py-3 text-rose-50 hover:bg-rose-500/18 disabled:opacity-35"
            >
              <Minus className="mr-2 h-4 w-4" strokeWidth={2.5} />
              250 ml
            </Button>
          </div>

          {isResetConfirming && (
            <div className="flex items-center justify-between rounded-2xl border border-rose-200/20 bg-rose-500/12 px-4 py-3 text-sm text-rose-50">
              <span className="font-body font-semibold">Tap check again to reset today.</span>
              <button
                type="button"
                onClick={() => setIsResetConfirming(false)}
                className="rounded-full p-1 text-rose-100/80 transition-colors hover:bg-white/10 hover:text-white"
                title="Cancel reset"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          )}

          {latestLog.length > 0 && (
            <div className="rounded-[1.35rem] border border-white/10 bg-water-950/22 px-4 py-3 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-ui text-[0.68rem] font-black uppercase tracking-[0.22em] text-water-300/82">Recent</p>
                <p className="font-body text-xs font-semibold text-water-300/70">{drinkLog.length} actions</p>
              </div>
              <div className="space-y-1.5">
                {latestLog.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className={`font-ui font-black ${item.amount > 0 ? "text-cyan-100" : "text-rose-100"}`}>
                      {item.amount > 0 ? "+" : ""}
                      {item.amount} ml
                    </span>
                    <span className="font-body text-xs font-semibold text-water-300/70">{formatLogTime(item.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes page-rise {
              0% {
                opacity: 0.84;
                transform: translateY(14px) scale(0.992);
                filter: blur(3px);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0);
              }
            }
            @keyframes quick-add-shimmer {
              0%, 8%, 100% {
                transform: translateX(-150%) rotate(14deg);
                opacity: 0;
              }
              10% {
                opacity: 0.3;
              }
              15% {
                transform: translateX(135%) rotate(14deg);
                opacity: 0.72;
              }
              17% {
                opacity: 0;
              }
            }
          `,
        }}
      />
    </main>
  );
}
