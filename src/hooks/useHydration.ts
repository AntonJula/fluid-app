"use client";

import { useState, useEffect } from "react";

export interface HydrationHistoryItem {
  date: string;
  intake: number;
  goal: number;
}

export interface HydrationState {
  intake: number;
  goal: number;
  streak: number;
  reminderInterval: number; // 0 means off
  lastUpdated: string; // ISO date string without time to check for a new day
  history: HydrationHistoryItem[];
}

const DEFAULT_GOAL = 2500; // 2.5L

export function useHydration() {
  const [state, setState] = useState<HydrationState>({
    intake: 0,
    goal: DEFAULT_GOAL,
    streak: 0,
    reminderInterval: 0,
    lastUpdated: new Date().toISOString().split("T")[0],
    history: [],
  });

  const [mounted, setMounted] = useState(false);
  const [animatedIntake, setAnimatedIntake] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("fluid-hydration");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<HydrationState>;
        const today = new Date().toISOString().split("T")[0];
        
        let initialIntake = parsed.intake ?? 0;

        // Ensure standard fields exist
        const loadedState: HydrationState = {
          intake: initialIntake,
          goal: parsed.goal ?? DEFAULT_GOAL,
          streak: parsed.streak ?? 0,
          reminderInterval: parsed.reminderInterval ?? 0,
          lastUpdated: parsed.lastUpdated ?? today,
          history: parsed.history ?? [],
        };

        // Check if it's a new day
        if (loadedState.lastUpdated !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];
          
          let newStreak = loadedState.streak;
          if (loadedState.lastUpdated === yesterdayStr && loadedState.intake >= loadedState.goal) {
            newStreak += 1;
          } else if (loadedState.lastUpdated !== yesterdayStr) {
            newStreak = 0; // Missed a day
          }

          const updatedHistory = [...loadedState.history];
          if (loadedState.lastUpdated && !updatedHistory.find(h => h.date === loadedState.lastUpdated)) {
            updatedHistory.push({
              date: loadedState.lastUpdated,
              intake: loadedState.intake,
              goal: loadedState.goal,
            });
          }
          if (updatedHistory.length > 14) updatedHistory.shift();

          setState({
            ...loadedState,
            intake: 0,
            streak: newStreak,
            lastUpdated: today,
            history: updatedHistory,
          });
        } else {
          setState(loadedState);
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

  // Smooth intake animation loop
  useEffect(() => {
    if (!mounted) return;
    
    let animationFrameId: number;
    const startValue = animatedIntake;
    const targetValue = state.intake;
    const startTime = performance.now();
    const duration = 1500; // ms

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressParam = Math.min(elapsed / duration, 1);
      
      // cubic-bezier(0.25, 1, 0.5, 1) approximation
      const easeOutQuart = 1 - Math.pow(1 - progressParam, 4);
      
      const currentVal = startValue + (targetValue - startValue) * easeOutQuart;
      setAnimatedIntake(currentVal);

      if (progressParam < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [state.intake, mounted]);

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

  const resetDaily = () => {
    setState((prev) => ({
      ...prev,
      intake: 0,
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
    animatedIntake, // New exposed tracking property
    addDrink,
    setGoal,
    setReminderInterval,
    resetDaily,
    mounted,
  };
}
