"use client";

import React from "react";
import { Card } from "./ui/Card";
import { TimePickerDialog } from "./ui/TimePickerDialog";
import { NumberPickerDialog } from "./ui/NumberPickerDialog";
import { Button } from "./ui/Button";
import { useNotifications } from "@/hooks/useNotifications";
import { HYDRATION_NOTIFICATION_TYPES } from "@/lib/notificationMessages";
import { BellOff, BellRing, Sparkles } from "lucide-react";

interface ReminderSettingsProps {
  interval: number;
  setInterval: (min: number) => void;
  quietHours: { start: string; end: string };
  setQuietHours: (start: string, end: string) => void;
}

export function ReminderSettings({ interval, setInterval, quietHours, setQuietHours }: ReminderSettingsProps) {
  const { permission, requestPermission } = useNotifications(interval, quietHours, false);
  const intervals = [20, 40, 60];
  const featuredNotificationTypes = HYDRATION_NOTIFICATION_TYPES.slice(0, 4);

  const [isCustom, setIsCustom] = React.useState(false);
  const [customVal, setCustomVal] = React.useState(interval);
  const isPredefined = intervals.includes(interval);

  const [activePicker, setActivePicker] = React.useState<"start" | "end" | null>(null);

  const formatDisplayTime = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    const hNum = Number(h);
    const ampm = hNum >= 12 ? "PM" : "AM";
    const h12 = hNum % 12 || 12;
    return `${h12.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  return (
    <Card className="w-full max-w-sm mx-auto mt-4 space-y-5 shadow-lg p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-ui font-semibold text-white tracking-tight text-lg">Reminders</h3>
          <p className="font-body mt-1 text-sm text-water-300/80">
            Gentle nudges work better than constant interruptions.
          </p>
        </div>

        {permission !== "granted" && (
          <Button variant="ghost" size="sm" onClick={requestPermission} className="text-xs underline p-0 h-auto">
            Enable Notifications
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-water-400/10 bg-water-900/30 px-4 py-3">
        <div className="font-ui flex items-center gap-2 text-water-200">
          <BellRing className="w-4 h-4" strokeWidth={2.5} />
          <span className="text-sm font-bold">
            {interval > 0 ? `Every ${interval} minutes` : "Reminders are off"}
          </span>
        </div>
        <p className="font-body mt-1 text-xs text-water-400/80">
          {interval > 0
            ? "Fluid nudges you while the app is open and catches up when you return."
            : "Turn them on if you want help building consistency."}
        </p>
      </div>

      <div className="rounded-2xl border border-cyan-100/15 bg-gradient-to-br from-water-900/38 via-water-800/22 to-emerald-400/10 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="font-ui flex min-w-0 items-center gap-2 text-water-100">
            <Sparkles className="h-4 w-4 shrink-0 text-cyan-200" strokeWidth={2.5} />
            <span className="truncate text-sm font-bold">Smart reminder mix</span>
          </div>
          <span className="font-numeric shrink-0 rounded-full border border-cyan-100/15 bg-cyan-100/10 px-2.5 py-1 text-xs font-black text-cyan-100">
            {HYDRATION_NOTIFICATION_TYPES.length} types
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {featuredNotificationTypes.map((type) => (
            <div
              key={type.kind}
              className="font-ui rounded-xl border border-white/10 bg-water-950/22 px-3 py-2 text-xs font-bold leading-tight text-water-100/90"
            >
              {type.label}
            </div>
          ))}
        </div>
        <p className="font-body mt-3 text-xs leading-relaxed text-water-300/78">
          Plus: morning, midday, evening, close-goal, streak, and small-sip nudges.
        </p>
      </div>

      <div className="flex gap-2.5 flex-wrap items-center pt-1">
        {[
          ...intervals.map((min) => ({ isCustomBtn: false, val: min })),
          { isCustomBtn: true, val: !isPredefined && interval > 0 ? interval : Infinity }
        ].sort((a, b) => a.val - b.val).map((item) => {
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
                >
                  <span className={!isPredefined && interval > 0 ? "font-numeric" : "font-ui"}>
                    {!isPredefined && interval > 0 ? `${interval}m` : "Custom"}
                  </span>
                </Button>
                <NumberPickerDialog
                  isOpen={isCustom}
                  value={!isPredefined && interval > 0 ? interval : customVal}
                  min={5}
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
          } else {
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
              >
                <span className="font-numeric">{item.val}m</span>
              </Button>
            );
          }
        })}

        <Button
          variant={interval === 0 ? "primary" : "secondary"}
          size="sm"
          className={`flex-1 min-w-[3rem] rounded-xl transition-opacity ${
            interval === 0
              ? "ring-2 ring-water-300/50 ring-offset-2 ring-offset-background"
              : "opacity-80 hover:opacity-100"
          }`}
          onClick={() => {
            setInterval(0);
            setIsCustom(false);
          }}
          title="Turn Off Reminders"
        >
          <BellOff className={`w-4 h-4 ${interval === 0 ? "text-white" : "text-water-400"}`} />
        </Button>
      </div>

      {interval > 0 && (
        <div className="pt-2">
          <p className="font-ui text-xs font-bold text-water-400 uppercase tracking-widest mb-1">Do Not Disturb</p>
          <p className="font-body text-xs text-water-400/75 mb-3">Keep reminders out of sleep or focus hours.</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePicker("start")}
              className="font-numeric flex-1 bg-water-800/50 p-2.5 text-sm text-center border rounded-xl font-bold text-white border-water-500/30 hover:border-water-300 hover:bg-water-700/50 transition-all shadow-inner"
            >
              {formatDisplayTime(quietHours.start)}
            </button>
            <span className="font-ui text-water-300/50 font-bold text-xs uppercase tracking-widest">To</span>
            <button
              onClick={() => setActivePicker("end")}
              className="font-numeric flex-1 bg-water-800/50 p-2.5 text-sm text-center border rounded-xl font-bold text-white border-water-500/30 hover:border-water-300 hover:bg-water-700/50 transition-all shadow-inner"
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
