"use client";

import { useState, useEffect, useRef } from "react";

const MESSAGES = [
  "Time for a sip 💧",
  "Hydration check!",
  "Quick water break",
  "Keep the streak going, drink water!"
];

export function useNotifications(intervalMinutes: number, quietHours: { start: string; end: string } = { start: "22:00", end: "07:00" }) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        new Notification("Fluid", { 
          body: "Notifications enabled! We'll remind you to drink water.",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (permission === "granted" && intervalMinutes > 0) {
      // Clear existing interval
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Set new interval
      timerRef.current = setInterval(() => {
        // Check Quiet Hours
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        
        const [startH, startM] = quietHours.start.split(":").map(Number);
        const [endH, endM] = quietHours.end.split(":").map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        let isQuietHour = false;
        if (startMins <= endMins) {
          isQuietHour = currentMins >= startMins && currentMins < endMins;
        } else {
          // Crosses midnight (e.g. 22:00 -> 07:00)
          isQuietHour = currentMins >= startMins || currentMins < endMins;
        }

        if (isQuietHour) return; // Do not notify

        const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        new Notification("Fluid", {
          body: msg,
        });
      }, intervalMinutes * 60 * 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMinutes, permission]);

  return { permission, requestPermission };
}
