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
        
        <button
          type="button"
          role="switch"
          aria-checked={keepCompact}
          aria-label="Keep navigation compact"
          onClick={() => setHideNav(!keepCompact)}
          className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border border-water-300/14 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-water-300/50 focus:ring-offset-2 focus:ring-offset-background ${
            keepCompact ? "bg-water-300" : "bg-water-900/50"
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              keepCompact ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </>
  );

  if (embedded) {
    return (
      <section className="w-full space-y-4 rounded-[1.05rem] border border-water-300/12 bg-water-950/22 p-4 min-[380px]:space-y-5 min-[380px]:rounded-[1.2rem] min-[380px]:p-5">
        {content}
      </section>
    );
  }

  return (
    <Card className="mx-auto mt-4 w-full max-w-sm space-y-4 p-4 shadow-lg min-[380px]:space-y-5 min-[380px]:p-5 md:max-w-[28rem]">
      {content}
    </Card>
  );
}
