"use client";

import React from "react";
import { useHydration } from "@/hooks/useHydration";
import { GoalSettings } from "@/components/GoalSettings";
import { ReminderSettings } from "@/components/ReminderSettings";

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
