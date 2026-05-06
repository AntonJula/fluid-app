import { formatDateLocal, getTodayDateLocal } from "./date.ts";

export interface HydrationHistoryItem {
  date: string;
  intake: number;
  goal: number;
}

export interface DrinkLogItem {
  id: string;
  amount: number;
  timestamp: number;
  note?: HydrationNote;
}

export interface HydrationState {
  intake: number;
  goal: number;
  streak: number;
  reminderInterval: number;
  quietHours: { start: string; end: string };
  hideNav: boolean;
  quickAddAmount: number;
  lastUpdated: string;
  history: HydrationHistoryItem[];
  drinkLog: DrinkLogItem[];
}

export const DEFAULT_GOAL = 2500;
export const DEFAULT_QUICK_ADD_AMOUNT = 250;
export const HYDRATION_NOTES = ["water", "coffee", "tea", "workout", "hot-day"] as const;
export type HydrationNote = (typeof HYDRATION_NOTES)[number];

function isHydrationNote(value: unknown): value is HydrationNote {
  return typeof value === "string" && HYDRATION_NOTES.includes(value as HydrationNote);
}

function normalizeDrinkLogItem(item: unknown): DrinkLogItem | null {
  if (!item || typeof item !== "object") return null;

  const candidate = item as Partial<DrinkLogItem>;
  const rawAmount = Number(candidate.amount);
  const amount = Number.isFinite(rawAmount) ? clampHydrationAmount(rawAmount, -5000, 5000) : 0;
  const timestamp = Number(candidate.timestamp);

  if (!candidate.id || amount === 0 || !Number.isFinite(timestamp)) return null;

  return {
    id: String(candidate.id),
    amount,
    timestamp,
    ...(isHydrationNote(candidate.note) ? { note: candidate.note } : {}),
  };
}

function normalizeDrinkLog(log: unknown) {
  if (!Array.isArray(log)) return [];

  return log
    .map(normalizeDrinkLogItem)
    .filter((item): item is DrinkLogItem => item !== null)
    .slice(0, 50);
}

function normalizeHistory(history: unknown, fallbackGoal: number): HydrationHistoryItem[] {
  if (!Array.isArray(history)) return [];

  return history
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const candidate = item as Partial<HydrationHistoryItem>;
      if (typeof candidate.date !== "string") return null;

      return {
        date: candidate.date,
        intake: clampHydrationAmount(candidate.intake ?? 0, 0, 50000),
        goal: clampHydrationAmount(candidate.goal ?? fallbackGoal, 500, 10000),
      };
    })
    .filter((item): item is HydrationHistoryItem => item !== null);
}

export function getDefaultHydrationState(): HydrationState {
  return {
    intake: 0,
    goal: DEFAULT_GOAL,
    streak: 0,
    reminderInterval: 0,
    quietHours: { start: "22:00", end: "07:00" },
    hideNav: false,
    quickAddAmount: DEFAULT_QUICK_ADD_AMOUNT,
    lastUpdated: getTodayDateLocal(),
    history: [],
    drinkLog: [],
  };
}

export function normalizeHydrationState(parsed: Partial<HydrationState>, today = getTodayDateLocal()): HydrationState {
  const goal = clampHydrationAmount(parsed.goal ?? DEFAULT_GOAL, 500, 10000);

  return {
    intake: clampHydrationAmount(parsed.intake ?? 0, 0, 50000),
    goal,
    streak: parsed.streak ?? 0,
    reminderInterval: parsed.reminderInterval ?? 0,
    quietHours: parsed.quietHours ?? { start: "22:00", end: "07:00" },
    hideNav: parsed.hideNav ?? false,
    quickAddAmount: clampHydrationAmount(parsed.quickAddAmount ?? DEFAULT_QUICK_ADD_AMOUNT, 50, 5000),
    lastUpdated: parsed.lastUpdated ?? today,
    history: normalizeHistory(parsed.history, goal),
    drinkLog: normalizeDrinkLog(parsed.drinkLog),
  };
}

export function rolloverHydrationState(state: HydrationState, today = getTodayDateLocal()): HydrationState {
  if (state.lastUpdated === today) {
    return state;
  }

  const [year, month, day] = today.split("-").map(Number);
  const yesterday = new Date(year, month - 1, day);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateLocal(yesterday);

  let newStreak = state.streak;
  if (state.lastUpdated === yesterdayStr && state.intake >= state.goal) {
    newStreak += 1;
  } else if (state.lastUpdated !== yesterdayStr) {
    newStreak = 0;
  }

  const updatedHistory = [...state.history];
  if (state.lastUpdated && !updatedHistory.find((item) => item.date === state.lastUpdated)) {
    updatedHistory.push({
      date: state.lastUpdated,
      intake: state.intake,
      goal: state.goal,
    });
  }

  const parts = state.lastUpdated.split("-").map(Number);
  if (parts.length === 3) {
    const gapDate = new Date(parts[0], parts[1] - 1, parts[2]);
    gapDate.setDate(gapDate.getDate() + 1);

    let safeGuard = 0;
    while (formatDateLocal(gapDate) !== today && safeGuard < 365) {
      const gapStr = formatDateLocal(gapDate);
      if (!updatedHistory.find((item) => item.date === gapStr)) {
        updatedHistory.push({ date: gapStr, intake: 0, goal: state.goal });
      }
      gapDate.setDate(gapDate.getDate() + 1);
      safeGuard++;
    }
  }

  return {
    ...state,
    intake: 0,
    streak: newStreak,
    lastUpdated: today,
    history: updatedHistory,
    drinkLog: [],
  };
}

export function clampHydrationAmount(amount: number, min = 0, max = 50000) {
  if (!Number.isFinite(amount)) return min;
  return Math.min(max, Math.max(min, Math.round(amount)));
}
