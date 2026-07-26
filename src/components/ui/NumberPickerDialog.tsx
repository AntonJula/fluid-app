"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Delete } from "lucide-react";
import { Button } from "./Button";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

interface NumberPickerDialogProps {
  isOpen: boolean;
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  onClose: () => void;
  title?: string;
  suffix?: string;
  startWithValue?: boolean;
}

export function NumberPickerDialog({
  isOpen,
  value,
  onChange,
  onClose,
  min = 1,
  max = 999,
  title = "Set Duration",
  suffix = "m",
  startWithValue = false,
}: NumberPickerDialogProps) {
  if (!isOpen || typeof document === "undefined") return null;

  return (
    <NumberPickerDialogContent
      value={value}
      min={min}
      max={max}
      onChange={onChange}
      onClose={onClose}
      title={title}
      suffix={suffix}
      startWithValue={startWithValue}
    />
  );
}

function NumberPickerDialogContent({
  min = 1,
  max = 999,
  onChange,
  onClose,
  value,
  title = "Set Duration",
  suffix = "m",
  startWithValue = false,
}: Omit<NumberPickerDialogProps, "isOpen">) {
  const [currentVal, setCurrentVal] = useState(() => (startWithValue && value > 0 ? String(value) : ""));
  const titleId = React.useId();
  const dialogRef = useAccessibleDialog(onClose);

  const handleKeyPress = (key: string) => {
    setCurrentVal((prev) => {
      const newVal = prev === "" && key === "0" ? "" : `${prev}${key}`;
      if (Number(newVal) > max) return prev;
      return newVal;
    });
  };

  const handleBackspace = () => {
    setCurrentVal((prev) => prev.slice(0, -1));
  };

  const handleSave = () => {
    const num = Number(currentVal);
    const finalVal = Math.min(Math.max(num || min, min), max);
    onChange(finalVal);
    onClose();
  };

  const padNumbers = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];

  return createPortal(
    <div
      className="fluid-modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="bg-water-900 border border-[1.5px] border-water-300/16 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] rounded-[2rem] w-full max-w-[320px] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="p-6 bg-water-800/40 border-b border-water-300/12 flex flex-col items-center">
          <p id={titleId} className="font-ui text-xs font-bold text-water-400 uppercase tracking-widest mb-4">{title}</p>
          <div className="flex items-end justify-center min-h-[4rem]">
            <span className={`font-numeric text-6xl font-black transition-all ${currentVal ? "text-white" : "text-water-400/30"}`}>
              {currentVal || "0"}
            </span>
            <span className="font-ui text-2xl font-bold text-water-400/70 mb-1.5 ml-1">{suffix}</span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-3">
            {padNumbers.map((row, i) => (
              <React.Fragment key={i}>
                {row.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(num.toString())}
                    className="font-numeric h-14 w-full rounded-2xl flex items-center justify-center text-2xl font-bold bg-water-800/40 text-water-200 hover:bg-water-700/80 hover:text-white transition-all active:scale-95 active:bg-water-500 active:text-white"
                    aria-label={`Enter ${num}`}
                  >
                    {num}
                  </button>
                ))}
              </React.Fragment>
            ))}

            <div className="flex items-center justify-center" />

            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              className="font-numeric h-14 w-full rounded-2xl flex items-center justify-center text-2xl font-bold bg-water-800/40 text-water-200 hover:bg-water-700/80 hover:text-white transition-all active:scale-95 active:bg-water-500 active:text-white"
              aria-label="Enter 0"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              disabled={!currentVal}
              className="h-14 w-full rounded-2xl flex items-center justify-center bg-rose-500/12 text-rose-100 border border-rose-200/18 shadow-[0_0_16px_rgba(244,63,94,0.08)] hover:bg-rose-500/22 hover:text-white transition-all disabled:opacity-35 disabled:hover:bg-rose-500/12 active:scale-95"
              aria-label="Delete last digit"
              title="Delete last digit"
            >
              <Delete className="h-6 w-6" strokeWidth={2.7} />
            </button>
          </div>
        </div>

        <div className="p-4 flex justify-between gap-3 bg-water-950/30 border-t border-water-300/12">
          <Button variant="secondary" size="sm" onClick={onClose} className="rounded-xl px-5 text-water-300 bg-transparent border-transparent shadow-none hover:bg-water-800/50">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!currentVal || Number(currentVal) < min}
            className="rounded-xl px-8 shadow-lg shadow-water-500/20 active:scale-95 disabled:opacity-50"
          >
            Set
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
