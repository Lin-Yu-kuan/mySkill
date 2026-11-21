"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, RefreshCw, Terminal, X } from "lucide-react";

interface MissingComponentModalProps {
  open: boolean;
  onClose: () => void;
  onRecheck: () => Promise<boolean>;
}

export default function MissingComponentModal({
  open,
  onClose,
  onRecheck,
}: MissingComponentModalProps) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);

  if (!open) return null;

  const wingetCmd = "winget install Gyan.FFmpeg";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(wingetCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleRecheck = async () => {
    setChecking(true);
    setCheckMsg(null);
    const ok = await onRecheck();
    setChecking(false);
    if (ok) {
      setCheckMsg("✅ 已偵測到 FFmpeg！現在可以正常下載 MP3 與高畫質 MP4。");
      setTimeout(onClose, 1200);
    } else {
      setCheckMsg("⚠️ 尚未偵測到 FFmpeg（安裝完成後，請關閉並重新啟動 run_app.bat 再按重新偵測）。");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-[var(--accent-amber)] flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-main)]">
                缺少必要下載元件：FFmpeg
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                轉檔 MP3 與合併 1080p 以上高畫質 MP4 需要 FFmpeg
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] space-y-2">
            <div className="font-semibold text-[var(--text-main)]">
              方法 1：Windows 一鍵指令安裝（最推薦）
            </div>
            <p className="text-[var(--text-muted)]">
              打開 Windows 的「終端機 / PowerShell」，貼上並執行以下指令：
            </p>
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono">
              <span className="text-[var(--text-main)] select-all">{wingetCmd}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "已複製" : "複製"}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] space-y-2">
            <div className="font-semibold text-[var(--text-main)]">
              方法 2：從官方網站手動下載安裝
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://www.gyan.dev/ffmpeg/builds/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--accent-blue)] hover:border-blue-500/60"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Windows 版下載 (gyan.dev)
              </a>
              <a
                href="https://ffmpeg.org/download.html"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--accent-blue)] hover:border-blue-500/60"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                FFmpeg 官方下載總覽
              </a>
            </div>
            <p className="text-[var(--text-muted)]">
              安裝完成後，請關閉並重新啟動 <code className="px-1 py-0.5 rounded bg-[var(--bg-elevated)]">run_app.bat</code> 即可使用。
            </p>
          </div>
        </div>

        {checkMsg && (
          <div className="text-xs px-3 py-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)]">
            {checkMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleRecheck}
            disabled={checking}
            className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            重新偵測環境
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
