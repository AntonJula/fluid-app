"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_GOAL,
  DEFAULT_QUICK_ADD_AMOUNT,
  clampHydrationAmount,
  getDefaultHydrationState,
  normalizeHydrationState,
  rolloverHydrationState,
  type DrinkLogItem,
  type HydrationState,
  type HydrationHistoryItem,
  type HydrationNote,
} from "@/lib/hydrationState";
const STORAGE_KEY = "fluid-hydration";
const SERVER_SNAPSHOT: HydrationState = {
  intake: 0,
  goal: DEFAULT_GOAL,
  streak: 0,
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
  listeners.forEach(listener => listener());
}

function getSnapshot() {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  
  if (memoryState) return memoryState;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    memoryState = getDefaultState();
    return memoryState;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<HydrationState>;
    const loadedState = normalizeHydrationState(parsed);
    memoryState = rolloverHydrationState(loadedState);
    
    // Save the daily reset back
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    
    return memoryState;
  } catch (err) {
    console.error("Failed to parse hydration data", err);
    memoryState = getDefaultState();
    return memoryState;
  }
}

function getCurrentState() {
  return memoryState ?? getSnapshot();
}

function updateState(nextState: HydrationState | ((state: HydrationState) => HydrationState)) {
  const resolvedState = typeof nextState === "function" ? nextState(getCurrentState()) : nextState;
  memoryState = resolvedState;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedState));
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      memoryState = null; // force reload from localstorage
      emitChange();
    }
  };
  
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useHydration() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  const state = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  const streak = state.streak + (state.intake >= state.goal ? 1 : 0);

  const addDrink = (amount: number, note?: HydrationNote) => {
    const safeAmount = clampHydrationAmount(amount, 1, 5000);

    updateState((currentState) => ({
      ...currentState,
      intake: clampHydrationAmount(currentState.intake + safeAmount),
      drinkLog: [
        {
          id: `${Date.now()}-${safeAmount}-${Math.random().toString(16).slice(2)}`,
          amount: safeAmount,
          timestamp: Date.now(),
          ...(note ? { note } : {}),
        },
        ...currentState.drinkLog,
      ].slice(0, 50),
    }));
  };

  const subtractDrink = (amount: number, note?: HydrationNote) => {
    const safeAmount = clampHydrationAmount(amount, 1, 5000);

    updateState((currentState) => ({
      ...currentState,
      intake: clampHydrationAmount(currentState.intake - safeAmount),
      drinkLog: [
        {
          id: `${Date.now()}-${safeAmount}-subtract-${Math.random().toString(16).slice(2)}`,
          amount: -safeAmount,
          timestamp: Date.now(),
          ...(note ? { note } : {}),
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

  const updateDrinkLogItem = (id: string, amount: number, note?: HydrationNote) => {
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
                ...(note ? { note } : { note: item.note }),
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

  const resetDaily = () => {
    updateState((currentState) => ({
      ...currentState,
      intake: 0,
      drinkLog: [],
    }));
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

  return {
    ...state,
    streak,
    addDrink,
    subtractDrink,
    undoLastDrink,
    updateDrinkLogItem,
    deleteDrinkLogItem,
    setGoal,
    setQuickAddAmount,
    setReminderInterval,
    setQuietHours,
    setHideNav,
    exportHydrationState,
    importHydrationState,
    resetDaily,
    mounted,
  };
}

export type { DrinkLogItem, HydrationHistoryItem, HydrationNote, HydrationState };
