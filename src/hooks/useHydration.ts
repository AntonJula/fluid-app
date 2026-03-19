"use client";

import { useState, useEffect } from "react";

export interface HydrationState {
  intake: number;
  goal: number;
  streak: number;
  reminderInterval: number; // 0 means off
  lastUpdated: string; // ISO date string without time to check for a new day
}

const DEFAULT_GOAL = 2500; // 2.5L

export function useHydration() {
  const [state, setState] = useState<HydrationState>({
    intake: 0,
    goal: DEFAULT_GOAL,
    streak: 0,
    reminderInterval: 0,
    lastUpdated: new Date().toISOString().split("T")[0],
  });

  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("fluid-hydration");
    if (stored) {
      try {
        const parsed: HydrationState = JSON.parse(stored);
        const today = new Date().toISOString().split("T")[0];
        
        // Check if it's a new day
        if (parsed.lastUpdated !== today) {
          // Check if streak is preserved (was goal met yesterday?)
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];
          
          let newStreak = parsed.streak;
          if (parsed.lastUpdated === yesterdayStr && parsed.intake >= parsed.goal) {
            newStreak += 1;
          } else if (parsed.lastUpdated !== yesterdayStr) {
            newStreak = 0; // Missed a day
          }

          // Reset intake for today
          setState({
            ...parsed,
            intake: 0,
            streak: newStreak,
            lastUpdated: today,
          });
        } else {
          setState(parsed);
        }
      } catch (err) {
        console.error("Failed to parse hydration data", err);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("fluid-hydration", JSON.stringify(state));
    }
  }, [state, mounted]);

  const addDrink = (amount: number) => {
    setState((prev) => ({
      ...prev,
      intake: prev.intake + amount,
    }));
  };

  const setGoal = (newGoal: number) => {
    setState((prev) => ({
      ...prev,
      goal: newGoal,
    }));
  };

  const setReminderInterval = (interval: number) => {
    setState((prev: HydrationState) => ({
      ...prev,
      reminderInterval: interval,
    }));
  };

  return {
    ...state,
    addDrink,
    setGoal,
    setReminderInterval,
    mounted,
  };
}
