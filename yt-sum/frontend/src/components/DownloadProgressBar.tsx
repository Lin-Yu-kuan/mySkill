"use client";

import { Loader2, Pause, Play, Square } from "lucide-react";

interface DownloadProgressBarProps {
  label: string;
  percent: number;
  stage: string;
  isPaused?: boolean;
  canControl?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

export default function DownloadProgressBar({
  label,
  percent,
  stage,
  isPaused = false,
  canControl = false,
  onPause,
  onResume,
  onCancel,
}: DownloadProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-[var(--text-main)]">
          {isPaused ? (
            <Pause className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
          ) : (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-blue)]" />
          )}
          <span>{label}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-[var(--accent-blue)]">
            {clamped}%
          </span>

          {canControl && (
            <div className="flex items-center gap-1">
              {isPaused ? (
                <button
                  type="button"
                  onClick={onResume}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition"
                >
                  <Play className="w-3 h-3 fill-current" />
                  繼續
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPause}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white cursor-pointer transition"
                >
                  <Pause className="w-3 h-3" />
                  暫停
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition"
              >
                <Square className="w-3 h-3 fill-current" />
                終止
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-[var(--bg-page)] overflow-hidden border border-[var(--border-subtle)]">
        <div
          className={`h-full transition-all duration-300 ease-out ${
            isPaused ? "bg-amber-500" : "bg-blue-500"
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="text-[11px] text-[var(--text-muted)]">{stage}</div>
    </div>
  );
}
