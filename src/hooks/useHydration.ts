"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_GOAL,
  getDefaultHydrationState,
  normalizeHydrationState,
  rolloverHydrationState,
  type HydrationState,
  type HydrationHistoryItem,
} from "@/lib/hydrationState";
const STORAGE_KEY = "fluid-hydration";
const SERVER_SNAPSHOT: HydrationState = {
  intake: 0,
  goal: DEFAULT_GOAL,
  streak: 0,
  reminderInterval: 0,
  quietHours: { start: "22:00", end: "07:00" },
  hideNav: false,
  lastUpdated: "",
  history: [],
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

  const addDrink = (amount: number) => {
    updateState((currentState) => ({
      ...currentState,
      intake: currentState.intake + amount,
    }));
  };

  const setGoal = (newGoal: number) => {
    updateState((currentState) => ({
      ...currentState,
      goal: newGoal,
    }));
  };

  const resetDaily = () => {
    updateState((currentState) => ({
      ...currentState,
      intake: 0,
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

  return {
    ...state,
    streak,
    addDrink,
    setGoal,
    setReminderInterval,
    setQuietHours,
    setHideNav,
    resetDaily,
    mounted,
  };
}

export type { HydrationHistoryItem, HydrationState };
