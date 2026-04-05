"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { Delete } from "lucide-react";

interface NumberPickerDialogProps {
  isOpen: boolean;
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  onClose: () => void;
  title?: string;
  suffix?: string;
}

export function NumberPickerDialog({ 
  isOpen, 
  value, 
  onChange, 
  onClose, 
  min = 1,
  max = 999,
  title = "Set Duration",
  suffix = "m"
}: NumberPickerDialogProps) {
  const [currentVal, setCurrentVal] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setCurrentVal(value > 0 ? value.toString() : "");
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const handleKeyPress = (key: string) => {
    setCurrentVal((prev) => {
      const newVal = prev + key;
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-water-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-water-900 border border-water-400/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] rounded-[2rem] w-full max-w-[320px] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
        
        <div className="p-6 bg-water-800/40 border-b border-water-400/10 flex flex-col items-center">
          <p className="text-xs font-bold text-water-400 uppercase tracking-widest mb-4">{title}</p>
          <div className="flex items-end justify-center min-h-[4rem]">
            <span className={`text-6xl font-black transition-all ${currentVal ? "text-white" : "text-water-400/30"}`}>
              {currentVal || "0"}
            </span>
            <span className="text-2xl font-bold text-water-400/70 mb-1.5 ml-1">{suffix}</span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-3">
            {padNumbers.map((row, i) => (
              <React.Fragment key={i}>
                {row.map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeyPress(num.toString())}
                    className="h-14 w-full rounded-2xl flex items-center justify-center text-2xl font-bold bg-water-800/40 text-water-200 hover:bg-water-700/80 hover:text-white transition-all active:scale-95 active:bg-water-500 active:text-white"
                  >
                    {num}
                  </button>
                ))}
              </React.Fragment>
            ))}
            
            <div className="flex items-center justify-center"></div>
            
            <button
              onClick={() => handleKeyPress("0")}
              className="h-14 w-full rounded-2xl flex items-center justify-center text-2xl font-bold bg-water-800/40 text-water-200 hover:bg-water-700/80 hover:text-white transition-all active:scale-95 active:bg-water-500 active:text-white"
            >
              0
            </button>
            
            <button
              onClick={handleBackspace}
              disabled={!currentVal}
              className="h-14 w-full rounded-2xl flex items-center justify-center text-water-300 bg-water-800/20 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-30 disabled:hover:bg-transparent active:scale-95"
            >
              <Delete strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="p-4 flex justify-between gap-3 bg-water-950/30 border-t border-water-400/10">
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
    </div>
  );
}
