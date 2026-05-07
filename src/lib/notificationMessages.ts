export const QUICK_NOTIFICATION_LOG_AMOUNT = 250;

export type HydrationNotificationKind =
  | "catch-up"
  | "first-log"
  | "long-gap"
  | "behind-pace"
  | "morning-start"
  | "midday-reset"
  | "evening-catchup"
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
}

export interface HydrationNotificationMessage {
  kind: HydrationNotificationKind;
  title: string;
  body: string;
  actionAmount: number;
}

export interface HydrationNotificationType {
  kind: HydrationNotificationKind;
  label: string;
  title: string;
  priority: (context: HydrationNotificationContext) => number;
  body: (context: HydrationNotificationContext) => string;
}

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 22;

function safeGoal(goal: number) {
  return Number.isFinite(goal) && goal > 0 ? goal : 2500;
}

function getProgress(context: HydrationNotificationContext) {
  return Math.min(1, Math.max(0, context.intake / safeGoal(context.goal)));
}

function getRemaining(context: HydrationNotificationContext) {
  return Math.max(0, safeGoal(context.goal) - Math.max(0, context.intake));
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

export const HYDRATION_NOTIFICATION_TYPES: HydrationNotificationType[] = [
  {
    kind: "catch-up",
    label: "Welcome back",
    title: "Fluid check-in 💧",
    priority: (context) => (context.isCatchUp ? 100 : 0),
    body: () => "Welcome back. If you drank while away, open Fluid and log it now to keep your rhythm accurate.",
  },
  {
    kind: "first-log",
    label: "First water",
    title: "First glass 💧",
    priority: (context) => (context.intake <= 0 ? 92 : 0),
    body: () => `No water logged today. Add ${formatMl(QUICK_NOTIFICATION_LOG_AMOUNT)} and start the day gently.`,
  },
  {
    kind: "long-gap",
    label: "Long gap",
    title: "Hydration break",
    priority: (context) => {
      const minutes = minutesSinceLastDrink(context);
      if (minutes === null) return 0;

      return minutes >= Math.max(context.reminderInterval, 45) ? 88 : 0;
    },
    body: (context) => {
      const minutes = minutesSinceLastDrink(context) ?? context.reminderInterval;

      return `It has been ${formatMinutes(minutes)} since your last log. A few sips now can help. Open Fluid when you drink.`;
    },
  },
  {
    kind: "behind-pace",
    label: "Behind pace",
    title: "Gentle catch-up",
    priority: (context) => {
      const progress = getProgress(context);
      const expected = getExpectedProgress(context);

      return expected - progress >= 0.18 ? 82 : 0;
    },
    body: (context) =>
      `You are at ${formatPercent(getProgress(context))} of your goal. A small glass can bring you closer to today's rhythm.`,
  },
  {
    kind: "morning-start",
    label: "Morning start",
    title: "Easy start ☀️",
    priority: (context) => (getHour(context) < 11 && context.intake < 400 ? 76 : 0),
    body: () => "Mornings feel better with a little water on board. Open Fluid and log a small glass.",
  },
  {
    kind: "midday-reset",
    label: "Midday reset",
    title: "Midday reset",
    priority: (context) => {
      const hour = getHour(context);

      return hour >= 11 && hour < 15 && getProgress(context) < 0.55 ? 72 : 0;
    },
    body: () => "Lunch is a good time for water. Take a short pause, drink a little, then log it in Fluid.",
  },
  {
    kind: "evening-catchup",
    label: "Evening catch-up",
    title: "Easy evening",
    priority: (context) => (getHour(context) >= 17 && getRemaining(context) > 0 ? 70 : 0),
    body: (context) =>
      `You have ${formatMl(getRemaining(context))} left. A little now is better than a lot late. Log it when you sip.`,
  },
  {
    kind: "close-goal",
    label: "Close goal",
    title: "Almost there 🎯",
    priority: (context) => {
      const remaining = getRemaining(context);

      return remaining > 0 && remaining <= 500 ? 86 : 0;
    },
    body: (context) => `Only ${formatMl(getRemaining(context))} left. One glass could get you to your goal.`,
  },
  {
    kind: "streak-care",
    label: "Streak care",
    title: "Keep the rhythm",
    priority: (context) => (context.intake > 0 && getProgress(context) < 1 ? 58 : 0),
    body: () => "It does not have to be perfect. One small log keeps the habit moving.",
  },
  {
    kind: "small-sip",
    label: "Small sips",
    title: "Small sips 💧",
    priority: () => 40,
    body: () => "A few sips are enough for the next step. Open Fluid and log your water.",
  },
];

export function pickHydrationNotification(
  context: HydrationNotificationContext,
  previousKind: string | null = null
): HydrationNotificationMessage {
  const rankedTypes = HYDRATION_NOTIFICATION_TYPES
    .map((type) => ({ type, priority: type.priority(context) }))
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
    body: selected.type.body(context),
    actionAmount: QUICK_NOTIFICATION_LOG_AMOUNT,
  };
}
