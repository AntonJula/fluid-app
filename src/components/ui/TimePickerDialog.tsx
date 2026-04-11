"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

interface TimePickerDialogProps {
  isOpen: boolean;
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
  title?: string;
}

function parseTimeValue(value: string) {
  const [rawHour, rawMinute] = value.split(":").map(Number);
  const minute = Number.isFinite(rawMinute) ? rawMinute : 0;
  const hour24 = Number.isFinite(rawHour) ? rawHour : 0;

  return {
    view: "hour" as const,
    hour: hour24 % 12 || 12,
    minute,
    ampm: hour24 >= 12 ? ("PM" as const) : ("AM" as const),
  };
}

export function TimePickerDialog({ isOpen, value, onChange, onClose, title = "Select Time" }: TimePickerDialogProps) {
  if (!isOpen || typeof document === "undefined") return null;

  return (
    <TimePickerDialogContent
      value={value}
      onChange={onChange}
      onClose={onClose}
      title={title}
    />
  );
}

function TimePickerDialogContent({ value, onChange, onClose, title = "Select Time" }: Omit<TimePickerDialogProps, "isOpen">) {
  const initialValue = parseTimeValue(value);
  const [view, setView] = useState<"hour" | "minute">(initialValue.view);
  const [hour, setHour] = useState(initialValue.hour);
  const [minute, setMinute] = useState(initialValue.minute);
  const [ampm, setAmpm] = useState<"AM" | "PM">(initialValue.ampm);

  const handleSave = () => {
    let h24 = hour;
    if (ampm === "PM" && hour < 12) h24 += 12;
    if (ampm === "AM" && hour === 12) h24 = 0;

    const hh = h24.toString().padStart(2, "0");
    const mm = minute.toString().padStart(2, "0");
    onChange(`${hh}:${mm}`);
    onClose();
  };

  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-water-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-water-900 border border-water-400/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] rounded-[2rem] w-full max-w-[320px] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
        <div className="p-6 bg-water-800/40 border-b border-water-400/10 flex flex-col items-center">
          <p className="font-ui text-xs font-bold text-water-400 uppercase tracking-widest mb-4">{title}</p>
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => setView("hour")}
              className={`font-numeric text-5xl font-black rounded-2xl p-2 transition-all duration-300 ${view === "hour" ? "text-white bg-water-500/30 scale-105 shadow-inner" : "text-water-400/70 hover:text-water-200 hover:bg-water-800/50"}`}
            >
              {hour.toString().padStart(2, "0")}
            </button>
            <span className="font-ui text-4xl font-bold text-water-500/50 pb-1 mb-1 animate-pulse">:</span>
            <button
              onClick={() => setView("minute")}
              className={`font-numeric text-5xl font-black rounded-2xl p-2 transition-all duration-300 ${view === "minute" ? "text-white bg-water-500/30 scale-105 shadow-inner" : "text-water-400/70 hover:text-water-200 hover:bg-water-800/50"}`}
            >
              {minute.toString().padStart(2, "0")}
            </button>

            <div className="flex flex-col gap-1 ml-3 h-full justify-center">
              <button
                onClick={() => setAmpm("AM")}
                className={`font-ui text-[12px] font-black px-3 py-1.5 rounded-xl transition-all uppercase tracking-wider ${ampm === "AM" ? "bg-gradient-to-r from-water-400 to-water-500 text-water-950 shadow-md shadow-water-500/30" : "text-water-400/80 hover:bg-water-800/60"}`}
              >
                AM
              </button>
              <button
                onClick={() => setAmpm("PM")}
                className={`font-ui text-[12px] font-black px-3 py-1.5 rounded-xl transition-all uppercase tracking-wider ${ampm === "PM" ? "bg-gradient-to-r from-water-400 to-water-500 text-water-950 shadow-md shadow-water-500/30" : "text-water-400/80 hover:bg-water-800/60"}`}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-4 gap-3 relative min-h-[160px]">
            {(view === "hour" ? hours : minutes).map((val) => (
              <button
                key={val}
                onClick={() => {
                  if (view === "hour") {
                    setHour(val);
                    setView("minute");
                  } else {
                    setMinute(val);
                  }
                }}
                className={`font-numeric h-11 w-full rounded-2xl flex items-center justify-center text-[17px] font-bold transition-all duration-300 ease-out
                  ${(view === "hour" ? hour : minute) === val
                    ? "bg-gradient-to-b from-water-400 to-water-600 text-white shadow-[0_8px_16px_-6px_rgba(56,189,248,0.5)] scale-[1.12]"
                    : "bg-water-800/40 text-water-300 hover:bg-water-700/80 hover:text-white hover:scale-105 border border-water-400/5"
                  }`}
              >
                {val.toString().padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 flex justify-end gap-3 bg-water-950/30 border-t border-water-400/10">
          <Button variant="secondary" size="sm" onClick={onClose} className="rounded-xl px-5 text-water-300 bg-transparent border-transparent shadow-none hover:bg-water-800/50">
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} className="rounded-xl px-6 min-w-[5rem] shadow-lg shadow-water-500/20 active:scale-95">
            Set
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
