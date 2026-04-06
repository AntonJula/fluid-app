"use client";

import { useSyncExternalStore } from "react";

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
  hideNav: boolean;
  lastUpdated: string;
  history: HydrationHistoryItem[];
}

const DEFAULT_GOAL = 2500;
const STORAGE_KEY = "fluid-hydration";

function formatDateLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getTodayDate() {
  return formatDateLocal(new Date());
}

function getDefaultState(): HydrationState {
  return {
    intake: 0,
    goal: DEFAULT_GOAL,
    streak: 0,
    reminderInterval: 0,
    quietHours: { start: "22:00", end: "07:00" },
    hideNav: false,
    lastUpdated: getTodayDate(),
    history: [],
  };
}

let memoryState: HydrationState | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach(listener => listener());
}

function getSnapshot() {
  if (typeof window === "undefined") return getDefaultState();
  
  if (memoryState) return memoryState;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    memoryState = getDefaultState();
    return memoryState;
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
      hideNav: parsed.hideNav ?? false,
      lastUpdated: parsed.lastUpdated ?? today,
      history: parsed.history ?? [],
    };

    if (loadedState.lastUpdated === today) {
      memoryState = loadedState;
      return memoryState;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateLocal(yesterday);

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

    const parts = loadedState.lastUpdated.split('-').map(Number);
    if (parts.length === 3) {
      const gapDate = new Date(parts[0], parts[1] - 1, parts[2]);
      gapDate.setDate(gapDate.getDate() + 1); 
      
      let safeGuard = 0;
      while (formatDateLocal(gapDate) !== today && safeGuard < 365) {
        const gapStr = formatDateLocal(gapDate);
        if (!updatedHistory.find(item => item.date === gapStr)) {
          updatedHistory.push({ date: gapStr, intake: 0, goal: loadedState.goal });
        }
        gapDate.setDate(gapDate.getDate() + 1);
        safeGuard++;
      }
    }

    memoryState = {
      ...loadedState,
      intake: 0,
      streak: newStreak,
      lastUpdated: today,
      history: updatedHistory,
    };
    
    // Save the daily reset back
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    
    return memoryState;
  } catch (err) {
    console.error("Failed to parse hydration data", err);
    memoryState = getDefaultState();
    return memoryState;
  }
}

function updateState(newState: HydrationState) {
  memoryState = newState;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
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

  const state = useSyncExternalStore(subscribe, getSnapshot, getDefaultState);

  const addDrink = (amount: number) => {
    updateState({ ...state, intake: state.intake + amount });
  };

  const setGoal = (newGoal: number) => {
    updateState({ ...state, goal: newGoal });
  };

  const resetDaily = () => {
    updateState({ ...state, intake: 0 });
  };

  const setReminderInterval = (interval: number) => {
    updateState({ ...state, reminderInterval: interval });
  };

  const setQuietHours = (start: string, end: string) => {
    updateState({ ...state, quietHours: { start, end } });
  };

  const setHideNav = (hide: boolean) => {
    updateState({ ...state, hideNav: hide });
  };

  return {
    ...state,
    addDrink,
    setGoal,
    setReminderInterval,
    setQuietHours,
    setHideNav,
    resetDaily,
    mounted,
  };
}
