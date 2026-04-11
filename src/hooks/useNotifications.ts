"use client";

import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "A quick sip now will make the next hour feel better.",
  "Hydration check. Give yourself a small refill break.",
  "A glass of water is an easy win right now.",
  "Keep the streak moving. A few sips count.",
];
const PERMISSION_EVENT = "fluid-notification-permission-changed";

function getInitialPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "default";
  }

  return Notification.permission;
}

export function useNotifications(
  intervalMinutes: number,
  quietHours: { start: string; end: string } = { start: "22:00", end: "07:00" },
  active = true
) {
  const [permission, setPermission] = useState<NotificationPermission>(getInitialPermission);
  const timerRef = useRef<number | null>(null);
  const quietHoursRef = useRef(quietHours);

  useEffect(() => {
    quietHoursRef.current = quietHours;
  }, [quietHours]);

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

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      window.dispatchEvent(new Event(PERMISSION_EVENT));

      if (result === "granted") {
        new Notification("Fluid", {
          body: "Notifications are on. We will keep the reminders calm and useful.",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (permission === "granted" && intervalMinutes > 0 && active) {
      const checkAndNotify = (isCatchUp = false) => {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = quietHoursRef.current.start.split(":").map(Number);
        const [endH, endM] = quietHoursRef.current.end.split(":").map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        let isQuietHour = false;
        if (startMins <= endMins) {
          isQuietHour = currentMins >= startMins && currentMins < endMins;
        } else {
          isQuietHour = currentMins >= startMins || currentMins < endMins;
        }

        if (isQuietHour) return;

        const baseMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        const msg = isCatchUp ? `Welcome back! ${baseMsg}` : baseMsg;
        
        new Notification("Fluid", { body: msg });
        localStorage.setItem("fluid-last-notified", Date.now().toString());
      };

      if (timerRef.current !== null) window.clearInterval(timerRef.current);

      timerRef.current = window.setInterval(() => {
        checkAndNotify(false);
      }, intervalMinutes * 60 * 1000);

      const handleVisibility = () => {
        if (document.visibilityState === "visible") {
          const last = Number(localStorage.getItem("fluid-last-notified") || 0);
          // If we missed a notification by at least 1 interval cycle
          if (last > 0 && Date.now() - last >= intervalMinutes * 60 * 1000) {
            checkAndNotify(true);
            // Reset interval so it doesn't fire immediately afterwards
            if (timerRef.current !== null) window.clearInterval(timerRef.current);
            timerRef.current = window.setInterval(() => checkAndNotify(false), intervalMinutes * 60 * 1000);
          }
        }
      };

      document.addEventListener("visibilitychange", handleVisibility);
      // Also register for focus window as an alternative
      window.addEventListener("focus", handleVisibility);

      return () => {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("focus", handleVisibility);
      };
    }

    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [active, intervalMinutes, permission]);

  return { permission, requestPermission };
}
