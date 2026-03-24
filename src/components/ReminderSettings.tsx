"use client";

import React from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { useNotifications } from "@/hooks/useNotifications";
import { BellOff } from "lucide-react";

interface ReminderSettingsProps {
  interval: number;
  setInterval: (min: number) => void;
}

export function ReminderSettings({ interval, setInterval }: ReminderSettingsProps) {
  const { permission, requestPermission } = useNotifications(interval);
  const intervals = [15, 25, 45];

  const [isCustom, setIsCustom] = React.useState(false);
  const [customVal, setCustomVal] = React.useState(interval);
  const isPredefined = intervals.includes(interval);

  return (
    <Card className="w-full max-w-sm mx-auto mt-4 space-y-5 shadow-lg p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white tracking-tight text-lg">Reminders</h3>
        {permission !== "granted" && (
          <Button variant="ghost" size="sm" onClick={requestPermission} className="text-xs underline p-0 h-auto">
            Enable Notifications
          </Button>
        )}
      </div>

      <div className="flex gap-2.5 flex-wrap items-center pt-2">
        {intervals.map((min) => (
          <Button
            key={min}
            variant={interval === min && !isCustom ? "primary" : "secondary"}
            size="sm"
            onClick={() => { setInterval(min); setIsCustom(false); }}
            className={`flex-1 min-w-[3.5rem] rounded-xl ${interval === min && !isCustom ? 'ring-2 ring-water-300/50 ring-offset-2 ring-offset-background' : ''}`}
          >
            {min}m
          </Button>
        ))}

        {isCustom ? (
          <div className="flex items-center gap-2 flex-[2] min-w-[9rem]">
            <input 
              type="number" 
              value={customVal || ""}
              onChange={e => setCustomVal(Number(e.target.value))}
              placeholder="Min"
              className="w-full bg-water-800/40 p-2.5 text-sm text-center border rounded-xl outline-none font-bold text-white border-water-500/30 focus:border-water-300 transition-all shadow-inner placeholder-water-300/50"
              autoFocus
            />
            <Button size="sm" variant="primary" onClick={() => { setInterval(customVal); setIsCustom(false); }} className="px-4 rounded-xl">
              Set
            </Button>
          </div>
        ) : (
          <Button
            variant={!isPredefined && interval > 0 ? "primary" : "secondary"}
            size="sm"
            onClick={() => setIsCustom(true)}
            className={`flex-1 min-w-[4.5rem] rounded-xl ${!isPredefined && interval > 0 ? 'ring-2 ring-water-300/50 ring-offset-2 ring-offset-background' : ''}`}
          >
            {!isPredefined && interval > 0 ? `${interval}m` : "Custom"}
          </Button>
        )}

        <Button
          variant={interval === 0 ? "primary" : "secondary"}
          size="sm"
          className={`flex-[0.5] min-w-[3rem] rounded-xl transition-opacity ${interval === 0 ? 'ring-2 ring-water-300/50 ring-offset-2 ring-offset-background' : 'opacity-80 hover:opacity-100'}`}
          onClick={() => { setInterval(0); setIsCustom(false); }}
          title="Turn Off Reminders"
        >
          <BellOff className={`w-4 h-4 ${interval === 0 ? "text-white" : "text-water-400"}`} />
        </Button>
      </div>
    </Card>
  );
}
