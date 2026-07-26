export const QUICK_NOTIFICATION_LOG_AMOUNT = 250;
export const WORKOUT_NOTIFICATION_LOG_AMOUNT = 150;
export const FOLLOW_UP_DELAY_MINUTES = 15;
export const WORKOUT_REMINDER_INTERVAL_MINUTES = 12;
export const DAILY_EMPTY_CHECK_HOUR = 18;
export const WEEKLY_RETURN_DAYS = 4;
export const MONTHLY_RETURN_DAYS = 21;
export const WEEKLY_RETURN_COOLDOWN_DAYS = 7;
export const MONTHLY_RETURN_COOLDOWN_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type HydrationNotificationKind =
  | "monthly-return"
  | "weekly-return"
  | "all-day-empty"
  | "first-log-follow-up"
  | "long-gap-follow-up"
  | "first-log"
  | "long-gap"
  | "behind-pace"
  | "morning-start"
  | "midday-reset"
  | "evening-catchup"
  | "streak-shield-used"
  | "streak-lost"
  | "streak-last-chance"
  | "streak-protection-low"
  | "workout-set-check"
  | "close-goal"
  | "streak-care"
  | "small-sip";

export interface HydrationNotificationContext {
  intake: number;
  goal: number;
  reminderInterval: number;
  lastDrinkAt: number | null;
  now: Date;
  isCatchUp: boolean;
  inactiveDays?: number;
  previousKind?: string | null;
  streak?: number;
  streakShieldCharges?: number;
  workoutSessionEndsAt?: number | null;
  lastWorkoutDrinkAt?: number | null;
}

export interface HydrationNotificationMessage {
  kind: HydrationNotificationKind;
  title: string;
  body: string;
  actionAmount: number;
  actionNote?: "water" | "coffee" | "tea" | "workout" | "hot-day";
  cadence?: "interval" | "daily" | "weekly" | "monthly";
  nextDelayMinutes?: number;
}

export interface HydrationLifecycleNotificationState {
  lastDailyAt: number;
  lastWeeklyAt: number;
  lastMonthlyAt: number;
}

export interface HydrationNotificationType {
  kind: HydrationNotificationKind;
  label: string;
  title: string;
  priority: (context: HydrationNotificationContext) => number;
  body: (context: HydrationNotificationContext) => string;
  nextDelayMinutes?: (context: HydrationNotificationContext) => number | undefined;
}

export interface HydrationStreakAlertNotification {
  id: string;
  kind: "shield-used" | "streak-lost";
  date: string;
  streak: number;
  shieldCharges: number;
}

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 22;
const EVENING_CHECK_HOUR = DAILY_EMPTY_CHECK_HOUR;
const LATE_EVENING_HOUR = 20;
const INTERVAL_EXCLUDED_KINDS = new Set<HydrationNotificationKind>(["monthly-return", "weekly-return", "workout-set-check"]);

function safeGoal(goal: number) {
  return Number.isFinite(goal) && goal > 0 ? goal : 2500;
}

function getProgress(context: HydrationNotificationContext) {
  return Math.min(1, Math.max(0, context.intake / safeGoal(context.goal)));
}

function getRemaining(context: HydrationNotificationContext) {
  return Math.max(0, safeGoal(context.goal) - Math.max(0, context.intake));
}

function isLateAndFarBehind(context: HydrationNotificationContext) {
  return getHour(context) >= LATE_EVENING_HOUR && getProgress(context) < 0.65 && getRemaining(context) > 500;
}

function getStreak(context: HydrationNotificationContext) {
  return Math.max(0, Math.round(context.streak ?? 0));
}

function getShieldCharges(context: HydrationNotificationContext) {
  return Math.max(0, Math.min(2, Math.round(context.streakShieldCharges ?? 2)));
}

function formatMl(amount: number) {
  return `${Math.round(amount)} ml`;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function minutesSinceLastDrink(context: HydrationNotificationContext) {
  if (!context.lastDrinkAt) return null;

  return Math.max(0, Math.floor((context.now.getTime() - context.lastDrinkAt) / 60000));
}

function minutesSinceLastWorkoutDrink(context: HydrationNotificationContext) {
  if (!context.lastWorkoutDrinkAt) return null;

  return Math.max(0, Math.floor((context.now.getTime() - context.lastWorkoutDrinkAt) / 60000));
}

function isWorkoutSessionActive(context: HydrationNotificationContext) {
  return Boolean(context.workoutSessionEndsAt && context.workoutSessionEndsAt > context.now.getTime());
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function getExpectedProgress(context: HydrationNotificationContext) {
  const hour = context.now.getHours() + context.now.getMinutes() / 60;
  const dayProgress = (hour - DAY_START_HOUR) / (DAY_END_HOUR - DAY_START_HOUR);

  return Math.min(1, Math.max(0, dayProgress));
}

function getHour(context: HydrationNotificationContext) {
  return context.now.getHours();
}

function wasFirstLogReminder(kind?: string | null) {
  return kind === "first-log" || kind === "morning-start" || kind === "first-log-follow-up";
}

function wasDrinkGapReminder(kind?: string | null) {
  return kind === "long-gap" || kind === "small-sip" || kind === "long-gap-follow-up";
}

function followUpDelay(context: HydrationNotificationContext) {
  if (isLateAndFarBehind(context)) return undefined;

  return context.intake < safeGoal(context.goal) ? FOLLOW_UP_DELAY_MINUTES : undefined;
}

function getNotificationType(kind: HydrationNotificationKind) {
  return HYDRATION_NOTIFICATION_TYPES.find((type) => type.kind === kind);
}

function isSameLocalDay(timestamp: number, now: Date) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return false;

  const previous = new Date(timestamp);

  return (
    previous.getFullYear() === now.getFullYear() &&
    previous.getMonth() === now.getMonth() &&
    previous.getDate() === now.getDate()
  );
}

function hasCooldownElapsed(lastSentAt: number, now: Date, days: number) {
  return !Number.isFinite(lastSentAt) || lastSentAt <= 0 || now.getTime() - lastSentAt >= days * DAY_MS;
}

function createNotificationMessage(
  kind: HydrationNotificationKind,
  context: HydrationNotificationContext,
  cadence: HydrationNotificationMessage["cadence"]
): HydrationNotificationMessage | null {
  const type = getNotificationType(kind);
  if (!type) return null;

  return {
    kind,
    title: type.title,
    body: type.body(context),
    actionAmount: QUICK_NOTIFICATION_LOG_AMOUNT,
    cadence,
    nextDelayMinutes: type.nextDelayMinutes?.(context),
  };
}

function getDailyCheckTimestamp(now: Date, dayOffset = 0) {
  const checkAt = new Date(now);
  checkAt.setDate(checkAt.getDate() + dayOffset);
  checkAt.setHours(DAILY_EMPTY_CHECK_HOUR, 0, 0, 0);

  return checkAt.getTime();
}

export function pickHydrationLifecycleNotification(
  context: HydrationNotificationContext,
  state: HydrationLifecycleNotificationState
): HydrationNotificationMessage | null {
  const inactiveDays = context.inactiveDays ?? 0;

  if (
    inactiveDays >= MONTHLY_RETURN_DAYS &&
    hasCooldownElapsed(state.lastMonthlyAt, context.now, MONTHLY_RETURN_COOLDOWN_DAYS)
  ) {
    return createNotificationMessage("monthly-return", context, "monthly");
  }

  if (
    inactiveDays >= WEEKLY_RETURN_DAYS &&
    inactiveDays < MONTHLY_RETURN_DAYS &&
    hasCooldownElapsed(state.lastWeeklyAt, context.now, WEEKLY_RETURN_COOLDOWN_DAYS)
  ) {
    return createNotificationMessage("weekly-return", context, "weekly");
  }

  if (
    context.intake <= 0 &&
    getHour(context) >= DAILY_EMPTY_CHECK_HOUR &&
    !isSameLocalDay(state.lastDailyAt, context.now)
  ) {
    return createNotificationMessage("all-day-empty", context, "daily");
  }

  return null;
}

export function pickHydrationStreakAlertNotification(
  alert: HydrationStreakAlertNotification | null | undefined
): HydrationNotificationMessage | null {
  if (!alert) return null;

  if (alert.kind === "shield-used") {
    const hasProtectionLeft = alert.shieldCharges > 0;

    return {
      kind: "streak-shield-used",
      title: "Streak battery used 🔋",
      body: hasProtectionLeft
        ? "A protection covered yesterday. One comfortable sip today can recharge one battery."
        : "A protection covered yesterday, and none are left. One sip today is enough to keep the streak and recharge one battery.",
      actionAmount: QUICK_NOTIFICATION_LOG_AMOUNT,
      cadence: "daily",
      nextDelayMinutes: FOLLOW_UP_DELAY_MINUTES,
    };
  }

  return {
    kind: "streak-lost",
    title: "Streak reset 💧",
    body: "Your protections ran out. Start fresh with a small drink when it feels right.",
    actionAmount: QUICK_NOTIFICATION_LOG_AMOUNT,
    cadence: "daily",
    nextDelayMinutes: FOLLOW_UP_DELAY_MINUTES,
  };
}

export function pickWorkoutHydrationNotification(context: HydrationNotificationContext): HydrationNotificationMessage | null {
  if (!isWorkoutSessionActive(context)) return null;

  const minutes = minutesSinceLastWorkoutDrink(context);

  if (minutes !== null && minutes < WORKOUT_REMINDER_INTERVAL_MINUTES) {
    return null;
  }

  return {
    kind: "workout-set-check",
    title: "Workout sip check 💧",
    body:
      minutes === null
        ? "Workout mode is on. A few easy sips before the next set are enough."
        : `${formatMinutes(minutes)} since your last workout drink. A few sips before the next set are enough.`,
    actionAmount: WORKOUT_NOTIFICATION_LOG_AMOUNT,
    actionNote: "workout",
    cadence: "interval",
    nextDelayMinutes: WORKOUT_REMINDER_INTERVAL_MINUTES,
  };
}

export function getNextHydrationLifecycleDueAt(
  context: HydrationNotificationContext,
  state: HydrationLifecycleNotificationState
) {
  const now = context.now;
  const nowTime = now.getTime();
  const candidates: number[] = [];
  const inactiveDays = context.inactiveDays ?? 0;
  const todayDailyCheck = getDailyCheckTimestamp(now);

  if (pickHydrationLifecycleNotification(context, state)) {
    return nowTime;
  }

  if (!isSameLocalDay(state.lastDailyAt, now)) {
    candidates.push(todayDailyCheck > nowTime ? todayDailyCheck : getDailyCheckTimestamp(now, 1));
  } else {
    candidates.push(getDailyCheckTimestamp(now, 1));
  }

  if (inactiveDays >= MONTHLY_RETURN_DAYS && state.lastMonthlyAt > 0) {
    candidates.push(state.lastMonthlyAt + MONTHLY_RETURN_COOLDOWN_DAYS * DAY_MS);
  }

  if (inactiveDays >= WEEKLY_RETURN_DAYS && inactiveDays < MONTHLY_RETURN_DAYS && state.lastWeeklyAt > 0) {
    candidates.push(state.lastWeeklyAt + WEEKLY_RETURN_COOLDOWN_DAYS * DAY_MS);
  }

  return Math.max(nowTime + 60 * 1000, Math.min(...candidates));
}

export const HYDRATION_NOTIFICATION_TYPES: HydrationNotificationType[] = [
  {
    kind: "monthly-return",
    label: "Monthly return",
    title: "Fluid missed you 💧",
    priority: (context) => ((context.inactiveDays ?? 0) >= MONTHLY_RETURN_DAYS ? 110 : 0),
    body: () => "No pressure. Open Fluid, add one glass, and restart gently today.",
  },
  {
    kind: "weekly-return",
    label: "Weekly return",
    title: "A fresh start is ready 🥤",
    priority: (context) => {
      const inactiveDays = context.inactiveDays ?? 0;

      return inactiveDays >= WEEKLY_RETURN_DAYS && inactiveDays < MONTHLY_RETURN_DAYS ? 106 : 0;
    },
    body: (context) =>
      `It has been ${context.inactiveDays ?? WEEKLY_RETURN_DAYS} quiet days. One ${formatMl(
        QUICK_NOTIFICATION_LOG_AMOUNT
      )} log is enough to restart the habit.`,
  },
  {
    kind: "all-day-empty",
    label: "No water today",
    title: "Still time for water 🌙",
    priority: (context) => (getHour(context) >= EVENING_CHECK_HOUR && context.intake <= 0 ? 104 : 0),
    body: () => "Nothing is logged today yet. A small glass now still counts.",
    nextDelayMinutes: followUpDelay,
  },
  {
    kind: "first-log-follow-up",
    label: "First water follow-up",
    title: "Still no water logged? 🥤",
    priority: (context) => (context.intake <= 0 && wasFirstLogReminder(context.previousKind) ? 98 : 0),
    body: () => `If you skipped the last nudge, try one calm ${formatMl(QUICK_NOTIFICATION_LOG_AMOUNT)} glass now.`,
    nextDelayMinutes: followUpDelay,
  },
  {
    kind: "long-gap-follow-up",
    label: "Long gap follow-up",
    title: "Tiny sip check 💦",
    priority: (context) => {
      const minutes = minutesSinceLastDrink(context);

      return context.intake > 0 && wasDrinkGapReminder(context.previousKind) && minutes !== null && minutes >= FOLLOW_UP_DELAY_MINUTES
        ? 96
        : 0;
    },
    body: () => "If you did not drink after the last reminder, a few sips now are perfect.",
    nextDelayMinutes: followUpDelay,
  },
  {
    kind: "first-log",
    label: "First water",
    title: "First glass 💧",
    priority: (context) => (context.intake <= 0 ? 92 : 0),
    body: () => `No water logged today. Add ${formatMl(QUICK_NOTIFICATION_LOG_AMOUNT)} and start gently.`,
    nextDelayMinutes: followUpDelay,
  },
  {
    kind: "long-gap",
    label: "Long gap",
    title: "Hydration break 💧",
    priority: (context) => {
      const minutes = minutesSinceLastDrink(context);
      if (minutes === null) return 0;

      return minutes >= Math.max(context.reminderInterval, 45) ? 88 : 0;
    },
    body: (context) => {
      const minutes = minutesSinceLastDrink(context) ?? context.reminderInterval;

      return isLateAndFarBehind(context)
        ? `It has been ${formatMinutes(minutes)} since your last log. A few comfortable sips are enough tonight.`
        : `It has been ${formatMinutes(minutes)} since your last log. A few sips now can help.`;
    },
    nextDelayMinutes: followUpDelay,
  },
  {
    kind: "workout-set-check",
    label: "Workout set check",
    title: "Workout sip check 💧",
    priority: (context) => (isWorkoutSessionActive(context) ? 112 : 0),
    body: () => "A few easy sips before the next set are enough.",
    nextDelayMinutes: () => WORKOUT_REMINDER_INTERVAL_MINUTES,
  },
  {
    kind: "close-goal",
    label: "Close goal",
    title: "Close enough for a calm finish 🎯",
    priority: (context) => {
      const remaining = getRemaining(context);

      return remaining > 0 && remaining <= 500 ? 94 : 0;
    },
    body: (context) => {
      const remaining = formatMl(getRemaining(context));

      return getHour(context) >= 17
        ? `${remaining} would complete today, but a small comfortable drink is enough if it is late.`
        : `${remaining} left for today. One small drink can keep the rhythm going.`;
    },
  },
  {
    kind: "streak-last-chance",
    label: "Streak last chance",
    title: "Protect the rhythm ⚡",
    priority: (context) =>
      getStreak(context) > 0 && getShieldCharges(context) <= 0 && getHour(context) >= 17 && context.intake <= 0
        ? 108
        : 0,
    body: () => "No protections are left. If you drink today, one comfortable sip is enough to keep the streak.",
    nextDelayMinutes: followUpDelay,
  },
  {
    kind: "streak-protection-low",
    label: "One protection left",
    title: "One protection left 🔋",
    priority: (context) =>
      getStreak(context) > 0 && getShieldCharges(context) === 1 && getHour(context) >= 17 && context.intake <= 0
        ? 105
        : 0,
    body: () => "One streak protection is left. One comfortable sip today is enough; there is no target to chase.",
    nextDelayMinutes: followUpDelay,
  },
  {
    kind: "behind-pace",
    label: "Behind pace",
    title: "Gentle catch-up 🌊",
    priority: (context) => {
      const progress = getProgress(context);
      const expected = getExpectedProgress(context);

      return expected - progress >= 0.18 ? 82 : 0;
    },
    body: (context) =>
      isLateAndFarBehind(context)
        ? `You are at ${formatPercent(getProgress(context))} today. Since it is late, choose a small comfortable drink instead of catching up all at once.`
        : `You are at ${formatPercent(getProgress(context))} today. A small drink can bring you closer to your rhythm.`,
    nextDelayMinutes: followUpDelay,
  },
  {
    kind: "morning-start",
    label: "Morning start",
    title: "Easy start ☀️",
    priority: (context) => (getHour(context) < 11 && context.intake < 400 ? 76 : 0),
    body: () => "Mornings feel better with a little water on board. Log a small glass when you drink.",
    nextDelayMinutes: followUpDelay,
  },
  {
    kind: "midday-reset",
    label: "Midday reset",
    title: "Midday reset 🥤",
    priority: (context) => {
      const hour = getHour(context);

      return hour >= 11 && hour < 15 && getProgress(context) < 0.55 ? 72 : 0;
    },
    body: () => "Lunch is a good time for water. Take a short pause, drink a little, then log it.",
    nextDelayMinutes: followUpDelay,
  },
  {
    kind: "evening-catchup",
    label: "Evening catch-up",
    title: "Easy evening 🌙",
    priority: (context) => (getHour(context) >= 17 && getRemaining(context) > 0 ? 70 : 0),
    body: (context) =>
      isLateAndFarBehind(context)
        ? "It is late and there is a lot left. A small drink is enough; do not rush the full target."
        : `You have ${formatMl(getRemaining(context))} left. A little now is better than a lot late.`,
    nextDelayMinutes: followUpDelay,
  },
  {
    kind: "streak-care",
    label: "Streak care",
    title: "Keep the rhythm 💧",
    priority: (context) => (context.intake > 0 && getProgress(context) < 1 ? 58 : 0),
    body: () => "Today already counts toward your streak. Anything else you drink is for your comfort, not the counter.",
    nextDelayMinutes: followUpDelay,
  },
  {
    kind: "small-sip",
    label: "Small sips",
    title: "Small sips 💧",
    priority: () => 40,
    body: () => "A few sips are enough for the next step. Open Fluid and log your water.",
    nextDelayMinutes: followUpDelay,
  },
];

export function pickHydrationNotification(
  context: HydrationNotificationContext,
  previousKind: string | null = null
): HydrationNotificationMessage {
  const hydratedContext = { ...context, previousKind };
  const rankedTypes = HYDRATION_NOTIFICATION_TYPES
    .filter((type) => !INTERVAL_EXCLUDED_KINDS.has(type.kind))
    .map((type) => ({ type, priority: type.priority(hydratedContext) }))
    .filter((entry) => entry.priority > 0)
    .sort((a, b) => b.priority - a.priority);

  const candidates = rankedTypes.length > 0 ? rankedTypes.slice(0, Math.min(3, rankedTypes.length)) : [];
  const selected = candidates.find((entry) => entry.type.kind !== previousKind) ?? candidates[0] ?? {
    type: HYDRATION_NOTIFICATION_TYPES[HYDRATION_NOTIFICATION_TYPES.length - 1],
    priority: 0,
  };

  return {
    kind: selected.type.kind,
    title: selected.type.title,
    body: selected.type.body(hydratedContext),
    actionAmount: QUICK_NOTIFICATION_LOG_AMOUNT,
    cadence: "interval",
    nextDelayMinutes: selected.type.nextDelayMinutes?.(hydratedContext),
  };
}
