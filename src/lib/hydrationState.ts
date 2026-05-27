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

export type HydrationStreakAlertKind = "shield-used" | "streak-lost";

export interface HydrationStreakAlert {
  id: string;
  kind: HydrationStreakAlertKind;
  date: string;
  streak: number;
  shieldCharges: number;
}

export interface HydrationState {
  intake: number;
  goal: number;
  streak: number;
  streakShieldCharges: number;
  streakAlert: HydrationStreakAlert | null;
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
export const MAX_STREAK_SHIELD_CHARGES = 2;
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

function normalizeStreakAlert(alert: unknown): HydrationStreakAlert | null {
  if (!alert || typeof alert !== "object") return null;

  const candidate = alert as Partial<HydrationStreakAlert>;
  if (candidate.kind !== "shield-used" && candidate.kind !== "streak-lost") return null;
  if (typeof candidate.id !== "string" || typeof candidate.date !== "string") return null;

  return {
    id: candidate.id,
    kind: candidate.kind,
    date: candidate.date,
    streak: clampHydrationAmount(candidate.streak ?? 0, 0, 50000),
    shieldCharges: clampHydrationAmount(candidate.shieldCharges ?? 0, 0, MAX_STREAK_SHIELD_CHARGES),
  };
}

export function getDefaultHydrationState(): HydrationState {
  return {
    intake: 0,
    goal: DEFAULT_GOAL,
    streak: 0,
    streakShieldCharges: MAX_STREAK_SHIELD_CHARGES,
    streakAlert: null,
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
    streakShieldCharges: clampHydrationAmount(parsed.streakShieldCharges ?? MAX_STREAK_SHIELD_CHARGES, 0, MAX_STREAK_SHIELD_CHARGES),
    streakAlert: normalizeStreakAlert(parsed.streakAlert),
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

  let newStreak = state.streak;
  let newShieldCharges = state.streakShieldCharges;
  let streakAlert = state.streakAlert;

  const updatedHistory = [...state.history];

  const parts = state.lastUpdated.split("-").map(Number);
  if (parts.length === 3) {
    const cursor = new Date(parts[0], parts[1] - 1, parts[2]);
    let safeGuard = 0;
    while (formatDateLocal(cursor) !== today && safeGuard < 365) {
      const dateStr = formatDateLocal(cursor);
      const isLastUpdatedDay = dateStr === state.lastUpdated;
      const dayIntake = isLastUpdatedDay ? state.intake : 0;
      const dayGoal = state.goal;

      if (!updatedHistory.find((item) => item.date === dateStr)) {
        updatedHistory.push({ date: dateStr, intake: dayIntake, goal: dayGoal });
      }

      if (dayIntake >= dayGoal) {
        newStreak += 1;
        newShieldCharges = MAX_STREAK_SHIELD_CHARGES;
      } else if (newStreak > 0 && newShieldCharges > 0) {
        newShieldCharges -= 1;
        streakAlert = {
          id: `${dateStr}-shield-${newShieldCharges}`,
          kind: "shield-used",
          date: dateStr,
          streak: newStreak,
          shieldCharges: newShieldCharges,
        };
      } else if (newStreak > 0) {
        newStreak = 0;
        newShieldCharges = MAX_STREAK_SHIELD_CHARGES;
        streakAlert = {
          id: `${dateStr}-lost`,
          kind: "streak-lost",
          date: dateStr,
          streak: 0,
          shieldCharges: newShieldCharges,
        };
      }

      cursor.setDate(cursor.getDate() + 1);
      safeGuard++;
    }
  }

  return {
    ...state,
    intake: 0,
    streak: newStreak,
    streakShieldCharges: newShieldCharges,
    streakAlert,
    lastUpdated: today,
    history: updatedHistory,
    drinkLog: [],
  };
}

export function clampHydrationAmount(amount: number, min = 0, max = 50000) {
  if (!Number.isFinite(amount)) return min;
  return Math.min(max, Math.max(min, Math.round(amount)));
}
