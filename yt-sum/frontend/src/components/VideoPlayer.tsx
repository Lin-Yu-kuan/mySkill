"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Film, Music, Loader2 } from "lucide-react";
import { downloadMediaFile } from "@/lib/api";

interface YTPlayerInstance {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  destroy: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
        }
      ) => YTPlayerInstance;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface VideoPlayerProps {
  videoId: string;
  title: string;
  channel: string;
  transcriptSource: string;
  seekTarget: { seconds: number; nonce: number } | null;
  ffmpegAvailable: boolean;
  onNotify: (msg: string) => void;
}

export default function VideoPlayer({
  videoId,
  title,
  channel,
  transcriptSource,
  seekTarget,
  ffmpegAvailable,
  onNotify,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const [downloadingFmt, setDownloadingFmt] = useState<"mp4" | "mp3" | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initPlayer = () => {
      if (cancelled || !containerRef.current || !window.YT?.Player) return;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      containerRef.current.innerHTML = "";
      const mount = document.createElement("div");
      containerRef.current.appendChild(mount);

      playerRef.current = new window.YT.Player(mount, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        initPlayer();
      };
    }

    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (seekTarget && playerRef.current) {
      playerRef.current.seekTo(seekTarget.seconds, true);
      playerRef.current.playVideo();
    }
  }, [seekTarget]);

  const handleDownload = async (fmt: "mp4" | "mp3") => {
    if (fmt === "mp3" && !ffmpegAvailable) {
      onNotify("本機尚未安裝 ffmpeg，請先執行 winget install Gyan.FFmpeg");
      return;
    }
    setDownloadingFmt(fmt);
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const { blob, filename } = await downloadMediaFile(url, fmt);
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      onNotify(`已完成下載：${filename}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "下載失敗");
    } finally {
      setDownloadingFmt(null);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
      <div className="aspect-video bg-black relative">
        <div ref={containerRef} className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
      </div>

      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--text-main)] truncate" title={title}>
              {title}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {channel} · 來源：{transcriptSource}
            </p>
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            YouTube
          </a>
        </div>

        {/* Download bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            本機離線備份
            {!ffmpegAvailable && (
              <span className="text-amber-400" title="未偵測到 ffmpeg，MP3 轉檔與高畫質合併將受限">
                （未偵測到 ffmpeg）
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload("mp4")}
              disabled={downloadingFmt !== null}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-blue-500/60 disabled:opacity-50 cursor-pointer transition"
            >
              {downloadingFmt === "mp4" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Film className="w-3.5 h-3.5 text-blue-400" />
              )}
              {downloadingFmt === "mp4" ? "處理 MP4 中..." : "下載 MP4"}
            </button>
            <button
              onClick={() => handleDownload("mp3")}
              disabled={downloadingFmt !== null || !ffmpegAvailable}
              title={ffmpegAvailable ? "擷取高音質 MP3" : "需要安裝 ffmpeg 才能轉檔 MP3"}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-emerald-500/60 disabled:opacity-40 cursor-pointer transition"
            >
              {downloadingFmt === "mp3" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Music className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {downloadingFmt === "mp3" ? "轉檔 MP3 中..." : "下載 MP3"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
