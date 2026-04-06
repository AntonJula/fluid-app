"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Navigation } from "lucide-react";

interface NavSettingsProps {
  hideNav: boolean;
  setHideNav: (hide: boolean) => void;
}

export function NavSettings({ hideNav, setHideNav }: NavSettingsProps) {
  return (
    <Card className="w-full max-w-sm mx-auto mt-4 space-y-5 shadow-lg p-5">
      <div className="flex items-center gap-4">
        <div>
          <h3 className="font-semibold text-white tracking-tight text-lg">Navigation</h3>
          <p className="mt-1 text-sm text-water-300/80">
            Keep the screen completely clean.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-water-400/10 bg-water-900/30 px-4 py-3 flex items-center justify-between">
        <div className="mr-4">
          <div className="flex items-center gap-2 text-water-200">
            <Navigation className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-sm font-bold">Hide Nav Bar</span>
          </div>
          <p className="mt-1 text-xs text-water-400/80">
            If hidden, you can still navigate by swiping left or right anywhere on the screen.
          </p>
        </div>
        
        <button
          role="switch"
          aria-checked={hideNav}
          onClick={() => setHideNav(!hideNav)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-water-300/50 focus:ring-offset-2 focus:ring-offset-background ${
            hideNav ? "bg-water-300" : "bg-water-900/50"
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              hideNav ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </Card>
  );
}
