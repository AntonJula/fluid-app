"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { GoalSettings } from "@/components/GoalSettings";
import { ReminderSettings } from "@/components/ReminderSettings";
import { NavSettings } from "@/components/NavSettings";
import { DataSettings } from "@/components/DataSettings";
import { HydrationLoadingState } from "@/components/HydrationLoadingState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const router = useRouter();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isGoalFocused, setIsGoalFocused] = useState(false);
  const goalSettingsRef = useRef<HTMLDivElement>(null);
  const advancedSettingsRef = useRef<HTMLDivElement>(null);
  const {
    goal,
    setGoal,
    reminderInterval,
    setReminderInterval,
    quietHours,
    setQuietHours,
    hideNav,
    setHideNav,
    exportHydrationState,
    importHydrationState,
    mounted,
  } = useHydration();

  useEffect(() => {
    if (!isAdvancedOpen) return;

    const timer = window.setTimeout(() => {
      advancedSettingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 140);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isAdvancedOpen]);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("focus") !== "goal") return;

    const timers: number[] = [];
    const scrollTimer = window.setTimeout(() => {
      goalSettingsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

      const startHighlightTimer = window.setTimeout(() => {
        setIsGoalFocused(true);

        const stopHighlightTimer = window.setTimeout(() => {
          setIsGoalFocused(false);
        }, 2600);
        timers.push(stopHighlightTimer);
      }, 260);
      timers.push(startHighlightTimer);
    }, 120);
    timers.push(scrollTimer);

    searchParams.delete("focus");
    const nextQuery = searchParams.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [mounted]);

  if (!mounted) {
    return <HydrationLoadingState />;
  }

  return (
    <main className="fluid-page-shell mx-auto flex min-h-[100dvh] w-full max-w-[25.5rem] flex-1 flex-col items-center px-3.5 pb-28 pt-6 min-[380px]:px-4 min-[380px]:pb-28 min-[380px]:pt-5 sm:px-6 sm:pb-28 sm:pt-6 md:max-w-[30rem]">
      <header className="fluid-page-header mb-7 mt-2 w-full text-center" data-fluid-reveal>
        <h1 className="font-display text-4xl font-black text-white drop-shadow-md">Settings.</h1>
        <p className="font-ui text-xs font-semibold mt-2 tracking-widest text-water-200 uppercase mb-6">Customize Fluid</p>
      </header>

      <div className="fluid-stack-flow w-full space-y-6 flex-1">
        <div ref={goalSettingsRef} className="scroll-mt-6">
          <GoalSettings goal={goal} setGoal={setGoal} isHighlighted={isGoalFocused} />
        </div>
        <div>
          <ReminderSettings
            interval={reminderInterval}
            setInterval={setReminderInterval}
            quietHours={quietHours}
            setQuietHours={setQuietHours}
          />
        </div>
        <Card
          data-fluid-stack
          className={`mx-auto mt-4 w-full max-w-sm overflow-hidden p-0 shadow-lg md:max-w-[28rem] ${
            isAdvancedOpen
              ? "border-cyan-100/20 bg-water-900/24 shadow-cyan-950/18"
              : "hover:border-water-200/18 hover:bg-water-900/22"
          }`}
        >
          <button
            type="button"
            onClick={() => setIsAdvancedOpen((isOpen) => !isOpen)}
            className={`relative flex w-full items-center justify-between gap-3 overflow-hidden px-4 py-4 text-left transition-all duration-300 min-[380px]:gap-4 min-[380px]:px-5 ${
              isAdvancedOpen ? "bg-cyan-300/8" : "hover:bg-white/[0.03]"
            }`}
            aria-expanded={isAdvancedOpen}
            aria-controls="advanced-settings"
          >
            {isAdvancedOpen && (
              <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/72 to-transparent" />
            )}
            <span className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 min-[380px]:h-10 min-[380px]:w-10 ${
                  isAdvancedOpen
                    ? "border-cyan-100/28 bg-cyan-300/16 text-cyan-50 shadow-[0_0_22px_rgba(125,211,252,0.18)]"
                    : "border-water-300/14 bg-water-800/35 text-water-200"
                }`}
              >
                <SlidersHorizontal className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="min-w-0">
                <span className="font-ui block text-lg font-semibold tracking-normal text-white">Advanced</span>
                <span
                  className={`font-body mt-1 block text-sm transition-colors duration-300 ${
                    isAdvancedOpen ? "text-cyan-100/84" : "text-water-300/80"
                  }`}
                >
                  Navigation, setup, and local backup.
                </span>
              </span>
            </span>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                isAdvancedOpen
                  ? "border-cyan-100/24 bg-cyan-100/12"
                  : "border-water-300/12 bg-water-950/18"
              }`}
            >
              <ChevronDown
                className={`h-5 w-5 text-water-300 transition-transform duration-300 ${
                  isAdvancedOpen ? "rotate-180 text-cyan-100" : "rotate-0"
                }`}
                strokeWidth={2.5}
              />
            </span>
          </button>

          {isAdvancedOpen && (
            <div
              ref={advancedSettingsRef}
              id="advanced-settings"
              className="scroll-mt-4 divide-y divide-water-300/10 border-t border-cyan-100/14 bg-water-950/10 px-4 min-[380px]:px-5"
            >
              <NavSettings hideNav={hideNav} setHideNav={setHideNav} embedded />
              <section className="w-full py-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-water-300/14 bg-water-800/32 text-water-200">
                    <RotateCcw className="h-4.5 w-4.5" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-ui text-base font-bold tracking-normal text-white">Habit setup</h3>
                    <p className="font-body mt-1 text-xs leading-relaxed text-water-300/76">
                      Revisit your starting choices without deleting drinks or progress.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="brightOutline"
                  size="sm"
                  onClick={() => router.push("/?setup=true")}
                  className="mt-4 min-h-11 w-full rounded-xl px-4 text-xs"
                >
                  Run setup again
                </Button>
              </section>
              <DataSettings
                exportHydrationState={exportHydrationState}
                importHydrationState={importHydrationState}
                embedded
              />
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
