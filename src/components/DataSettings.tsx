"use client";

import React from "react";
import { Download, FileUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { HydrationState } from "@/hooks/useHydration";

interface DataSettingsProps {
  exportHydrationState: () => HydrationState;
  importHydrationState: (state: Partial<HydrationState>) => void;
  embedded?: boolean;
}

const MAX_IMPORT_BYTES = 256 * 1024;

function isBackupShape(value: unknown): value is Partial<HydrationState> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function DataSettings({ exportHydrationState, importHydrationState, embedded = false }: DataSettingsProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = React.useState<"idle" | "exported" | "imported" | "importing" | "error">("idle");
  const isImporting = status === "importing";

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

    setStatus("importing");

    try {
      if (file.size > MAX_IMPORT_BYTES) {
        throw new Error("Backup is too large.");
      }

      const text = await file.text();
      const parsed: unknown = JSON.parse(text);

      if (!isBackupShape(parsed)) {
        throw new Error("Backup shape is invalid.");
      }

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
        : status === "importing"
          ? "Reading backup..."
        : status === "error"
          ? "Import failed."
          : "Local backup";

  const content = (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-ui font-semibold text-white tracking-normal text-lg">Data</h3>
          <p className="font-body mt-1 text-sm text-water-300/80">Keep a portable copy of your progress.</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-water-300/14 bg-water-800/35 text-water-200">
          <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 min-[380px]:gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleExport}
          disabled={isImporting}
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
          disabled={isImporting}
          className="rounded-xl px-3 py-3 text-sm"
          aria-label="Import hydration backup"
        >
          {isImporting ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" strokeWidth={2.5} />
          ) : (
            <FileUp className="mr-2 h-4 w-4" strokeWidth={2.5} />
          )}
          {isImporting ? "Reading" : "Import"}
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
        className={`font-body flex items-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold min-[380px]:rounded-2xl min-[380px]:px-4 ${
          status === "error"
            ? "border-rose-200/16 bg-rose-500/12 text-rose-50"
            : status === "importing"
              ? "border-cyan-100/16 bg-cyan-300/10 text-water-100"
            : "border-water-300/12 bg-water-900/30 text-water-300/82"
        }`}
      >
        {isImporting && <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin text-cyan-100" strokeWidth={2.5} />}
        <span>{statusText}</span>
      </p>
    </>
  );

  if (embedded) {
    return (
      <section className="w-full space-y-4 rounded-[1.05rem] border border-water-300/12 bg-water-950/22 p-4 min-[380px]:rounded-[1.2rem] min-[380px]:p-5">
        {content}
      </section>
    );
  }

  return (
    <Card className="mx-auto mt-4 w-full max-w-sm space-y-4 p-4 shadow-lg min-[380px]:p-5 md:max-w-[28rem]">
      {content}
    </Card>
  );
}
