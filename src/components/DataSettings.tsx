"use client";

import React from "react";
import { Download, FileUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { HydrationState } from "@/hooks/useHydration";

interface DataSettingsProps {
  exportHydrationState: () => HydrationState;
  importHydrationState: (state: Partial<HydrationState>) => void;
}

export function DataSettings({ exportHydrationState, importHydrationState }: DataSettingsProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = React.useState<"idle" | "exported" | "imported" | "error">("idle");

  const handleExport = () => {
    const backup = JSON.stringify(exportHydrationState(), null, 2);
    const blob = new Blob([backup], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `fluid-backup-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("exported");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<HydrationState>;
      importHydrationState(parsed);
      setStatus("imported");
    } catch {
      setStatus("error");
    } finally {
      event.target.value = "";
    }
  };

  const statusText =
    status === "exported"
      ? "Backup downloaded."
      : status === "imported"
        ? "Backup restored."
        : status === "error"
          ? "Import failed."
          : "Local backup";

  return (
    <Card className="w-full max-w-sm mx-auto mt-4 space-y-4 shadow-lg p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-ui font-semibold text-white tracking-tight text-lg">Data</h3>
          <p className="font-body mt-1 text-sm text-water-300/80">Keep a portable copy of your progress.</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-water-300/20 bg-water-800/35 text-water-200">
          <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleExport}
          className="rounded-xl px-3 py-3 text-sm"
          aria-label="Export hydration backup"
        >
          <Download className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Export
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl px-3 py-3 text-sm"
          aria-label="Import hydration backup"
        >
          <FileUp className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Import
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImport}
        aria-label="Choose Fluid backup file"
      />

      <p
        className={`font-body rounded-2xl border px-4 py-3 text-xs font-semibold ${
          status === "error"
            ? "border-rose-200/20 bg-rose-500/12 text-rose-50"
            : "border-water-400/10 bg-water-900/30 text-water-300/82"
        }`}
      >
        {statusText}
      </p>
    </Card>
  );
}
