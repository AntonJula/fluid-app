"use client";

import React from "react";
import { Card } from "./ui/Card";
import { TimePickerDialog } from "./ui/TimePickerDialog";
import { NumberPickerDialog } from "./ui/NumberPickerDialog";
import { Button } from "./ui/Button";
import { useNotifications } from "@/hooks/useNotifications";
import { BellOff, BellRing, CheckCircle2, Clock, ExternalLink, RotateCw, ShieldCheck, ShieldX, Smartphone } from "lucide-react";

interface ReminderSettingsProps {
  interval: number;
  setInterval: (min: number) => void;
  quietHours: { start: string; end: string };
  setQuietHours: (start: string, end: string) => void;
}

type NotificationPlatform = "android" | "ios" | "desktop";

function getNotificationStatus({
  interval,
  isSupported,
  permission,
}: {
  interval: number;
  isSupported: boolean;
  permission: NotificationPermission;
}) {
  if (interval <= 0) {
    return {
      Icon: BellOff,
      title: "Reminders are off",
      body: "Turn them on when you want Fluid to help you keep a steady rhythm.",
      tone: "muted",
    };
  }

  if (!isSupported) {
    return {
      Icon: ShieldX,
      title: "Not available on this device",
      body: "This setup does not support app notifications yet. You can still track water inside Fluid.",
      tone: "blocked",
    };
  }

  if (permission === "granted") {
    return {
      Icon: ShieldCheck,
      title: "App notifications allowed",
      body: `Fluid can remind you every ${interval} minutes, then follow up gently after 15 minutes if nothing was logged.`,
      tone: "ready",
    };
  }

  if (permission === "denied") {
    return {
      Icon: ShieldX,
      title: "Notifications are blocked",
      body: "Turn notifications back on from your device or app settings, then return to Fluid.",
      tone: "blocked",
    };
  }

  return {
    Icon: BellRing,
    title: "Permission needed",
    body: "Allow app notifications so Fluid can send reminders and quick log actions.",
    tone: "attention",
  };
}

function getNotificationPlatform(): NotificationPlatform {
  if (typeof navigator === "undefined") return "desktop";

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();

  if (userAgent.includes("android")) return "android";
  if (/iphone|ipad|ipod/.test(userAgent) || (platform.includes("mac") && navigator.maxTouchPoints > 1)) return "ios";

  return "desktop";
}

function getSettingsSteps(platform: NotificationPlatform) {
  if (platform === "ios") {
    return [
      "Open iPhone Settings.",
      "Go to Notifications, then Fluid.",
      "Turn Allow Notifications on.",
      "Keep Lock Screen, Notification Center, and Banners on.",
      "Return to Fluid and tap Check again.",
    ];
  }

  if (platform === "android") {
    return [
      "Long-press the Fluid icon and tap App info.",
      "Go to Notifications.",
      "Turn Allow notifications on.",
      "Keep Fluid reminders enabled if categories appear.",
      "Return to Fluid and tap Check again.",
    ];
  }

  return [
    "Open your device notification settings.",
    "Find Fluid.",
    "Change notifications from blocked to allowed.",
    "Return to Fluid and tap Check again.",
  ];
}

function getSettingsHint(platform: NotificationPlatform) {
  if (platform === "ios") {
    return "Fluid cannot turn notifications back on by itself after they were blocked. Open iPhone Settings and allow them once.";
  }

  if (platform === "android") {
    return "Fluid cannot turn notifications back on by itself after they were blocked. Open Android settings and allow them once.";
  }

  return "Notifications are blocked for Fluid. Change this once in your device settings, then come back to the app.";
}

export function ReminderSettings({ interval, setInterval, quietHours, setQuietHours }: ReminderSettingsProps) {
  const { permission, refreshPermission, requestPermission, isSupported } = useNotifications(interval, quietHours, false);
  const intervals = [20, 40, 60];
  const remindersEnabled = interval > 0;
  const notificationStatus = getNotificationStatus({ interval, isSupported, permission });
  const StatusIcon = notificationStatus.Icon;
  const lastEnabledIntervalRef = React.useRef(interval > 0 ? interval : 40);

  const [isCustom, setIsCustom] = React.useState(false);
  const [customVal, setCustomVal] = React.useState(interval > 0 ? interval : 40);
  const isPredefined = intervals.includes(interval);
  const [platform, setPlatform] = React.useState<NotificationPlatform>("desktop");
  const [settingsAttempted, setSettingsAttempted] = React.useState(false);

  const [activePicker, setActivePicker] = React.useState<"start" | "end" | null>(null);

  React.useEffect(() => {
    setPlatform(getNotificationPlatform());
  }, []);

  React.useEffect(() => {
    if (interval > 0) {
      lastEnabledIntervalRef.current = interval;
      setCustomVal(interval);
    }
  }, [interval]);

  const formatDisplayTime = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    const hNum = Number(h);
    const ampm = hNum >= 12 ? "PM" : "AM";
    const h12 = hNum % 12 || 12;
    return `${h12.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  const toggleReminders = async () => {
    if (remindersEnabled) {
      setInterval(0);
      setIsCustom(false);
      return;
    }

    setInterval(lastEnabledIntervalRef.current || 40);

    if (isSupported && permission === "default") {
      await requestPermission();
    }
  };

  const openNotificationSettings = () => {
    setSettingsAttempted(true);

    if (typeof window === "undefined") return;

    if (platform === "android") {
      const fallbackUrl = encodeURIComponent(window.location.href);
      window.location.href =
        `intent://notification-settings/#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;S.browser_fallback_url=${fallbackUrl};end`;
      return;
    }

    if (platform === "ios") {
      window.location.href = "App-Prefs:NOTIFICATIONS_ID";
    }
  };

  const settingsSteps = getSettingsSteps(platform);

  return (
    <Card className="mx-auto mt-4 w-full max-w-sm space-y-4 p-4 shadow-lg min-[380px]:space-y-5 min-[380px]:p-5 md:max-w-[28rem]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-ui font-semibold text-white tracking-normal text-lg">Reminders</h3>
          <p className="font-body mt-1 text-sm text-water-300/80">
            Fluid can nudge you to drink, follow up gently, and help you return after quiet days.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={remindersEnabled}
          aria-label={remindersEnabled ? "Turn reminders off" : "Turn reminders on"}
          onClick={() => {
            void toggleReminders();
          }}
          className={`relative mt-1 inline-flex h-8 w-14 shrink-0 rounded-full border border-water-300/14 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-water-300/55 focus:ring-offset-2 focus:ring-offset-background ${
            remindersEnabled ? "bg-water-300" : "bg-water-950/55"
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-water-700 shadow transition-transform duration-200 ${
              remindersEnabled ? "translate-x-6" : "translate-x-0"
            }`}
          >
            {remindersEnabled ? <BellRing className="h-3.5 w-3.5" strokeWidth={3} /> : <BellOff className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
        </button>
      </div>

      <div
        className={`rounded-xl border px-3 py-3 min-[380px]:rounded-2xl min-[380px]:px-4 ${
          notificationStatus.tone === "blocked"
            ? "border-rose-200/16 bg-rose-500/10"
            : notificationStatus.tone === "attention"
              ? "border-cyan-100/16 bg-cyan-300/10"
              : "border-water-300/12 bg-water-900/30"
        }`}
      >
        <div
          className={`font-ui flex items-center gap-2 ${
            notificationStatus.tone === "blocked" ? "text-rose-100" : remindersEnabled ? "text-water-100" : "text-water-300/72"
          }`}
        >
          <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
          <span className="text-sm font-bold">{notificationStatus.title}</span>
        </div>
        <p
          className={`font-body mt-1 text-xs ${
            notificationStatus.tone === "blocked" ? "text-rose-50/82" : "text-water-300/80"
          }`}
        >
          {notificationStatus.body}
        </p>
      </div>

      {remindersEnabled && isSupported && permission === "default" && (
        <div className="rounded-xl border border-cyan-100/14 bg-cyan-300/10 px-3 py-3 min-[380px]:rounded-2xl min-[380px]:px-4">
          <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
            <p className="font-body text-sm font-semibold text-water-100/88">
              Enable app notifications to receive reminders outside the Fluid screen.
            </p>
            <Button variant="primary" size="sm" onClick={requestPermission} className="shrink-0 rounded-xl px-3 text-xs">
              Enable
            </Button>
          </div>
        </div>
      )}

      {remindersEnabled && isSupported && permission === "denied" && (
        <div className="rounded-[1.15rem] border border-rose-100/18 bg-gradient-to-br from-rose-500/13 via-water-900/34 to-water-950/42 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] min-[380px]:rounded-[1.35rem] min-[380px]:p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-100/18 bg-rose-100/10 text-rose-100">
              <Smartphone className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="font-ui text-sm font-extrabold text-white">Notifications need one phone setting</p>
              <p className="font-body mt-1 text-xs leading-relaxed text-water-100/72">{getSettingsHint(platform)}</p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {settingsSteps.map((step, index) => (
              <div key={step} className="flex items-start gap-2.5 rounded-xl border border-water-200/10 bg-water-950/24 px-3 py-2.5">
                <span className="font-numeric mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-water-300/16 text-[0.68rem] font-black text-water-100">
                  {index + 1}
                </span>
                <span className="font-body text-xs font-semibold leading-relaxed text-water-100/84">{step}</span>
              </div>
            ))}
          </div>

          {settingsAttempted && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-cyan-100/14 bg-cyan-300/10 px-3 py-2.5 text-water-100/80">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-water-200" strokeWidth={2.5} />
              <p className="font-body text-xs leading-relaxed">
                If settings opened, enable notifications there. If nothing opened, use the steps above manually.
              </p>
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
            <Button
              variant="primary"
              size="sm"
              onClick={openNotificationSettings}
              className="rounded-xl px-3 text-xs"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.7} />
              Open phone settings
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={refreshPermission}
              className="rounded-xl px-3 text-xs"
            >
              <RotateCw className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.7} />
              Check again
            </Button>
          </div>
        </div>
      )}

      {remindersEnabled && (
        <div className="flex gap-2.5 flex-wrap items-center pt-1">
          {[
            ...intervals.map((min) => ({ isCustomBtn: false, val: min })),
            { isCustomBtn: true, val: !isPredefined && interval > 0 ? interval : Infinity },
          ]
            .sort((a, b) => a.val - b.val)
            .map((item) => {
              if (item.isCustomBtn) {
                return (
                  <React.Fragment key="custom-btn-frag">
                    <Button
                      key="custom-btn"
                      variant={!isPredefined && interval > 0 ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setIsCustom(true)}
                      className={`flex-1 min-w-[4.8rem] rounded-xl ${
                        !isPredefined && interval > 0 ? "ring-2 ring-water-300/50 ring-offset-2 ring-offset-background" : ""
                      }`}
                      aria-label="Set custom reminder interval"
                    >
                      <span className={!isPredefined && interval > 0 ? "font-numeric" : "font-ui"}>
                        {!isPredefined && interval > 0 ? `${interval}m` : "Custom"}
                      </span>
                    </Button>
                    <NumberPickerDialog
                      isOpen={isCustom}
                      value={!isPredefined && interval > 0 ? interval : customVal}
                      min={5}
                      max={240}
                      title="Custom Interval"
                      suffix="m"
                      onChange={(val) => {
                        setCustomVal(val);
                        setInterval(val);
                      }}
                      onClose={() => setIsCustom(false)}
                    />
                  </React.Fragment>
                );
              }

              return (
                <Button
                  key={item.val}
                  variant={interval === item.val && !isCustom ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => {
                    setInterval(item.val);
                    setIsCustom(false);
                  }}
                  className={`flex-1 min-w-[3.8rem] rounded-xl ${
                    interval === item.val && !isCustom ? "ring-2 ring-water-300/50 ring-offset-2 ring-offset-background" : ""
                  }`}
                  aria-label={`Set reminders every ${item.val} minutes`}
                >
                  <span className="font-numeric">{item.val}m</span>
                </Button>
              );
            })}
        </div>
      )}

      {remindersEnabled && (
        <div className="pt-2">
          <div className="mb-1 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-water-400" strokeWidth={2.5} />
            <p className="font-ui text-xs font-bold text-water-400 uppercase tracking-widest">Do Not Disturb</p>
          </div>
          <p className="font-body text-xs text-water-400/75 mb-3">No reminders between these hours.</p>
          <div className="flex items-center gap-2.5 min-[380px]:gap-3">
            <button
              type="button"
              onClick={() => setActivePicker("start")}
              className="font-numeric flex-1 bg-water-800/50 p-2.5 text-sm text-center border rounded-xl font-bold text-white border-water-300/16 hover:border-water-200/24 hover:bg-water-700/50 transition-all shadow-inner"
              aria-label="Set do not disturb start time"
            >
              {formatDisplayTime(quietHours.start)}
            </button>
            <span className="font-ui text-water-300/50 font-bold text-xs uppercase tracking-widest">To</span>
            <button
              type="button"
              onClick={() => setActivePicker("end")}
              className="font-numeric flex-1 bg-water-800/50 p-2.5 text-sm text-center border rounded-xl font-bold text-white border-water-300/16 hover:border-water-200/24 hover:bg-water-700/50 transition-all shadow-inner"
              aria-label="Set do not disturb end time"
            >
              {formatDisplayTime(quietHours.end)}
            </button>
          </div>
          <TimePickerDialog
            isOpen={activePicker !== null}
            value={activePicker === "start" ? quietHours.start : quietHours.end}
            title={activePicker === "start" ? "Start Time" : "End Time"}
            onChange={(val) => {
              if (activePicker === "start") setQuietHours(val, quietHours.end);
              if (activePicker === "end") setQuietHours(quietHours.start, val);
            }}
            onClose={() => setActivePicker(null)}
          />
        </div>
      )}
    </Card>
  );
}
