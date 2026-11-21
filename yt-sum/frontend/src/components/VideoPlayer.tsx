"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Film,
  Loader2,
  Maximize2,
  Minimize2,
  Music,
  RectangleHorizontal,
} from "lucide-react";
import { downloadMediaFile, downloadTranscriptFile } from "@/lib/api";

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
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
          };
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
  isTheater: boolean;
  apiKey?: string;
  onToggleTheater: () => void;
  onNotify: (msg: string) => void;
}

export default function VideoPlayer({
  videoId,
  title,
  channel,
  transcriptSource,
  seekTarget,
  ffmpegAvailable,
  isTheater,
  apiKey,
  onToggleTheater,
  onNotify,
}: VideoPlayerProps) {
  const playerBoxRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const [downloadingFmt, setDownloadingFmt] = useState<"mp4" | "mp3" | "txt" | "zh" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    const handleDownloadTranscript = async (translateToZhTw: boolean) => {
    setDownloadingFmt(translateToZhTw ? "zh" : "txt");
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const { blob, filename } = await downloadTranscriptFile({
        url,
        format: "txt",
        translateToZhTw,
        apiKey,
      });
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
      onNotify(err instanceof Error ? err.message : "逐字稿下載失敗");
    } finally {
      setDownloadingFmt(null);
    }
  };

  return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

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
          fs: 1,
        },
        events: {
          onReady: () => {
            const iframe = containerRef.current?.querySelector("iframe");
            if (iframe) {
              iframe.setAttribute("allowfullscreen", "true");
              iframe.setAttribute(
                "allow",
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              );
            }
          },
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

    const handleDownloadTranscript = async (translateToZhTw: boolean) => {
    setDownloadingFmt(translateToZhTw ? "zh" : "txt");
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const { blob, filename } = await downloadTranscriptFile({
        url,
        format: "txt",
        translateToZhTw,
        apiKey,
      });
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
      onNotify(err instanceof Error ? err.message : "逐字稿下載失敗");
    } finally {
      setDownloadingFmt(null);
    }
  };

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

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && playerBoxRef.current) {
        await playerBoxRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      onNotify("請直接點擊播放器右下角全螢幕圖示");
    }
  };

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

  const handleDownloadTranscript = async (translateToZhTw: boolean) => {
    setDownloadingFmt(translateToZhTw ? "zh" : "txt");
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const { blob, filename } = await downloadTranscriptFile({
        url,
        format: "txt",
        translateToZhTw,
        apiKey,
      });
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
      onNotify(err instanceof Error ? err.message : "逐字稿下載失敗");
    } finally {
      setDownloadingFmt(null);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
      <div
        ref={playerBoxRef}
        className={`bg-black relative w-full ${
          isFullscreen
            ? "h-screen"
            : isTheater
              ? "aspect-video max-h-[72vh] mx-auto"
              : "aspect-video"
        }`}
      >
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
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleTheater}
              title={isTheater ? "退出劇院模式（雙欄顯示）" : "劇院模式（橫向展開）"}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border cursor-pointer transition ${
                isTheater
                  ? "border-blue-500/60 bg-blue-500/15 text-[var(--accent-blue)]"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <RectangleHorizontal className="w-3.5 h-3.5" />
              {isTheater ? "標準檢視" : "劇院展開"}
            </button>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              title="全螢幕播放"
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] cursor-pointer transition"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
              全螢幕
            </button>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              YouTube
            </a>
          </div>
        </div>

        {/* Download bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            本機離線備份
            {!ffmpegAvailable && (
              <span
                className="text-[var(--accent-amber)]"
                title="未偵測到 ffmpeg，MP3 轉檔與高畫質合併將受限"
              >
                （未偵測到 ffmpeg）
              </span>
            )}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleDownloadTranscript(false)}
              disabled={downloadingFmt !== null}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-blue-500/60 disabled:opacity-50 cursor-pointer transition"
            >
              {downloadingFmt === "txt" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              )}
              逐字稿
            </button>
            <button
              onClick={() => handleDownloadTranscript(true)}
              disabled={downloadingFmt !== null}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-blue-500/60 disabled:opacity-50 cursor-pointer transition"
            >
              {downloadingFmt === "zh" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
              )}
              繁中逐字稿
            </button>
            <button
              onClick={() => handleDownload("mp4")}
              disabled={downloadingFmt !== null}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-blue-500/60 disabled:opacity-50 cursor-pointer transition"
            >
              {downloadingFmt === "mp4" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Film className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
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
                <Music className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
              )}
              {downloadingFmt === "mp3" ? "轉檔 MP3 中..." : "下載 MP3"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
