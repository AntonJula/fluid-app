"use client";

import React from "react";
import { Card } from "./ui/Card";
import { TimePickerDialog } from "./ui/TimePickerDialog";
import { NumberPickerDialog } from "./ui/NumberPickerDialog";
import { Button } from "./ui/Button";
import { useNotifications } from "@/hooks/useNotifications";
import {
  BellOff,
  BellRing,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Laptop,
  RotateCw,
  Send,
  ShieldCheck,
  ShieldX,
  Smartphone,
} from "lucide-react";

interface ReminderSettingsProps {
  interval: number;
  setInterval: (min: number) => void;
  quietHours: { start: string; end: string };
  setQuietHours: (start: string, end: string) => void;
}

type NotificationPlatform = "android" | "ios" | "chrome" | "edge" | "firefox" | "safari" | "desktop";

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
  if (userAgent.includes("edg/")) return "edge";
  if (userAgent.includes("firefox/")) return "firefox";
  if (userAgent.includes("chrome/") || userAgent.includes("chromium/")) return "chrome";
  if (userAgent.includes("safari/")) return "safari";

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

  if (platform === "safari") {
    return [
      "Open Safari settings for this website.",
      "Set Notifications to Allow.",
      "Return to Fluid and reload the page.",
      "Tap Check again.",
    ];
  }

  if (platform === "chrome" || platform === "edge" || platform === "firefox") {
    return [
      "Open the site information control beside the address bar.",
      "Open site permissions and find Notifications.",
      "Change Notifications to Allow.",
      "Return to Fluid, reload, and tap Check again.",
    ];
  }

  return [
    "Open this browser's site permissions.",
    "Find the notification permission for Fluid.",
    "Change it from Block to Allow.",
    "Return, reload, and tap Check again.",
  ];
}

function getSettingsHint(platform: NotificationPlatform) {
  if (platform === "ios") {
    return "Fluid cannot turn notifications back on by itself after they were blocked. Open iPhone Settings and allow them once.";
  }

  if (platform === "android") {
    return "Fluid cannot turn notifications back on by itself after they were blocked. Open Android settings and allow them once.";
  }

  if (platform === "chrome" || platform === "edge" || platform === "firefox" || platform === "safari") {
    return "Fluid cannot reopen a blocked browser prompt. Allow notifications once from this site's browser permissions.";
  }

  return "Notifications are blocked for Fluid. Allow them once from this site's browser or device settings.";
}

export function ReminderSettings({ interval, setInterval, quietHours, setQuietHours }: ReminderSettingsProps) {
  const {
    permission,
    refreshPermission,
    requestPermission,
    isSupported,
    pushStatus,
    pushSupported,
    refreshPushSubscription,
    sendTestPush,
  } = useNotifications(interval, quietHours, false);
  const intervals = [30, 60, 90];
  const remindersEnabled = interval > 0;
  const notificationStatus = getNotificationStatus({ interval, isSupported, permission });
  const StatusIcon = notificationStatus.Icon;
  const lastEnabledIntervalRef = React.useRef(interval > 0 ? interval : 60);

  const [isCustom, setIsCustom] = React.useState(false);
  const [customVal, setCustomVal] = React.useState(interval > 0 ? interval : 60);
  const isPredefined = intervals.includes(interval);
  const [platform, setPlatform] = React.useState<NotificationPlatform>("desktop");
  const [settingsAttempted, setSettingsAttempted] = React.useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = React.useState(false);
  const [pushTestMessage, setPushTestMessage] = React.useState("");
  const [isTestingPush, setIsTestingPush] = React.useState(false);

  const [activePicker, setActivePicker] = React.useState<"start" | "end" | null>(null);

  React.useEffect(() => {
    setPlatform(getNotificationPlatform());
  }, []);

  React.useEffect(() => {
    if (permission !== "denied") {
      setIsRecoveryOpen(false);
      setSettingsAttempted(false);
    }
  }, [permission]);

  React.useEffect(() => {
    if (interval > 0) {
      lastEnabledIntervalRef.current = interval;
      setCustomVal(interval);
    }
  }, [interval]);

  const formatDisplayTime = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    const value = new Date(2020, 0, 1, Number(h), Number(m));

    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(value);
  };

  const toggleReminders = async () => {
    if (remindersEnabled) {
      setInterval(0);
      setIsCustom(false);
      return;
    }

    setInterval(lastEnabledIntervalRef.current || 60);

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
  const canOpenDeviceSettings = platform === "android" || platform === "ios";
  const RecoveryIcon = canOpenDeviceSettings ? Smartphone : Laptop;
  const pushStatusText =
    pushStatus === "subscribed"
      ? "Background push is connected for this device."
      : pushStatus === "missing-keys"
        ? "Background push needs VAPID keys before it can send while Fluid is closed."
        : pushStatus === "failed"
          ? "Fluid could not connect this device for background push yet."
          : pushSupported
            ? "Fluid will try to connect background push after permission is allowed."
            : "This device does not support installed app push from Fluid yet.";

  const handleTestPush = async () => {
    setIsTestingPush(true);
    setPushTestMessage("");

    try {
      await refreshPushSubscription();
      await sendTestPush();
      setPushTestMessage("Test sent. If Fluid is installed, check your notifications.");
    } catch (error) {
      setPushTestMessage(error instanceof Error ? error.message : "Could not send test push.");
    } finally {
      setIsTestingPush(false);
    }
  };

  return (
    <Card data-fluid-stack className="mx-auto mt-4 w-full max-w-sm space-y-4 p-4 shadow-lg min-[380px]:space-y-5 min-[380px]:p-5 md:max-w-[28rem]">
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
          data-checked={remindersEnabled ? "true" : "false"}
          className="fluid-switch mt-1 shrink-0 focus:outline-none focus:ring-2 focus:ring-water-300/55 focus:ring-offset-2 focus:ring-offset-background"
        >
          <span
            aria-hidden="true"
            className="fluid-switch-thumb"
          >
            {remindersEnabled ? <BellRing className="h-3.5 w-3.5" strokeWidth={3} /> : <BellOff className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
        </button>
      </div>

      <div
        className={`overflow-hidden rounded-xl border px-3 py-3 transition-colors min-[380px]:rounded-2xl min-[380px]:px-4 ${
          notificationStatus.tone === "blocked"
            ? "border-rose-200/16 bg-rose-500/10"
            : notificationStatus.tone === "attention"
              ? "border-cyan-100/16 bg-cyan-300/10"
              : "border-water-300/12 bg-water-900/30"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className={`font-ui flex items-center gap-2 ${
                notificationStatus.tone === "blocked" ? "text-rose-100" : remindersEnabled ? "text-water-100" : "text-water-300/72"
              }`}
            >
              <StatusIcon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              <span className="text-sm font-bold">{notificationStatus.title}</span>
            </div>
            <p
              className={`font-body mt-1 text-xs leading-relaxed ${
                notificationStatus.tone === "blocked" ? "text-rose-50/82" : "text-water-300/80"
              }`}
            >
              {notificationStatus.body}
            </p>
          </div>

          {remindersEnabled && isSupported && permission === "default" && (
            <Button
              variant="primary"
              size="sm"
              onClick={requestPermission}
              className="min-h-10 shrink-0 rounded-xl px-3 text-xs"
            >
              Enable
            </Button>
          )}
        </div>

        {remindersEnabled && isSupported && permission === "denied" && (
          <>
            <button
              type="button"
              onClick={() => setIsRecoveryOpen((isOpen) => !isOpen)}
              className="fluid-field-button font-ui mt-3 flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-water-200/65"
              aria-expanded={isRecoveryOpen}
              aria-controls="notification-recovery"
            >
              <span className="flex items-center gap-2">
                <RecoveryIcon className="h-4 w-4 text-rose-100" strokeWidth={2.5} />
                Fix notification delivery
              </span>
              <ChevronDown
                className={`h-4 w-4 text-water-200 transition-transform ${isRecoveryOpen ? "rotate-180" : ""}`}
                strokeWidth={2.6}
              />
            </button>

            {isRecoveryOpen && (
              <div id="notification-recovery" className="mt-3 border-t border-rose-100/12 pt-3">
                <p className="font-body text-xs leading-relaxed text-water-100/76">{getSettingsHint(platform)}</p>

                <ol className="mt-3 space-y-2">
                  {settingsSteps.map((step, index) => (
                    <li key={step} className="flex items-start gap-2.5 px-1 py-1">
                      <span className="font-numeric mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-water-300/16 text-[0.68rem] font-black text-water-100">
                        {index + 1}
                      </span>
                      <span className="font-body text-xs font-semibold leading-relaxed text-water-100/84">{step}</span>
                    </li>
                  ))}
                </ol>

                {settingsAttempted && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-cyan-100/14 bg-cyan-300/10 px-3 py-2.5 text-water-100/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-water-200" strokeWidth={2.5} />
                    <p className="font-body text-xs leading-relaxed">
                      Allow notifications there, return to Fluid, then tap Check again.
                    </p>
                  </div>
                )}

                <div className={`mt-3 grid grid-cols-1 gap-2 ${canOpenDeviceSettings ? "min-[380px]:grid-cols-2" : ""}`}>
                  {canOpenDeviceSettings && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openNotificationSettings}
                      className="min-h-11 rounded-xl px-3 text-xs"
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.7} />
                      Open device settings
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={refreshPermission}
                    className="min-h-11 rounded-xl px-3 text-xs"
                  >
                    <RotateCw className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.7} />
                    Check again
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {remindersEnabled && isSupported && permission === "granted" && (
        <div className="rounded-xl border border-water-300/12 bg-water-900/18 p-3.5 shadow-inner min-[380px]:rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-cyan-100/16 bg-cyan-300/10 text-cyan-100">
              <Send className="h-4.5 w-4.5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-ui text-sm font-extrabold text-white">Background push</p>
              <p className="font-body mt-1 text-xs leading-relaxed text-water-300/80">{pushStatusText}</p>
            </div>
          </div>

          <div className="mt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isTestingPush}
              onClick={() => {
                void handleTestPush();
              }}
              className="w-full rounded-xl px-3 text-xs"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.7} />
              {isTestingPush ? "Sending" : "Test push"}
            </Button>
          </div>

          {pushTestMessage && (
            <p className="font-body mt-2 rounded-xl border border-water-200/10 bg-water-950/22 px-3 py-2 text-xs font-semibold text-water-100/82">
              {pushTestMessage}
            </p>
          )}
        </div>
      )}

      {remindersEnabled && (
        <div className="pt-1">
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-water-300">Reminder rhythm</p>
          <p className="font-body mt-1 text-xs text-water-400/75">
            Fluid waits this long after your last drink before checking in.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
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
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsCustom(true)}
                        data-selected={!isPredefined && interval > 0 ? "true" : "false"}
                        className="fluid-choice min-h-11 min-w-[4.8rem] flex-1 rounded-xl"
                        aria-label="Set custom reminder interval"
                      >
                        <span className={!isPredefined && interval > 0 ? "font-numeric" : "font-ui"}>
                          {!isPredefined && interval > 0 ? `${interval}m` : "Custom"}
                        </span>
                      </Button>
                      <NumberPickerDialog
                        isOpen={isCustom}
                        value={!isPredefined && interval > 0 ? interval : customVal}
                        min={15}
                        max={240}
                        title="Custom Interval"
                        suffix="m"
                        startWithValue
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
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setInterval(item.val);
                      setIsCustom(false);
                    }}
                    data-selected={interval === item.val && !isCustom ? "true" : "false"}
                    className="fluid-choice min-h-11 min-w-[3.8rem] flex-1 rounded-xl"
                    aria-label={`Set reminders every ${item.val} minutes`}
                  >
                    <span className="font-numeric">{item.val}m</span>
                  </Button>
                );
              })}
          </div>
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
              className="fluid-field-button font-numeric flex-1 rounded-xl p-2.5 text-center text-sm font-bold text-white"
              aria-label="Set do not disturb start time"
            >
              {formatDisplayTime(quietHours.start)}
            </button>
            <span className="font-ui text-water-300/50 font-bold text-xs uppercase tracking-widest">To</span>
            <button
              type="button"
              onClick={() => setActivePicker("end")}
              className="fluid-field-button font-numeric flex-1 rounded-xl p-2.5 text-center text-sm font-bold text-white"
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
