import { formatDateLocal, getTodayDateLocal } from "./date.ts";

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

export const DEFAULT_GOAL = 2500;

export function getDefaultHydrationState(): HydrationState {
  return {
    intake: 0,
    goal: DEFAULT_GOAL,
    streak: 0,
    reminderInterval: 0,
    quietHours: { start: "22:00", end: "07:00" },
    hideNav: false,
    lastUpdated: getTodayDateLocal(),
    history: [],
  };
}

export function normalizeHydrationState(parsed: Partial<HydrationState>, today = getTodayDateLocal()): HydrationState {
  return {
    intake: parsed.intake ?? 0,
    goal: parsed.goal ?? DEFAULT_GOAL,
    streak: parsed.streak ?? 0,
    reminderInterval: parsed.reminderInterval ?? 0,
    quietHours: parsed.quietHours ?? { start: "22:00", end: "07:00" },
    hideNav: parsed.hideNav ?? false,
    lastUpdated: parsed.lastUpdated ?? today,
    history: parsed.history ?? [],
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
  };
}
