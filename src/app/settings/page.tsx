"use client";

import React from "react";
import { useHydration } from "@/hooks/useHydration";
import { GoalSettings } from "@/components/GoalSettings";
import { ReminderSettings } from "@/components/ReminderSettings";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  const { goal, setGoal, reminderInterval, setReminderInterval, quietHours, setQuietHours, mounted } = useHydration();

  if (!mounted) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="flex-1 flex flex-col items-center p-6 w-full max-w-md mx-auto min-h-[100dvh]">
      <header className="w-full text-center mt-4 mb-8">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-md">Settings.</h1>
        <p className="text-xs font-semibold mt-1 tracking-widest text-water-200 uppercase mb-6">Customize Fluid</p>
      </header>

      <Card className="w-full mb-6 p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-water-300/80">Habit setup</p>
        <p className="mt-2 text-xl font-black text-white">Keep it easy to win every day.</p>
        <p className="mt-2 text-sm text-water-300/80">
          A realistic goal and gentle reminders will do more for retention than aggressive settings ever will.
        </p>
      </Card>

      <div className="w-full space-y-6 flex-1">
        <GoalSettings goal={goal} setGoal={setGoal} />
        <ReminderSettings
          interval={reminderInterval}
          setInterval={setReminderInterval}
          quietHours={quietHours}
          setQuietHours={setQuietHours}
        />
      </div>
    </main>
  );
}
