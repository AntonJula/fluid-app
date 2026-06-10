"use client";

import { useEffect, useRef, useState } from "react";
import {
  getNextHydrationLifecycleDueAt,
  pickWorkoutHydrationNotification,
  pickHydrationLifecycleNotification,
  pickHydrationNotification,
  pickHydrationStreakAlertNotification,
  WORKOUT_REMINDER_INTERVAL_MINUTES,
  type HydrationLifecycleNotificationState,
  type HydrationStreakAlertNotification,
} from "@/lib/notificationMessages";
import type { HydrationNote } from "@/lib/hydrationState";

const PERMISSION_EVENT = "fluid-notification-permission-changed";
const LAST_NOTIFIED_KEY = "fluid-last-notified";
const NEXT_NOTIFICATION_KEY = "fluid-next-notification-due";
const LAST_NOTIFICATION_TYPE_KEY = "fluid-last-notification-type";
const LIFECYCLE_NEXT_NOTIFICATION_KEY = "fluid-lifecycle-next-notification-due";
const LIFECYCLE_LAST_DAILY_KEY = "fluid-lifecycle-last-daily";
const LIFECYCLE_LAST_WEEKLY_KEY = "fluid-lifecycle-last-weekly";
const LIFECYCLE_LAST_MONTHLY_KEY = "fluid-lifecycle-last-monthly";
const STREAK_ALERT_NOTIFIED_KEY = "fluid-streak-alert-notified";
const WORKOUT_NEXT_NOTIFICATION_KEY = "fluid-workout-next-notification-due";
const WORKOUT_LAST_NOTIFIED_KEY = "fluid-workout-last-notified";
const SERVICE_WORKER_PATH = "/fluid-notifications-sw.js";
const MIN_NOTIFICATION_GAP_MS = 10 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

interface NotificationHydrationStatus {
  intake: number;
  goal: number;
  lastDrinkAt: number | null;
  inactiveDays?: number;
  streak?: number;
  streakShieldCharges?: number;
  streakAlert?: HydrationStreakAlertNotification | null;
  workoutSessionEndsAt?: number | null;
  lastWorkoutDrinkAt?: number | null;
}

type FluidNotificationOptions = NotificationOptions & {
  actions?: Array<{ action: string; title: string; icon?: string }>;
  renotify?: boolean;
};

function getSafeHydrationStatus(status?: NotificationHydrationStatus): NotificationHydrationStatus {
  return {
    intake: Math.max(0, Math.round(status?.intake ?? 0)),
    goal: Math.max(1, Math.round(status?.goal ?? 2500)),
    lastDrinkAt: status?.lastDrinkAt ?? null,
    inactiveDays: Math.max(0, Math.round(status?.inactiveDays ?? 0)),
    streak: Math.max(0, Math.round(status?.streak ?? 0)),
    streakShieldCharges: Math.max(0, Math.min(2, Math.round(status?.streakShieldCharges ?? 2))),
    streakAlert: status?.streakAlert ?? null,
    workoutSessionEndsAt: status?.workoutSessionEndsAt ?? null,
    lastWorkoutDrinkAt: status?.lastWorkoutDrinkAt ?? null,
  };
}

function getInitialPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "default";
  }

  return Notification.permission;
}

function getStoredTimestamp(key: string) {
  const value = Number(localStorage.getItem(key) || 0);

  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getLifecycleNotificationState(): HydrationLifecycleNotificationState {
  return {
    lastDailyAt: getStoredTimestamp(LIFECYCLE_LAST_DAILY_KEY),
    lastWeeklyAt: getStoredTimestamp(LIFECYCLE_LAST_WEEKLY_KEY),
    lastMonthlyAt: getStoredTimestamp(LIFECYCLE_LAST_MONTHLY_KEY),
  };
}

function setLifecycleNotificationSent(cadence: string | undefined, timestamp: number) {
  if (cadence === "daily" || cadence === "weekly" || cadence === "monthly") {
    localStorage.setItem(LIFECYCLE_LAST_DAILY_KEY, timestamp.toString());
  }

  if (cadence === "weekly") {
    localStorage.setItem(LIFECYCLE_LAST_WEEKLY_KEY, timestamp.toString());
  }

  if (cadence === "monthly") {
    localStorage.setItem(LIFECYCLE_LAST_MONTHLY_KEY, timestamp.toString());
  }
}

function parseClockToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function getQuietWindowEnd(now: Date, quietHours: { start: string; end: string }) {
  const startMins = parseClockToMinutes(quietHours.start);
  const endMins = parseClockToMinutes(quietHours.end);

  if (startMins === null || endMins === null) return null;

  const currentMins = now.getHours() * 60 + now.getMinutes();
  const endDate = new Date(now);
  endDate.setHours(Math.floor(endMins / 60), endMins % 60, 0, 0);

  if (startMins <= endMins) {
    return currentMins >= startMins && currentMins < endMins ? endDate.getTime() : null;
  }

  if (currentMins >= startMins) {
    endDate.setDate(endDate.getDate() + 1);
    return endDate.getTime();
  }

  return currentMins < endMins ? endDate.getTime() : null;
}

async function getServiceWorkerRegistration() {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !window.isSecureContext ||
    !("serviceWorker" in navigator)
  ) {
    return null;
  }

  try {
    await navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: "/" });
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error("Failed to register notification service worker", error);
    return null;
  }
}

async function showSystemNotification({
  title,
  body,
  tag,
  actionAmount,
  actionNote,
}: {
  title: string;
  body: string;
  tag: string;
  actionAmount?: number;
  actionNote?: HydrationNote;
}) {
  const quickAddParams = new URLSearchParams();

  if (actionAmount) {
    quickAddParams.set("quickAdd", actionAmount.toString());
  }

  if (actionAmount && actionNote) {
    quickAddParams.set("quickAddNote", actionNote);
  }

  const options: FluidNotificationOptions = {
    badge: "/fluid-notification-badge.png",
    body,
    data: { url: actionAmount ? `/?${quickAddParams.toString()}` : "/" },
    tag,
    renotify: true,
  };

  if (actionAmount) {
    const actionSuffix = actionNote ? `-${actionNote}` : "";

    options.actions = [
      { action: `add-${actionAmount}${actionSuffix}`, title: `+${actionAmount} ml` },
      { action: "open", title: "Open" },
    ];
  }

  const registration = await getServiceWorkerRegistration();

  if (registration) {
    await registration.showNotification(title, options);
    return;
  }

  const notification = new Notification(title, options);
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export function useNotifications(
  intervalMinutes: number,
  quietHours: { start: string; end: string } = { start: "22:00", end: "07:00" },
  active = true,
  hydrationStatus?: NotificationHydrationStatus
) {
  const [permission, setPermission] = useState<NotificationPermission>(getInitialPermission);
  const isSupported = typeof window === "undefined" || "Notification" in window;
  const timerRef = useRef<number | null>(null);
  const lifecycleTimerRef = useRef<number | null>(null);
  const streakAlertTimerRef = useRef<number | null>(null);
  const workoutTimerRef = useRef<number | null>(null);
  const quietHoursRef = useRef(quietHours);
  const intervalRef = useRef(intervalMinutes);
  const activeRef = useRef(active);
  const hydrationStatusRef = useRef(getSafeHydrationStatus(hydrationStatus));
  const hydrationIntake = hydrationStatus?.intake;
  const hydrationGoal = hydrationStatus?.goal;
  const hydrationLastDrinkAt = hydrationStatus?.lastDrinkAt;
  const hydrationInactiveDays = hydrationStatus?.inactiveDays;
  const hydrationStreak = hydrationStatus?.streak;
  const hydrationStreakShieldCharges = hydrationStatus?.streakShieldCharges;
  const hydrationStreakAlertId = hydrationStatus?.streakAlert?.id;
  const hydrationWorkoutSessionEndsAt = hydrationStatus?.workoutSessionEndsAt;
  const hydrationLastWorkoutDrinkAt = hydrationStatus?.lastWorkoutDrinkAt;

  useEffect(() => {
    quietHoursRef.current = quietHours;
  }, [quietHours]);

  useEffect(() => {
    intervalRef.current = intervalMinutes;
  }, [intervalMinutes]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    hydrationStatusRef.current = getSafeHydrationStatus({
      intake: hydrationIntake ?? 0,
      goal: hydrationGoal ?? 2500,
      lastDrinkAt: hydrationLastDrinkAt ?? null,
      inactiveDays: hydrationInactiveDays ?? 0,
      streak: hydrationStreak ?? 0,
      streakShieldCharges: hydrationStreakShieldCharges ?? 2,
      streakAlert: hydrationStatus?.streakAlert ?? null,
      workoutSessionEndsAt: hydrationWorkoutSessionEndsAt ?? null,
      lastWorkoutDrinkAt: hydrationLastWorkoutDrinkAt ?? null,
    });
  }, [
    hydrationGoal,
    hydrationInactiveDays,
    hydrationIntake,
    hydrationLastDrinkAt,
    hydrationStreak,
    hydrationStreakAlertId,
    hydrationStreakShieldCharges,
    hydrationWorkoutSessionEndsAt,
    hydrationLastWorkoutDrinkAt,
    hydrationStatus?.streakAlert,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const syncPermission = () => {
      setPermission(Notification.permission);
    };

    window.addEventListener("focus", syncPermission);
    window.addEventListener(PERMISSION_EVENT, syncPermission);
    return () => {
      window.removeEventListener("focus", syncPermission);
      window.removeEventListener(PERMISSION_EVENT, syncPermission);
    };
  }, []);

  const refreshPermission = () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    setPermission(Notification.permission);
    window.dispatchEvent(new Event(PERMISSION_EVENT));
  };

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      window.dispatchEvent(new Event(PERMISSION_EVENT));

      if (result === "granted") {
        await showSystemNotification({
          title: "Fluid is ready 💧",
          body: "Friendly water reminders are on. I will nudge you gently when it is time to drink.",
          tag: "fluid-permission",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (permission === "granted" && intervalMinutes > 0 && active) {
      const intervalMs = intervalMinutes * 60 * 1000;
      let isDisposed = false;

      const clearTimer = () => {
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };

      const scheduleFor = (timestamp: number) => {
        if (isDisposed) return;

        clearTimer();
        timerRef.current = window.setTimeout(() => {
          void checkAndNotify(false);
        }, Math.max(1000, timestamp - Date.now()));
      };

      const updateNextDue = (timestamp: number) => {
        localStorage.setItem(NEXT_NOTIFICATION_KEY, timestamp.toString());
        scheduleFor(timestamp);
      };

      const checkAndNotify = async (isCatchUp = false) => {
        if (isDisposed || !activeRef.current || intervalRef.current <= 0 || Notification.permission !== "granted") {
          return;
        }

        const now = new Date();
        const quietEndsAt = getQuietWindowEnd(now, quietHoursRef.current);

        if (quietEndsAt) {
          updateNextDue(quietEndsAt + ONE_MINUTE_MS);
          return;
        }

        const lastNotificationAt = getStoredTimestamp(LAST_NOTIFIED_KEY);
        const nextAllowedAt = lastNotificationAt + MIN_NOTIFICATION_GAP_MS;

        if (lastNotificationAt > 0 && Date.now() < nextAllowedAt) {
          updateNextDue(nextAllowedAt);
          return;
        }

        const message = pickHydrationNotification(
          {
            ...hydrationStatusRef.current,
            reminderInterval: intervalRef.current,
            now,
            isCatchUp,
          },
          localStorage.getItem(LAST_NOTIFICATION_TYPE_KEY)
        );

        await showSystemNotification({
          title: message.title,
          body: message.body,
          tag: `fluid-${message.kind}`,
          actionAmount: message.actionAmount,
        });

        if (isDisposed) return;

        localStorage.setItem(LAST_NOTIFICATION_TYPE_KEY, message.kind);
        localStorage.setItem(LAST_NOTIFIED_KEY, Date.now().toString());
        updateNextDue(Date.now() + (message.nextDelayMinutes ?? intervalRef.current) * 60 * 1000);
      };

      const storedNextDue = Number(localStorage.getItem(NEXT_NOTIFICATION_KEY) || 0);
      const lastNotifiedAt = Number(localStorage.getItem(LAST_NOTIFIED_KEY) || 0);
      const lastDrinkAt = hydrationStatusRef.current.lastDrinkAt ?? 0;
      let nextDue = storedNextDue > 0 ? storedNextDue : Date.now() + intervalMs;

      if (lastDrinkAt > lastNotifiedAt) {
        const drinkDue = lastDrinkAt + intervalMs;
        nextDue = drinkDue > Date.now() ? drinkDue : nextDue;
      }

      const quietEndsAt = getQuietWindowEnd(new Date(), quietHoursRef.current);
      if (quietEndsAt && nextDue <= Date.now()) {
        nextDue = quietEndsAt + ONE_MINUTE_MS;
      }

      localStorage.setItem(NEXT_NOTIFICATION_KEY, nextDue.toString());
      scheduleFor(nextDue);

      const handleVisibility = () => {
        if (document.visibilityState !== "visible") return;

        const storedDue = Number(localStorage.getItem(NEXT_NOTIFICATION_KEY) || 0);

        if (storedDue > 0 && Date.now() >= storedDue) {
          void checkAndNotify(true);
        }
      };

      document.addEventListener("visibilitychange", handleVisibility);
      window.addEventListener("focus", handleVisibility);

      return () => {
        isDisposed = true;
        clearTimer();
        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("focus", handleVisibility);
      };
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (!active || intervalMinutes <= 0) {
        localStorage.removeItem(NEXT_NOTIFICATION_KEY);
      }
    };
  }, [
    active,
    hydrationGoal,
    hydrationInactiveDays,
    hydrationIntake,
    hydrationLastDrinkAt,
    intervalMinutes,
    permission,
    quietHours.end,
    quietHours.start,
  ]);

  useEffect(() => {
    if (permission === "granted" && intervalMinutes > 0 && active) {
      let isDisposed = false;

      const clearTimer = () => {
        if (lifecycleTimerRef.current !== null) {
          window.clearTimeout(lifecycleTimerRef.current);
          lifecycleTimerRef.current = null;
        }
      };

      const scheduleFor = (timestamp: number) => {
        if (isDisposed) return;

        clearTimer();
        lifecycleTimerRef.current = window.setTimeout(() => {
          void checkLifecycleAndNotify(false);
        }, Math.max(1000, timestamp - Date.now()));
      };

      const updateNextDue = (timestamp: number) => {
        localStorage.setItem(LIFECYCLE_NEXT_NOTIFICATION_KEY, timestamp.toString());
        scheduleFor(timestamp);
      };

      const getLifecycleContext = (isCatchUp: boolean) => ({
        ...hydrationStatusRef.current,
        reminderInterval: intervalRef.current,
        now: new Date(),
        isCatchUp,
      });

      const scheduleNextLifecycleCheck = () => {
        const context = getLifecycleContext(false);
        const quietEndsAt = getQuietWindowEnd(context.now, quietHoursRef.current);
        let nextDue = getNextHydrationLifecycleDueAt(context, getLifecycleNotificationState());

        if (quietEndsAt && nextDue <= quietEndsAt) {
          nextDue = quietEndsAt + ONE_MINUTE_MS;
        }

        updateNextDue(nextDue);
      };

      const checkLifecycleAndNotify = async (isCatchUp = false) => {
        if (isDisposed || !activeRef.current || intervalRef.current <= 0 || Notification.permission !== "granted") {
          return;
        }

        const context = getLifecycleContext(isCatchUp);
        const quietEndsAt = getQuietWindowEnd(context.now, quietHoursRef.current);

        if (quietEndsAt) {
          updateNextDue(quietEndsAt + ONE_MINUTE_MS);
          return;
        }

        const lastNotificationAt = getStoredTimestamp(LAST_NOTIFIED_KEY);
        const nextAllowedAt = lastNotificationAt + MIN_NOTIFICATION_GAP_MS;

        if (lastNotificationAt > 0 && Date.now() < nextAllowedAt) {
          updateNextDue(nextAllowedAt);
          return;
        }

        const message = pickHydrationLifecycleNotification(context, getLifecycleNotificationState());

        if (!message) {
          scheduleNextLifecycleCheck();
          return;
        }

        await showSystemNotification({
          title: message.title,
          body: message.body,
          tag: `fluid-${message.cadence}-${message.kind}`,
          actionAmount: message.actionAmount,
        });

        if (isDisposed) return;

        const sentAt = Date.now();
        setLifecycleNotificationSent(message.cadence, sentAt);
        localStorage.setItem(LAST_NOTIFICATION_TYPE_KEY, message.kind);
        localStorage.setItem(LAST_NOTIFIED_KEY, sentAt.toString());
        scheduleNextLifecycleCheck();
      };

      const storedNextDue = getStoredTimestamp(LIFECYCLE_NEXT_NOTIFICATION_KEY);
      const initialContext = getLifecycleContext(false);
      const initialDue =
        storedNextDue > 0 ? storedNextDue : getNextHydrationLifecycleDueAt(initialContext, getLifecycleNotificationState());

      updateNextDue(initialDue);

      const handleVisibility = () => {
        if (document.visibilityState !== "visible") return;

        const storedDue = getStoredTimestamp(LIFECYCLE_NEXT_NOTIFICATION_KEY);

        if (storedDue > 0 && Date.now() >= storedDue) {
          void checkLifecycleAndNotify(true);
        }
      };

      document.addEventListener("visibilitychange", handleVisibility);
      window.addEventListener("focus", handleVisibility);

      return () => {
        isDisposed = true;
        clearTimer();
        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("focus", handleVisibility);
      };
    }

    return () => {
      if (!active || intervalMinutes <= 0) {
        localStorage.removeItem(LIFECYCLE_NEXT_NOTIFICATION_KEY);
      }
    };
  }, [
    active,
    hydrationGoal,
    hydrationInactiveDays,
    hydrationIntake,
    hydrationLastDrinkAt,
    intervalMinutes,
    permission,
    quietHours.end,
    quietHours.start,
  ]);

  useEffect(() => {
    if (permission === "granted" && intervalMinutes > 0 && active) {
      let isDisposed = false;

      const clearTimer = () => {
        if (streakAlertTimerRef.current !== null) {
          window.clearTimeout(streakAlertTimerRef.current);
          streakAlertTimerRef.current = null;
        }
      };

      const scheduleFor = (timestamp: number) => {
        if (isDisposed) return;

        clearTimer();
        streakAlertTimerRef.current = window.setTimeout(() => {
          void checkStreakAlert();
        }, Math.max(1000, timestamp - Date.now()));
      };

      const checkStreakAlert = async () => {
        if (isDisposed || !activeRef.current || intervalRef.current <= 0 || Notification.permission !== "granted") {
          return;
        }

        const alert = hydrationStatusRef.current.streakAlert;

        if (!alert || localStorage.getItem(STREAK_ALERT_NOTIFIED_KEY) === alert.id) {
          return;
        }

        const now = new Date();
        const quietEndsAt = getQuietWindowEnd(now, quietHoursRef.current);

        if (quietEndsAt) {
          scheduleFor(quietEndsAt + ONE_MINUTE_MS);
          return;
        }

        const lastNotificationAt = getStoredTimestamp(LAST_NOTIFIED_KEY);
        const nextAllowedAt = lastNotificationAt + MIN_NOTIFICATION_GAP_MS;

        if (lastNotificationAt > 0 && Date.now() < nextAllowedAt) {
          scheduleFor(nextAllowedAt);
          return;
        }

        const message = pickHydrationStreakAlertNotification(alert);

        if (!message) return;

        await showSystemNotification({
          title: message.title,
          body: message.body,
          tag: `fluid-${message.kind}-${alert.id}`,
          actionAmount: message.actionAmount,
        });

        if (isDisposed) return;

        const sentAt = Date.now();
        localStorage.setItem(STREAK_ALERT_NOTIFIED_KEY, alert.id);
        localStorage.setItem(LAST_NOTIFICATION_TYPE_KEY, message.kind);
        localStorage.setItem(LAST_NOTIFIED_KEY, sentAt.toString());
      };

      scheduleFor(Date.now() + 1500);

      return () => {
        isDisposed = true;
        clearTimer();
      };
    }

    return () => {
      if (streakAlertTimerRef.current !== null) {
        window.clearTimeout(streakAlertTimerRef.current);
        streakAlertTimerRef.current = null;
      }
    };
  }, [
    active,
    hydrationGoal,
    hydrationInactiveDays,
    hydrationIntake,
    hydrationLastDrinkAt,
    hydrationStreak,
    hydrationStreakAlertId,
    hydrationStreakShieldCharges,
    intervalMinutes,
    permission,
    quietHours.end,
    quietHours.start,
  ]);

  useEffect(() => {
    if (permission === "granted" && hydrationWorkoutSessionEndsAt && hydrationWorkoutSessionEndsAt > Date.now()) {
      let isDisposed = false;

      const clearTimer = () => {
        if (workoutTimerRef.current !== null) {
          window.clearTimeout(workoutTimerRef.current);
          workoutTimerRef.current = null;
        }
      };

      const scheduleFor = (timestamp: number) => {
        if (isDisposed) return;

        clearTimer();
        workoutTimerRef.current = window.setTimeout(() => {
          void checkWorkoutAndNotify(false);
        }, Math.max(1000, timestamp - Date.now()));
      };

      const updateNextDue = (timestamp: number) => {
        localStorage.setItem(WORKOUT_NEXT_NOTIFICATION_KEY, timestamp.toString());
        scheduleFor(timestamp);
      };

      const getWorkoutContext = (isCatchUp: boolean) => ({
        ...hydrationStatusRef.current,
        reminderInterval: WORKOUT_REMINDER_INTERVAL_MINUTES,
        now: new Date(),
        isCatchUp,
      });

      const scheduleNextWorkoutCheck = () => {
        const context = getWorkoutContext(false);
        const sessionEndsAt = context.workoutSessionEndsAt ?? 0;

        if (sessionEndsAt <= Date.now()) {
          localStorage.removeItem(WORKOUT_NEXT_NOTIFICATION_KEY);
          return;
        }

        const lastWorkoutDrinkAt = context.lastWorkoutDrinkAt ?? 0;
        const nextByDrink =
          lastWorkoutDrinkAt > 0
            ? lastWorkoutDrinkAt + WORKOUT_REMINDER_INTERVAL_MINUTES * 60 * 1000
            : Date.now() + WORKOUT_REMINDER_INTERVAL_MINUTES * 60 * 1000;
        const nextDue = Math.min(sessionEndsAt, Math.max(Date.now() + 1000, nextByDrink));
        const quietEndsAt = getQuietWindowEnd(context.now, quietHoursRef.current);

        updateNextDue(quietEndsAt && nextDue <= quietEndsAt ? quietEndsAt + ONE_MINUTE_MS : nextDue);
      };

      const checkWorkoutAndNotify = async (isCatchUp = false) => {
        if (isDisposed || Notification.permission !== "granted") {
          return;
        }

        const context = getWorkoutContext(isCatchUp);
        const sessionEndsAt = context.workoutSessionEndsAt ?? 0;

        if (sessionEndsAt <= Date.now()) {
          localStorage.removeItem(WORKOUT_NEXT_NOTIFICATION_KEY);
          return;
        }

        const quietEndsAt = getQuietWindowEnd(context.now, quietHoursRef.current);

        if (quietEndsAt) {
          updateNextDue(Math.min(sessionEndsAt, quietEndsAt + ONE_MINUTE_MS));
          return;
        }

        const lastWorkoutNotificationAt = getStoredTimestamp(WORKOUT_LAST_NOTIFIED_KEY);
        const lastAnyNotificationAt = getStoredTimestamp(LAST_NOTIFIED_KEY);
        const nextAllowedAt = Math.max(
          lastWorkoutNotificationAt + WORKOUT_REMINDER_INTERVAL_MINUTES * 60 * 1000,
          lastAnyNotificationAt + MIN_NOTIFICATION_GAP_MS
        );

        if (nextAllowedAt > Date.now()) {
          updateNextDue(Math.min(sessionEndsAt, nextAllowedAt));
          return;
        }

        const message = pickWorkoutHydrationNotification(context);

        if (!message) {
          scheduleNextWorkoutCheck();
          return;
        }

        await showSystemNotification({
          title: message.title,
          body: message.body,
          tag: `fluid-${message.kind}`,
          actionAmount: message.actionAmount,
          actionNote: message.actionNote,
        });

        if (isDisposed) return;

        const sentAt = Date.now();
        localStorage.setItem(WORKOUT_LAST_NOTIFIED_KEY, sentAt.toString());
        localStorage.setItem(LAST_NOTIFIED_KEY, sentAt.toString());
        updateNextDue(Math.min(sessionEndsAt, sentAt + WORKOUT_REMINDER_INTERVAL_MINUTES * 60 * 1000));
      };

      const storedNextDue = getStoredTimestamp(WORKOUT_NEXT_NOTIFICATION_KEY);
      const initialContext = getWorkoutContext(false);
      const sessionEndsAt = initialContext.workoutSessionEndsAt ?? 0;
      const lastWorkoutDrinkAt = initialContext.lastWorkoutDrinkAt ?? 0;
      const initialDue =
        storedNextDue > Date.now() && storedNextDue < sessionEndsAt
          ? storedNextDue
          : lastWorkoutDrinkAt > 0
            ? lastWorkoutDrinkAt + WORKOUT_REMINDER_INTERVAL_MINUTES * 60 * 1000
            : Date.now() + WORKOUT_REMINDER_INTERVAL_MINUTES * 60 * 1000;

      updateNextDue(Math.min(sessionEndsAt, Math.max(Date.now() + 1000, initialDue)));

      const handleVisibility = () => {
        if (document.visibilityState !== "visible") return;

        const storedDue = getStoredTimestamp(WORKOUT_NEXT_NOTIFICATION_KEY);

        if (storedDue > 0 && Date.now() >= storedDue) {
          void checkWorkoutAndNotify(true);
        }
      };

      document.addEventListener("visibilitychange", handleVisibility);
      window.addEventListener("focus", handleVisibility);

      return () => {
        isDisposed = true;
        clearTimer();
        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("focus", handleVisibility);
      };
    }

    return () => {
      if (workoutTimerRef.current !== null) {
        window.clearTimeout(workoutTimerRef.current);
        workoutTimerRef.current = null;
      }

      localStorage.removeItem(WORKOUT_NEXT_NOTIFICATION_KEY);
    };
  }, [
    hydrationLastWorkoutDrinkAt,
    hydrationWorkoutSessionEndsAt,
    permission,
    quietHours.end,
    quietHours.start,
  ]);

  return { permission, refreshPermission, requestPermission, isSupported };
}
