import { formatDateLocal, getTodayDateLocal } from "./date.ts";

export interface HydrationHistoryItem {
  date: string;
  intake: number;
  goal: number;
  breakdown?: Partial<Record<HydrationDrinkType, number>>;
  contextBreakdown?: Partial<Record<HydrationContext, number>>;
}

export interface DrinkLogItem {
  id: string;
  amount: number;
  timestamp: number;
  drinkType: HydrationDrinkType;
  context?: HydrationContext;
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
  workoutSessionStartedAt: number | null;
  workoutSessionEndsAt: number | null;
  workoutSessionDurationMinutes: number;
  workoutSessionPausedRemainingMs: number | null;
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
export const DEFAULT_WORKOUT_SESSION_MINUTES = 90;
export const MAX_STREAK_SHIELD_CHARGES = 2;
export const HYDRATION_DRINK_TYPES = ["water", "coffee", "tea"] as const;
export type HydrationDrinkType = (typeof HYDRATION_DRINK_TYPES)[number];
export const HYDRATION_CONTEXTS = ["workout", "hot-day"] as const;
export type HydrationContext = (typeof HYDRATION_CONTEXTS)[number];
export const HYDRATION_NOTES = ["water", "coffee", "tea", "workout", "hot-day"] as const;
export type HydrationNote = (typeof HYDRATION_NOTES)[number];

function isHydrationDrinkType(value: unknown): value is HydrationDrinkType {
  return typeof value === "string" && HYDRATION_DRINK_TYPES.includes(value as HydrationDrinkType);
}

function isHydrationContext(value: unknown): value is HydrationContext {
  return typeof value === "string" && HYDRATION_CONTEXTS.includes(value as HydrationContext);
}

function getLegacyDrinkType(note: unknown): HydrationDrinkType {
  return note === "coffee" || note === "tea" ? note : "water";
}

function getLegacyContext(note: unknown): HydrationContext | undefined {
  return note === "workout" || note === "hot-day" ? note : undefined;
}

function normalizeDrinkLogItem(item: unknown): DrinkLogItem | null {
  if (!item || typeof item !== "object") return null;

  const candidate = item as Partial<DrinkLogItem> & { note?: unknown };
  const rawAmount = Number(candidate.amount);
  const amount = Number.isFinite(rawAmount) ? clampHydrationAmount(rawAmount, -5000, 5000) : 0;
  const timestamp = Number(candidate.timestamp);

  if (!candidate.id || amount === 0 || !Number.isFinite(timestamp)) return null;

  return {
    id: String(candidate.id),
    amount,
    timestamp,
    drinkType: isHydrationDrinkType(candidate.drinkType)
      ? candidate.drinkType
      : getLegacyDrinkType(candidate.note),
    ...(isHydrationContext(candidate.context)
      ? { context: candidate.context }
      : getLegacyContext(candidate.note)
        ? { context: getLegacyContext(candidate.note) }
        : {}),
  };
}

function normalizeDrinkLog(log: unknown) {
  if (!Array.isArray(log)) return [];

  return log
    .map(normalizeDrinkLogItem)
    .filter((item): item is DrinkLogItem => item !== null)
    .slice(0, 50);
}

function normalizeHydrationBreakdown(breakdown: unknown): Partial<Record<HydrationDrinkType, number>> | undefined {
  if (!breakdown || typeof breakdown !== "object") return undefined;

  const legacyBreakdown = breakdown as Partial<Record<HydrationNote, number>>;
  const normalized = HYDRATION_DRINK_TYPES.reduce<Partial<Record<HydrationDrinkType, number>>>((items, drinkType) => {
    const legacyContextWater =
      drinkType === "water"
        ? (legacyBreakdown.workout ?? 0) + (legacyBreakdown["hot-day"] ?? 0)
        : 0;
    const amount = clampHydrationAmount(
      (legacyBreakdown[drinkType] ?? 0) + legacyContextWater,
      0,
      50000
    );
    if (amount > 0) {
      items[drinkType] = amount;
    }

    return items;
  }, {});

  return Object.values(normalized).some((amount) => (amount ?? 0) > 0) ? normalized : undefined;
}

function normalizeContextBreakdown(
  contextBreakdown: unknown,
  legacyBreakdown?: unknown
): Partial<Record<HydrationContext, number>> | undefined {
  const source =
    contextBreakdown && typeof contextBreakdown === "object"
      ? (contextBreakdown as Partial<Record<HydrationContext, number>>)
      : {};
  const legacy =
    legacyBreakdown && typeof legacyBreakdown === "object"
      ? (legacyBreakdown as Partial<Record<HydrationNote, number>>)
      : {};
  const normalized = HYDRATION_CONTEXTS.reduce<Partial<Record<HydrationContext, number>>>(
    (items, context) => {
      const amount = clampHydrationAmount(source[context] ?? legacy[context] ?? 0, 0, 50000);
      if (amount > 0) items[context] = amount;
      return items;
    },
    {}
  );

  return Object.values(normalized).some((amount) => (amount ?? 0) > 0)
    ? normalized
    : undefined;
}

function buildDrinkBreakdown(log: DrinkLogItem[], expectedIntake: number): Partial<Record<HydrationDrinkType, number>> | undefined {
  const totals = log.reduce<Partial<Record<HydrationDrinkType, number>>>((breakdown, item) => {
    breakdown[item.drinkType] = clampHydrationAmount((breakdown[item.drinkType] ?? 0) + item.amount, 0, 50000);
    return breakdown;
  }, {});
  const total = Object.values(totals).reduce((sum, amount) => sum + (amount ?? 0), 0);

  if (expectedIntake > 0 && total !== expectedIntake) {
    return { water: expectedIntake };
  }

  return Object.values(totals).some((amount) => (amount ?? 0) > 0) ? totals : undefined;
}

function buildContextBreakdown(log: DrinkLogItem[]): Partial<Record<HydrationContext, number>> | undefined {
  const totals = log.reduce<Partial<Record<HydrationContext, number>>>((breakdown, item) => {
    if (!item.context) return breakdown;

    breakdown[item.context] = clampHydrationAmount(
      (breakdown[item.context] ?? 0) + item.amount,
      0,
      50000
    );
    return breakdown;
  }, {});

  return Object.values(totals).some((amount) => (amount ?? 0) > 0) ? totals : undefined;
}

function normalizeHistory(history: unknown, fallbackGoal: number): HydrationHistoryItem[] {
  if (!Array.isArray(history)) return [];

  return history
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const candidate = item as Partial<HydrationHistoryItem>;
      if (typeof candidate.date !== "string") return null;

      const intake = clampHydrationAmount(candidate.intake ?? 0, 0, 50000);
      const dayGoal = clampHydrationAmount(candidate.goal ?? fallbackGoal, 500, 10000);
      const breakdown = normalizeHydrationBreakdown(candidate.breakdown) ?? (intake > 0 ? { water: intake } : undefined);
      const contextBreakdown = normalizeContextBreakdown(
        candidate.contextBreakdown,
        candidate.breakdown
      );

      return {
        date: candidate.date,
        intake,
        goal: dayGoal,
        ...(breakdown ? { breakdown } : {}),
        ...(contextBreakdown ? { contextBreakdown } : {}),
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

function normalizeOptionalTimestamp(value: unknown): number | null {
  const timestamp = Number(value);

  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

function normalizeOptionalDuration(value: unknown, max: number): number | null {
  const duration = Number(value);

  return Number.isFinite(duration) && duration > 0
    ? clampHydrationAmount(duration, 1, max)
    : null;
}

export function getDefaultHydrationState(): HydrationState {
  return {
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
    lastUpdated: getTodayDateLocal(),
    history: [],
    drinkLog: [],
  };
}

export function normalizeHydrationState(parsed: Partial<HydrationState>, today = getTodayDateLocal()): HydrationState {
  const goal = clampHydrationAmount(parsed.goal ?? DEFAULT_GOAL, 500, 10000);
  const workoutSessionDurationMinutes = clampHydrationAmount(
    parsed.workoutSessionDurationMinutes ?? DEFAULT_WORKOUT_SESSION_MINUTES,
    15,
    240
  );
  const workoutSessionEndsAt = normalizeOptionalTimestamp(parsed.workoutSessionEndsAt);
  const workoutSessionStartedAt =
    normalizeOptionalTimestamp(parsed.workoutSessionStartedAt) ??
    (workoutSessionEndsAt
      ? workoutSessionEndsAt - workoutSessionDurationMinutes * 60 * 1000
      : null);
  const workoutSessionPausedRemainingMs = workoutSessionEndsAt
    ? null
    : normalizeOptionalDuration(
        parsed.workoutSessionPausedRemainingMs,
        workoutSessionDurationMinutes * 60 * 1000
      );

  return {
    intake: clampHydrationAmount(parsed.intake ?? 0, 0, 50000),
    goal,
    streak: parsed.streak ?? 0,
    streakShieldCharges: clampHydrationAmount(parsed.streakShieldCharges ?? MAX_STREAK_SHIELD_CHARGES, 0, MAX_STREAK_SHIELD_CHARGES),
    streakAlert: normalizeStreakAlert(parsed.streakAlert),
    workoutSessionStartedAt,
    workoutSessionEndsAt,
    workoutSessionDurationMinutes,
    workoutSessionPausedRemainingMs,
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
      const breakdown = isLastUpdatedDay ? buildDrinkBreakdown(state.drinkLog, dayIntake) : undefined;
      const contextBreakdown = isLastUpdatedDay ? buildContextBreakdown(state.drinkLog) : undefined;

      if (!updatedHistory.find((item) => item.date === dateStr)) {
        updatedHistory.push({
          date: dateStr,
          intake: dayIntake,
          goal: dayGoal,
          ...(breakdown ? { breakdown } : {}),
          ...(contextBreakdown ? { contextBreakdown } : {}),
        });
      }

      if (dayIntake > 0) {
        newStreak += 1;
        newShieldCharges = Math.min(MAX_STREAK_SHIELD_CHARGES, newShieldCharges + 1);
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
    workoutSessionStartedAt: null,
    workoutSessionEndsAt: null,
    workoutSessionPausedRemainingMs: null,
    lastUpdated: today,
    history: updatedHistory,
    drinkLog: [],
  };
}

export function clampHydrationAmount(amount: number, min = 0, max = 50000) {
  if (!Number.isFinite(amount)) return min;
  return Math.min(max, Math.max(min, Math.round(amount)));
}
