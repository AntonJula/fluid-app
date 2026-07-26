"use client";

import { useSyncExternalStore } from "react";
import { playWaterGulpSound } from "@/utils/audio";
import {
  DEFAULT_GOAL,
  DEFAULT_QUICK_ADD_AMOUNT,
  DEFAULT_WORKOUT_SESSION_MINUTES,
  MAX_STREAK_SHIELD_CHARGES,
  clampHydrationAmount,
  getDefaultHydrationState,
  normalizeHydrationState,
  rolloverHydrationState,
} from "@/lib/hydrationState";
import type {
  DrinkLogItem,
  HydrationContext,
  HydrationDrinkType,
  HydrationHistoryItem,
  HydrationState,
} from "@/lib/hydrationState";

const STORAGE_KEY = "fluid-hydration";
const HYDRATION_RESET_EVENT = "fluid-hydration-reset";

export type UseHydrationReturn = HydrationState & {
  addDrink: (amount: number, drinkType?: HydrationDrinkType, context?: HydrationContext) => void;
  subtractDrink: (amount: number, drinkType?: HydrationDrinkType, context?: HydrationContext) => void;
  undoLastDrink: () => void;
  updateDrinkLogItem: (id: string, amount: number, drinkType?: HydrationDrinkType, context?: HydrationContext) => void;
  deleteDrinkLogItem: (id: string) => void;
  setGoal: (newGoal: number) => void;
  setQuickAddAmount: (amount: number) => void;
  startWorkoutSession: (durationMinutes?: number) => void;
  pauseWorkoutSession: () => void;
  resumeWorkoutSession: () => void;
  endWorkoutSession: () => void;
  setReminderInterval: (interval: number) => void;
  setQuietHours: (start: string, end: string) => void;
  setHideNav: (hide: boolean) => void;
  exportHydrationState: () => HydrationState;
  importHydrationState: (stateLike: Partial<HydrationState>) => void;
  resetDaily: () => void;
  mounted: boolean;
};

const SERVER_SNAPSHOT: HydrationState = {
  intake: 0,
  goal: DEFAULT_GOAL,
  streak: 0,
  streakShieldCharges: MAX_STREAK_SHIELD_CHARGES,
  streakAlert: null,
  workoutSessionStartedAt: null,
  workoutSessionEndsAt: null,
  workoutSessionDurationMinutes: DEFAULT_WORKOUT_SESSION_MINUTES,
  workoutSessionPausedRemainingMs: null,
  reminderInterval: 0,
  quietHours: { start: "22:00", end: "07:00" },
  hideNav: false,
  quickAddAmount: DEFAULT_QUICK_ADD_AMOUNT,
  lastUpdated: "",
  history: [],
  drinkLog: [],
};

function getDefaultState(): HydrationState {
  return getDefaultHydrationState();
}

let memoryState: HydrationState | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function persistState(state: HydrationState) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save hydration data", err);
  }
}

function getSnapshot(): HydrationState {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;

  if (memoryState) return memoryState;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      memoryState = getDefaultState();
      return memoryState;
    }

    const parsed = JSON.parse(stored) as Partial<HydrationState>;
    const loadedState = normalizeHydrationState(parsed);
    memoryState = rolloverHydrationState(loadedState);
    persistState(memoryState);

    return memoryState;
  } catch (err) {
    console.error("Failed to load hydration data", err);
    memoryState = getDefaultState();
    return memoryState;
  }
}

function getCurrentState(): HydrationState {
  return memoryState ?? getSnapshot();
}

function updateState(nextState: HydrationState | ((state: HydrationState) => HydrationState)) {
  const resolvedState = typeof nextState === "function" ? nextState(getCurrentState()) : nextState;
  memoryState = resolvedState;
  persistState(resolvedState);
  emitChange();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      memoryState = null;
      emitChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useHydration(): UseHydrationReturn {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  const state = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  const streak = state.streak + (state.intake > 0 ? 1 : 0);
  const streakShieldCharges =
    state.intake > 0
      ? Math.min(MAX_STREAK_SHIELD_CHARGES, state.streakShieldCharges + 1)
      : state.streakShieldCharges;

  const addDrink = (
    amount: number,
    drinkType: HydrationDrinkType = "water",
    context?: HydrationContext
  ) => {
    const safeAmount = clampHydrationAmount(amount, 1, 5000);
    const now = Date.now();

    playWaterGulpSound();

    updateState((currentState) => ({
      ...currentState,
      intake: clampHydrationAmount(currentState.intake + safeAmount),
      drinkLog: [
        {
          id: `${now}-${safeAmount}-${Math.random().toString(16).slice(2)}`,
          amount: safeAmount,
          timestamp: now,
          drinkType,
          ...(context ? { context } : {}),
        },
        ...currentState.drinkLog,
      ].slice(0, 50),
    }));
  };

  const subtractDrink = (
    amount: number,
    drinkType: HydrationDrinkType = "water",
    context?: HydrationContext
  ) => {
    const safeAmount = clampHydrationAmount(amount, 1, 5000);

    updateState((currentState) => ({
      ...currentState,
      intake: clampHydrationAmount(currentState.intake - safeAmount),
      drinkLog: [
        {
          id: `${Date.now()}-${safeAmount}-subtract-${Math.random().toString(16).slice(2)}`,
          amount: -safeAmount,
          timestamp: Date.now(),
          drinkType,
          ...(context ? { context } : {}),
        },
        ...currentState.drinkLog,
      ].slice(0, 50),
    }));
  };

  const undoLastDrink = () => {
    updateState((currentState) => {
      const [lastDrink, ...remainingLog] = currentState.drinkLog;

      if (!lastDrink) return currentState;

      return {
        ...currentState,
        intake: clampHydrationAmount(currentState.intake - lastDrink.amount),
        drinkLog: remainingLog,
      };
    });
  };

  const setGoal = (newGoal: number) => {
    updateState((currentState) => ({
      ...currentState,
      goal: clampHydrationAmount(newGoal, 500, 10000),
    }));
  };

  const updateDrinkLogItem = (
    id: string,
    amount: number,
    drinkType?: HydrationDrinkType,
    context?: HydrationContext
  ) => {
    const safeAmount = clampHydrationAmount(amount, -5000, 5000);
    if (safeAmount === 0) return;

    updateState((currentState) => {
      const existingItem = currentState.drinkLog.find((item) => item.id === id);
      if (!existingItem) return currentState;

      return {
        ...currentState,
        intake: clampHydrationAmount(currentState.intake + safeAmount - existingItem.amount),
        drinkLog: currentState.drinkLog.map((item) =>
          item.id === id
            ? {
                ...item,
                amount: safeAmount,
                drinkType: drinkType ?? item.drinkType,
                ...(context
                  ? { context }
                  : item.context
                    ? { context: item.context }
                    : {}),
              }
            : item
        ),
      };
    });
  };

  const deleteDrinkLogItem = (id: string) => {
    updateState((currentState) => {
      const existingItem = currentState.drinkLog.find((item) => item.id === id);
      if (!existingItem) return currentState;

      return {
        ...currentState,
        intake: clampHydrationAmount(currentState.intake - existingItem.amount),
        drinkLog: currentState.drinkLog.filter((item) => item.id !== id),
      };
    });
  };

  const setQuickAddAmount = (amount: number) => {
    updateState((currentState) => ({
      ...currentState,
      quickAddAmount: clampHydrationAmount(amount, 50, 5000),
    }));
  };

  const startWorkoutSession = (durationMinutes = DEFAULT_WORKOUT_SESSION_MINUTES) => {
    const safeDuration = clampHydrationAmount(durationMinutes, 15, 240);
    const now = Date.now();

    updateState((currentState) => ({
      ...currentState,
      workoutSessionStartedAt: now,
      workoutSessionEndsAt: now + safeDuration * 60 * 1000,
      workoutSessionDurationMinutes: safeDuration,
      workoutSessionPausedRemainingMs: null,
    }));
  };

  const pauseWorkoutSession = () => {
    const now = Date.now();

    updateState((currentState) => {
      if (!currentState.workoutSessionEndsAt) return currentState;

      const remainingMs = Math.max(0, currentState.workoutSessionEndsAt - now);

      return {
        ...currentState,
        workoutSessionEndsAt: null,
        workoutSessionPausedRemainingMs: remainingMs > 0 ? remainingMs : null,
      };
    });
  };

  const resumeWorkoutSession = () => {
    const now = Date.now();

    updateState((currentState) => {
      const remainingMs = currentState.workoutSessionPausedRemainingMs;
      if (!remainingMs || remainingMs <= 0) return currentState;

      const durationMs = currentState.workoutSessionDurationMinutes * 60 * 1000;
      const elapsedMs = Math.max(0, durationMs - remainingMs);

      return {
        ...currentState,
        workoutSessionStartedAt: now - elapsedMs,
        workoutSessionEndsAt: now + remainingMs,
        workoutSessionPausedRemainingMs: null,
      };
    });
  };

  const endWorkoutSession = () => {
    updateState((currentState) => ({
      ...currentState,
      workoutSessionStartedAt: null,
      workoutSessionEndsAt: null,
      workoutSessionPausedRemainingMs: null,
    }));
  };

  const resetDaily = () => {
    updateState((currentState) => ({
      ...currentState,
      intake: 0,
      drinkLog: [],
    }));

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        window.dispatchEvent(new Event(HYDRATION_RESET_EVENT));
      }, 0);
    }
  };

  const setReminderInterval = (interval: number) => {
    updateState((currentState) => ({
      ...currentState,
      reminderInterval: interval,
    }));
  };

  const setQuietHours = (start: string, end: string) => {
    updateState((currentState) => ({
      ...currentState,
      quietHours: { start, end },
    }));
  };

  const setHideNav = (hide: boolean) => {
    updateState((currentState) => ({
      ...currentState,
      hideNav: hide,
    }));
  };

  const exportHydrationState = () => getCurrentState();

  const importHydrationState = (stateLike: Partial<HydrationState>) => {
    updateState(rolloverHydrationState(normalizeHydrationState(stateLike)));
  };

  const hydration: UseHydrationReturn = {
    ...state,
    streak,
    streakShieldCharges,
    addDrink,
    subtractDrink,
    undoLastDrink,
    updateDrinkLogItem,
    deleteDrinkLogItem,
    setGoal,
    setQuickAddAmount,
    startWorkoutSession,
    pauseWorkoutSession,
    resumeWorkoutSession,
    endWorkoutSession,
    setReminderInterval,
    setQuietHours,
    setHideNav,
    exportHydrationState,
    importHydrationState,
    resetDaily,
    mounted,
  };

  return hydration;
}

export type {
  DrinkLogItem,
  HydrationContext,
  HydrationDrinkType,
  HydrationHistoryItem,
  HydrationState,
};
