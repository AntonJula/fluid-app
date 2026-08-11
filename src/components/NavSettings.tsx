"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Navigation } from "lucide-react";

interface NavSettingsProps {
  hideNav: boolean;
  setHideNav: (hide: boolean) => void;
  embedded?: boolean;
}

export function NavSettings({ hideNav, setHideNav, embedded = false }: NavSettingsProps) {
  const keepCompact = hideNav;

  const compactToggle = (
    <button
      type="button"
      role="switch"
      aria-checked={keepCompact}
      aria-label="Keep navigation compact"
      onClick={() => setHideNav(!keepCompact)}
      data-checked={keepCompact ? "true" : "false"}
      className="fluid-switch group flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-water-200/70 focus:ring-offset-2 focus:ring-offset-background"
    >
      <span
        aria-hidden="true"
        className="fluid-switch-thumb"
      >
        <span
          className={`h-2 w-2 rounded-full transition-all duration-300 ${
            keepCompact
              ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              : "bg-water-600/70"
          }`}
        />
      </span>
    </button>
  );

  if (embedded) {
    return (
      <section className="w-full py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-water-300/14 bg-water-800/32 text-water-200">
            <Navigation className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-ui text-base font-bold tracking-normal text-white">
              Compact navigation
            </h3>
            <p className="font-body mt-1 text-xs leading-relaxed text-water-300/76">
              Keep the smaller icon bar visible on every screen.
            </p>
          </div>
          {compactToggle}
        </div>
      </section>
    );
  }

  const content = (
    <>
      <div className="flex items-center gap-4">
        <div>
          <h3 className="font-ui font-semibold text-white tracking-normal text-lg">Navigation</h3>
          <p className="font-body mt-1 text-sm text-water-300/80">
            Keep the smaller icon bar visible on every screen.
          </p>
        </div>
      </div>

      <div className="flex min-h-16 items-center justify-between rounded-xl border border-water-300/12 bg-water-900/30 px-3 py-3 min-[380px]:rounded-2xl min-[380px]:px-4">
        <div className="mr-3 min-w-0 min-[380px]:mr-4">
          <div className="font-ui flex items-center gap-2 text-water-200">
            <Navigation className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-sm font-bold">Compact navigation</span>
          </div>
          <p className="font-body mt-1 text-xs text-water-400/80">
            Icons stay available; page names expand again when this is off and you scroll up.
          </p>
        </div>
        
        {compactToggle}
      </div>
    </>
  );

  return (
    <Card className="mx-auto mt-4 w-full max-w-sm space-y-4 p-4 shadow-lg min-[380px]:space-y-5 min-[380px]:p-5 md:max-w-[28rem]">
      {content}
    </Card>
  );
}
