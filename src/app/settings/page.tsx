"use client";

import React from "react";
import { useHydration } from "@/hooks/useHydration";
import { GoalSettings } from "@/components/GoalSettings";
import { ReminderSettings } from "@/components/ReminderSettings";
import { NavSettings } from "@/components/NavSettings";
import { Card } from "@/components/ui/Card";
import { SharkBackground } from "@/components/SharkBackground";
import { useSwipeUiState } from "@/hooks/useSwipeUiState";

export default function SettingsPage() {
  const { goal, setGoal, reminderInterval, setReminderInterval, quietHours, setQuietHours, hideNav, setHideNav, mounted } = useHydration();
  const { navigationTick } = useSwipeUiState();

  if (!mounted) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="flex-1 flex flex-col items-center p-6 w-full max-w-md mx-auto min-h-[100dvh]">
      <SharkBackground />
      
      <header key={`settings-header-${navigationTick}`} className="w-full text-center mt-4 mb-8 animate-[settings-rise_520ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
        <h1 className="font-display text-4xl font-black text-white drop-shadow-md">Settings.</h1>
        <p className="font-ui text-xs font-semibold mt-1 tracking-widest text-water-200 uppercase mb-6">Customize Fluid</p>
      </header>

      <Card key={`settings-intro-${navigationTick}`} className="w-full mb-6 p-5 animate-[settings-rise_580ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
        <p className="font-ui text-[11px] uppercase tracking-[0.22em] font-bold text-water-300/80">Habit setup</p>
        <p className="font-ui mt-2 text-xl font-black text-white">Keep it easy to win every day.</p>
        <p className="font-body mt-2 text-sm text-water-300/80">
          A realistic goal and gentle reminders will do more for retention than aggressive settings ever will.
        </p>
      </Card>

      <div key={`settings-controls-${navigationTick}`} className="w-full space-y-6 flex-1 animate-[settings-rise_660ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
        <div className="animate-[settings-rise_660ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
          <GoalSettings goal={goal} setGoal={setGoal} />
        </div>
        <div className="animate-[settings-rise_760ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
          <ReminderSettings
            interval={reminderInterval}
            setInterval={setReminderInterval}
            quietHours={quietHours}
            setQuietHours={setQuietHours}
          />
        </div>
        <div className="animate-[settings-rise_860ms_cubic-bezier(0.22,0.9,0.32,1)_both]">
          <NavSettings hideNav={hideNav} setHideNav={setHideNav} />
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes settings-rise {
              0% {
                opacity: 0;
                transform: translateY(16px);
                filter: blur(3px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
                filter: blur(0);
              }
            }
          `,
        }}
      />
    </main>
  );
}
