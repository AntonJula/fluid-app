"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";

export interface HydrationHistoryItem {
  date: string;
  intake: number;
  goal: number;
}

export interface HydrationState {
  intake: number;
  goal: number;
  streak: number;
  reminderInterval: number;
  quietHours: { start: string; end: string };
  lastUpdated: string;
  history: HydrationHistoryItem[];
}

const DEFAULT_GOAL = 2500;
const STORAGE_KEY = "fluid-hydration";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getDefaultState(): HydrationState {
  return {
    intake: 0,
    goal: DEFAULT_GOAL,
    streak: 0,
    reminderInterval: 0,
    quietHours: { start: "22:00", end: "07:00" },
    lastUpdated: getTodayDate(),
    history: [],
  };
}

function getInitialHydrationState(): HydrationState {
  if (typeof window === "undefined") {
    return getDefaultState();
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return getDefaultState();
  }

  try {
    const parsed = JSON.parse(stored) as Partial<HydrationState>;
    const today = getTodayDate();
    const loadedState: HydrationState = {
      intake: parsed.intake ?? 0,
      goal: parsed.goal ?? DEFAULT_GOAL,
      streak: parsed.streak ?? 0,
      reminderInterval: parsed.reminderInterval ?? 0,
      quietHours: parsed.quietHours ?? { start: "22:00", end: "07:00" },
      lastUpdated: parsed.lastUpdated ?? today,
      history: parsed.history ?? [],
    };

    if (loadedState.lastUpdated === today) {
      return loadedState;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak = loadedState.streak;
    if (loadedState.lastUpdated === yesterdayStr && loadedState.intake >= loadedState.goal) {
      newStreak += 1;
    } else if (loadedState.lastUpdated !== yesterdayStr) {
      newStreak = 0;
    }

    const updatedHistory = [...loadedState.history];
    if (loadedState.lastUpdated && !updatedHistory.find((item) => item.date === loadedState.lastUpdated)) {
      updatedHistory.push({
        date: loadedState.lastUpdated,
        intake: loadedState.intake,
        goal: loadedState.goal,
      });
    }

    if (updatedHistory.length > 14) updatedHistory.shift();

    return {
      ...loadedState,
      intake: 0,
      streak: newStreak,
      lastUpdated: today,
      history: updatedHistory,
    };
  } catch (err) {
    console.error("Failed to parse hydration data", err);
    return getDefaultState();
  }
}

export function useHydration() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  const [state, setState] = useState<HydrationState>(getInitialHydrationState);
  const [animatedIntake, setAnimatedIntake] = useState(0);
  const animatedIntakeRef = useRef(0);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, mounted]);

  useEffect(() => {
    if (!mounted) return;

    let animationFrameId: number;
    const startValue = animatedIntakeRef.current;
    const targetValue = state.intake;
    const startTime = performance.now();
    const duration = 1500;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressParam = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progressParam, 4);

      const currentVal = startValue + (targetValue - startValue) * easeOutQuart;
      animatedIntakeRef.current = currentVal;
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

  const setQuietHours = (start: string, end: string) => {
    setState((prev: HydrationState) => ({
      ...prev,
      quietHours: { start, end },
    }));
  };

  return {
    ...state,
    animatedIntake,
    addDrink,
    setGoal,
    setReminderInterval,
    setQuietHours,
    resetDaily,
    mounted,
  };
}
