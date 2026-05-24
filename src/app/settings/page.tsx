"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { GoalSettings } from "@/components/GoalSettings";
import { ReminderSettings } from "@/components/ReminderSettings";
import { NavSettings } from "@/components/NavSettings";
import { DataSettings } from "@/components/DataSettings";
import { HydrationLoadingState } from "@/components/HydrationLoadingState";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
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

  if (!mounted) {
    return <HydrationLoadingState />;
  }

  return (
    <main className="flex-1 flex flex-col items-center p-4 sm:p-6 w-full max-w-[25.5rem] md:max-w-[30rem] mx-auto min-h-[100dvh]">
      <header className="w-full text-center mt-4 mb-8">
        <h1 className="font-display text-4xl font-black text-white drop-shadow-md">Settings.</h1>
        <p className="font-ui text-xs font-semibold mt-1 tracking-widest text-water-200 uppercase mb-6">Customize Fluid</p>
      </header>

      <Card className="w-full mb-6 p-5">
        <p className="font-ui text-[11px] uppercase tracking-[0.22em] font-bold text-water-300/80">Habit setup</p>
        <p className="font-ui mt-2 text-xl font-black text-white">Keep it easy to win every day.</p>
        <p className="font-body mt-2 text-sm text-water-300/80">
          A realistic goal and gentle reminders will do more for retention than aggressive settings ever will.
        </p>
      </Card>

      <div className="w-full space-y-6 flex-1">
        <div>
          <GoalSettings goal={goal} setGoal={setGoal} />
        </div>
        <div>
          <ReminderSettings
            interval={reminderInterval}
            setInterval={setReminderInterval}
            quietHours={quietHours}
            setQuietHours={setQuietHours}
          />
        </div>
        <Card className="w-full max-w-sm md:max-w-[28rem] mx-auto mt-4 overflow-hidden p-0 shadow-lg">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen((isOpen) => !isOpen)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
            aria-expanded={isAdvancedOpen}
            aria-controls="advanced-settings"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-water-300/14 bg-water-800/35 text-water-200">
                <SlidersHorizontal className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="min-w-0">
                <span className="font-ui block text-lg font-semibold tracking-normal text-white">Advanced</span>
                <span className="font-body mt-1 block text-sm text-water-300/80">Less common display controls.</span>
              </span>
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-water-300 transition-transform duration-200 ${
                isAdvancedOpen ? "rotate-180" : "rotate-0"
              }`}
              strokeWidth={2.5}
            />
          </button>

          {isAdvancedOpen && (
            <div id="advanced-settings" className="space-y-4 border-t border-water-300/12 px-0 pb-4 pt-1">
              <NavSettings hideNav={hideNav} setHideNav={setHideNav} />
              <DataSettings exportHydrationState={exportHydrationState} importHydrationState={importHydrationState} />
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
