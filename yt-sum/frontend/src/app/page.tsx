"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  FileDown,
  FileText,
  Film,
  GitBranch,
  KeyRound,
  Layers,
  Loader2,
  MessageSquareText,
  Moon,
  Music,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Sun,
  Trash2,
  Youtube,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import DeepDiveChat from "@/components/DeepDiveChat";
import DependencyGraph from "@/components/DependencyGraph";
import DownloadProgressBar from "@/components/DownloadProgressBar";
import KnowledgeLayers from "@/components/KnowledgeLayers";
import MissingComponentModal from "@/components/MissingComponentModal";
import VideoPlayer from "@/components/VideoPlayer";
import {
  DownloadCancelledByUser,
  analyzeVideo,
  cancelMediaDownload,
  deleteHistoryItem,
  downloadMediaWithProgress,
  downloadTranscriptFile,
  fetchHealth,
  fetchHistoryList,
  loadHistoryItem,
  pauseMediaDownload,
  resumeMediaDownload,
  saveApiKeyToLocal,
  sendChatFollowUp,
  updateHistoryState,
} from "@/lib/api";
import { buildExternalGeminiPrompt, buildMarkdownNote } from "@/lib/exportMarkdown";
import {
  ChatMessage,
  HealthStatus,
  HistorySummaryItem,
  UserLevel,
  VideoAnalysisResponse,
} from "@/types/knowledge";

type RightTab = "graph" | "layers" | "chat";

const LEVEL_LABELS: Record<UserLevel, string> = {
  beginner: "初學者",
  intermediate: "有基礎常識",
  advanced: "領域進階",
};

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [level, setLevel] = useState<UserLevel>("intermediate");
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [fontScale, setFontScale] = useState<"normal" | "large" | "xlarge">("normal");
  const [isTheater, setIsTheater] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [historyItems, setHistoryItems] = useState<HistorySummaryItem[]>([]);
  const [quickDownloading, setQuickDownloading] = useState<string | null>(null);
  const [quickTaskId, setQuickTaskId] = useState<string | null>(null);
  const [quickProgress, setQuickProgress] = useState<{
    label: string;
    percent: number;
    stage: string;
    isPaused: boolean;
    canControl: boolean;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HistorySummaryItem | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysisResponse | null>(null);

  const [viewMode, setViewMode] = useState<RightTab>("layers");
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [seekTarget, setSeekTarget] = useState<{ seconds: number; nonce: number } | null>(
    null
  );

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const refreshHistory = () => {
    fetchHistoryList()
      .then(setHistoryItems)
      .catch(() => {});
  };

  useEffect(() => {
    const savedKey = localStorage.getItem("yt_sum_gemini_key");
    if (savedKey) setApiKey(savedKey);

    const savedTheme = localStorage.getItem("yt_sum_theme");
    if (savedTheme === "light") {
      setTheme("light");
      document.documentElement.classList.add("light");
    }

    const savedFont = localStorage.getItem("yt_sum_font_scale") as
      | "normal"
      | "large"
      | "xlarge"
      | null;
    if (savedFont === "large" || savedFont === "xlarge") {
      setFontScale(savedFont);
      document.documentElement.classList.add(`font-${savedFont}`);
    }

    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
    refreshHistory();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    localStorage.setItem("yt_sum_theme", next);
  };

  const cycleFontScale = () => {
    const order: ("normal" | "large" | "xlarge")[] = ["normal", "large", "xlarge"];
    const next = order[(order.indexOf(fontScale) + 1) % order.length];
    document.documentElement.classList.remove("font-large", "font-xlarge");
    if (next !== "normal") {
      document.documentElement.classList.add(`font-${next}`);
    }
    setFontScale(next);
    localStorage.setItem("yt_sum_font_scale", next);
    const label = next === "normal" ? "標準" : next === "large" ? "大字" : "特大";
    showToast(`已切換文字大小：${label}`);
  };

  const handleSaveApiKey = async () => {
    const cleaned = apiKey.trim();
    if (!cleaned) {
      localStorage.removeItem("yt_sum_gemini_key");
      setShowKeyInput(false);
      return;
    }
    setSavingKey(true);
    try {
      localStorage.setItem("yt_sum_gemini_key", cleaned);
      await saveApiKeyToLocal(cleaned);
      setHealth((prev) =>
        prev ? { ...prev, gemini_key_configured: true } : prev
      );
      setShowKeyInput(false);
      showToast("API Key 已永久儲存至本機資料夾，重啟也不會消失！");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "儲存 API Key 失敗");
    } finally {
      setSavingKey(false);
    }
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const targetUrl = url.trim();
    if (!targetUrl) return;

    setAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeVideo({ url: targetUrl, level, apiKey });
      setAnalysis(res);
      setMasteredIds(new Set());
      setChatMessages([]);
      setSeekTarget(null);
      setViewMode("layers");
      setPanelCollapsed(false);
      refreshHistory();
      showToast("分析完成，已自動保存至本機紀錄！");
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失敗，請稍後再試");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOpenSaved = async (videoId: string) => {
    setError(null);
    try {
      const record = await loadHistoryItem(videoId);
      setAnalysis(record.analysis);
      setMasteredIds(new Set(record.mastered_ids || []));
      setChatMessages(record.chat_messages || []);
      setUrl(`https://www.youtube.com/watch?v=${videoId}`);
      setSeekTarget(null);
      setViewMode("layers");
      setPanelCollapsed(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "讀取保存紀錄失敗");
    }
  };

  const handleRequestDeleteSaved = (e: React.MouseEvent, item: HistorySummaryItem) => {
    e.stopPropagation();
    setPendingDelete(item);
  };

  const handleConfirmDeleteSaved = async () => {
    if (!pendingDelete) return;
    const targetId = pendingDelete.video_id;
    setPendingDelete(null);
    try {
      await deleteHistoryItem(targetId);
      setHistoryItems((prev) => prev.filter((item) => item.video_id !== targetId));
      showToast("已刪除保存紀錄");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const handleQuickMedia = async (fmt: "mp4" | "mp3") => {
    const targetUrl = url.trim();
    if (!targetUrl) {
      showToast("請先在上方貼上 YouTube 影片網址");
      return;
    }
    if (fmt === "mp3" && health && !health.ffmpeg_available) {
      setShowInstallGuide(true);
      return;
    }
    setQuickDownloading(fmt);
    setQuickTaskId(null);
    setError(null);
    setQuickProgress({
      label: fmt === "mp3" ? "正在下載並轉檔 MP3" : "正在下載 MP4 影片",
      percent: 5,
      stage: "正在連線 YouTube...",
      isPaused: false,
      canControl: true,
    });
    try {
      const { blob, filename } = await downloadMediaWithProgress(
        targetUrl,
        fmt,
        (percent, stage, isPaused) => {
          setQuickProgress({
            label: fmt === "mp3" ? "正在下載並轉檔 MP3" : "正在下載 MP4 影片",
            percent,
            stage,
            isPaused,
            canControl: true,
          });
        },
        (taskId) => setQuickTaskId(taskId)
      );
      triggerBlobDownload(blob, filename);
      showToast(`已完成下載：${filename}`);
    } catch (err) {
      if (err instanceof DownloadCancelledByUser) {
        showToast("已終止下載");
      } else {
        const msg = err instanceof Error ? err.message : "下載失敗";
        if (msg.toLowerCase().includes("ffmpeg")) {
          setShowInstallGuide(true);
        } else {
          setError(msg);
        }
      }
    } finally {
      setQuickDownloading(null);
      setQuickTaskId(null);
      setQuickProgress(null);
    }
  };

  const handleQuickTranscript = async (
    format: "txt" | "srt",
    translateToZhTw: boolean
  ) => {
    const targetUrl = url.trim();
    if (!targetUrl) {
      showToast("請先在上方貼上 YouTube 影片網址");
      return;
    }
    const key = `${format}-${translateToZhTw ? "zh" : "orig"}`;
    setQuickDownloading(key);
    setError(null);
    setQuickProgress({
      label: translateToZhTw
        ? `正在產生繁體中文 ${format.toUpperCase()}`
        : `正在擷取原文 ${format.toUpperCase()}`,
      percent: 45,
      stage: translateToZhTw
        ? "擷取字幕並交由 Gemini 轉換成台灣繁體中文..."
        : "讀取 YouTube 字幕中...",
      isPaused: false,
      canControl: false,
    });
    try {
      const { blob, filename } = await downloadTranscriptFile({
        url: targetUrl,
        format,
        translateToZhTw,
        apiKey,
      });
      setQuickProgress({
        label: "準備儲存檔案",
        percent: 100,
        stage: "完成！",
        isPaused: false,
        canControl: false,
      });
      triggerBlobDownload(blob, filename);
      showToast(`已完成下載：${filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "逐字稿下載失敗");
    } finally {
      setQuickDownloading(null);
      setQuickProgress(null);
    }
  };

  const handleToggleMastered = (id: string) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (analysis) {
        updateHistoryState(analysis.video_id, Array.from(next), chatMessages).catch(() => {});
      }
      return next;
    });
  };

  const handleSeekVideo = (seconds: number, label: string) => {
    setSeekTarget({ seconds, nonce: Date.now() });
    showToast(`影片已跳轉至 ${label}`);
  };

  const handleAskInApp = async (prompt: string) => {
    if (!analysis || chatLoading) return;
    setPanelCollapsed(false);
    setViewMode("chat");
    const nextHistory: ChatMessage[] = [...chatMessages, { role: "user", content: prompt }];
    setChatMessages(nextHistory);
    setChatLoading(true);
    try {
      const answer = await sendChatFollowUp({
        videoTitle: analysis.title,
        videoContext: analysis.transcript_excerpt,
        history: chatMessages,
        question: prompt,
        apiKey,
      });
      const finalHistory: ChatMessage[] = [
        ...nextHistory,
        { role: "assistant", content: answer },
      ];
      setChatMessages(finalHistory);
      updateHistoryState(
        analysis.video_id,
        Array.from(masteredIds),
        finalHistory
      ).catch(() => {});
    } catch (err) {
      setChatMessages([
        ...nextHistory,
        {
          role: "assistant",
          content: `⚠️ 無法取得回覆：${err instanceof Error ? err.message : "未知錯誤"}`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleOpenExternalGemini = async (topicTitle: string, prompt: string) => {
    if (!analysis) return;
    const fullPrompt = buildExternalGeminiPrompt(
      analysis.title,
      analysis.video_id,
      topicTitle,
      prompt
    );
    try {
      await navigator.clipboard.writeText(fullPrompt);
      showToast("已複製完整研究 Prompt！請在新分頁直接 Ctrl+V 貼上");
    } catch {
      showToast("已開啟 Gemini，請手動複製提問內容");
    }
    window.open("https://gemini.google.com/app", "_blank", "noopener,noreferrer");
  };

  const handleExportMarkdown = () => {
    if (!analysis) return;
    const md = buildMarkdownNote(analysis);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    triggerBlobDownload(blob, `${analysis.video_id}-knowledge-notes.md`);
    showToast("已匯出 Markdown 學習筆記！");
  };

  const formatSavedDate = (iso: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("zh-TW", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setAnalysis(null);
              setIsTheater(false);
              refreshHistory();
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-85 transition"
            title="回到首頁與已保存紀錄"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {analysis ? <ArrowLeft className="w-4 h-4" /> : "YT"}
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight">YT-Sum 知識導航儀</h1>
              <p className="text-xs text-[var(--text-muted)]">
                {analysis ? "點擊返回首頁・已保存檔案" : "前置掃雷 · 核心拆解 · 延伸研究"}
              </p>
            </div>
          </button>

          <form onSubmit={handleAnalyze} className="flex-1 max-w-xl flex items-center gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="貼上 YouTube 影片網址（例如 https://www.youtube.com/watch?v=...）"
              className="flex-1 text-xs px-3 py-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-main)] focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={analyzing || !url.trim()}
              className="text-xs px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  解析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  解析觀念
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as UserLevel)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-main)]"
            >
              <option value="beginner">背景：初學者</option>
              <option value="intermediate">背景：有基礎常識</option>
              <option value="advanced">背景：領域進階</option>
            </select>

            <button
              type="button"
              onClick={cycleFontScale}
              title="切換網頁文字大小（標準 / 大字 / 特大）"
              className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] cursor-pointer transition font-semibold"
            >
              {fontScale === "normal" ? "A" : fontScale === "large" ? "A+" : "A++"}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "切換成亮白模式" : "切換成暗黑模式"}
              className="text-xs p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] cursor-pointer transition"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowKeyInput((v) => !v)}
              title="設定並永久儲存 Gemini API Key"
              className={`text-xs px-2.5 py-1.5 rounded-lg border inline-flex items-center gap-1 cursor-pointer transition ${
                apiKey || health?.gemini_key_configured
                  ? "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  : "border-amber-500/60 text-[var(--accent-amber)] bg-amber-500/10"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Key
            </button>

            {analysis && (
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] hover:bg-[var(--bg-elevated)] inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                <FileDown className="w-3.5 h-3.5" />
                匯出 .md
              </button>
            )}
          </div>
        </div>

        {showKeyInput && (
          <div className="max-w-[1600px] mx-auto mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[var(--text-muted)]">
              Gemini API Key（將永久儲存於你的本機使用者資料夾）：
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                health?.gemini_key_configured
                  ? "本機已儲存 Key（若要更新請貼上新的 Key）"
                  : "請貼上 AIzaSy... 開頭的 Gemini API Key"
              }
              className="flex-1 max-w-md px-3 py-1.5 rounded-md bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-main)]"
            />
            <button
              type="button"
              onClick={handleSaveApiKey}
              disabled={savingKey}
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50"
            >
              {savingKey ? "儲存中..." : "儲存並套用"}
            </button>
          </div>
        )}
      </header>

      {/* Error banner */}
      {error && (
        <div className="max-w-[1600px] w-full mx-auto px-4 pt-4">
          <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-[var(--accent-rose)] text-xs">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      {!analysis ? (
        <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
          {/* Quick Pre-Analysis Download Toolbox */}
          <section className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-[var(--accent-blue)] flex items-center justify-center shrink-0">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">免解析快捷下載工具箱</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  只要在上方貼上 YouTube 網址，<strong>不用先執行 AI 解析</strong>，就能直接下載逐字稿（含轉換成台灣繁體中文）或 MP4 / MP3！
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickTranscript("txt", false)}
                disabled={quickDownloading !== null}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)] hover:border-blue-500/60 disabled:opacity-50 cursor-pointer transition"
              >
                {quickDownloading === "txt-orig" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                )}
                下載原文字幕 (.txt)
              </button>

              <button
                type="button"
                onClick={() => handleQuickTranscript("txt", true)}
                disabled={quickDownloading !== null}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/35 text-[var(--accent-purple)] hover:bg-purple-500/20 disabled:opacity-50 cursor-pointer transition"
              >
                {quickDownloading === "txt-zh" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                下載繁體中文逐字稿 (.txt)
              </button>

              <button
                type="button"
                onClick={() => handleQuickTranscript("srt", true)}
                disabled={quickDownloading !== null}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)] hover:border-purple-500/60 disabled:opacity-50 cursor-pointer transition"
              >
                {quickDownloading === "srt-zh" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                )}
                下載繁中字幕 (.srt)
              </button>

              <div className="h-5 w-px bg-[var(--border-subtle)] mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={() => handleQuickMedia("mp4")}
                disabled={quickDownloading !== null}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)] hover:border-blue-500/60 disabled:opacity-50 cursor-pointer transition"
              >
                {quickDownloading === "mp4" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Film className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                )}
                {quickDownloading === "mp4" ? "處理 MP4 中..." : "下載 MP4"}
              </button>

              <button
                type="button"
                onClick={() => handleQuickMedia("mp3")}
                disabled={quickDownloading !== null}
                title={
                  health && !health.ffmpeg_available
                    ? "缺少 FFmpeg，點擊查看安裝位置"
                    : "下載純音訊 MP3"
                }
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)] hover:border-emerald-500/60 disabled:opacity-40 cursor-pointer transition ${
                  health && !health.ffmpeg_available ? "opacity-75" : ""
                }`}
              >
                {quickDownloading === "mp3" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Music className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                )}
                {quickDownloading === "mp3" ? "轉檔 MP3 中..." : "下載 MP3"}
              </button>
            </div>

            {quickProgress && (
              <DownloadProgressBar
                label={quickProgress.label}
                percent={quickProgress.percent}
                stage={quickProgress.stage}
                isPaused={quickProgress.isPaused}
                canControl={quickProgress.canControl && quickTaskId !== null}
                onPause={async () => {
                  if (!quickTaskId) return;
                  setQuickProgress((p) => (p ? { ...p, isPaused: true, stage: "已暫停下載" } : p));
                  await pauseMediaDownload(quickTaskId);
                }}
                onResume={async () => {
                  if (!quickTaskId) return;
                  setQuickProgress((p) => (p ? { ...p, isPaused: false, stage: "繼續下載中..." } : p));
                  await resumeMediaDownload(quickTaskId);
                }}
                onCancel={async () => {
                  if (!quickTaskId) return;
                  const id = quickTaskId;
                  setQuickProgress(null);
                  setQuickDownloading(null);
                  setQuickTaskId(null);
                  await cancelMediaDownload(id);
                  showToast("已終止下載");
                }}
              />
            )}

            {health && !health.ffmpeg_available && (
              <p className="text-xs text-[var(--accent-amber)]">
                ⚠️ 未偵測到 FFmpeg（無法轉檔 MP3）：
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(true)}
                  className="underline ml-1 cursor-pointer font-medium"
                >
                  點我看安裝元件位置與一鍵指令
                </button>
              </p>
            )}

            {health && !health.gemini_key_configured && !apiKey && (
              <p className="text-xs text-[var(--accent-amber)]">
                提示：尚未偵測到本機 GEMINI_API_KEY，若要使用「解析觀念」或「轉成繁體中文」，請先點右上角「Key」設定並儲存。
              </p>
            )}
          </section>

          {/* Saved History Library */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--accent-blue)]" />
                已保存的知識解析檔（{historyItems.length}）
              </h2>
              <span className="text-xs text-[var(--text-muted)]">
                分析結果會自動保存於本機，點擊即可秒開，不用重新解析
              </span>
            </div>

            {historyItems.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] text-center text-xs text-[var(--text-muted)]">
                目前還沒有保存的解析檔。貼上 YouTube 網址並點擊「解析觀念」後，結果就會自動保存在這裡！
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {historyItems.map((item) => (
                  <div
                    key={item.video_id}
                    onClick={() => handleOpenSaved(item.video_id)}
                    className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-blue-500/60 cursor-pointer transition flex flex-col justify-between gap-2.5 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[var(--text-main)] line-clamp-2 group-hover:text-[var(--accent-blue)] transition">
                          {item.title}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => handleRequestDeleteSaved(e, item)}
                          title="刪除這筆紀錄"
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-rose)] hover:bg-rose-500/10 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {item.video_summary_one_liner}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                      <span>
                        {item.channel} · {LEVEL_LABELS[item.level] || item.level}
                      </span>
                      <span className="font-mono">
                        前置 {item.mastered_count}/{item.prereq_count} · {formatSavedDate(item.saved_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      ) : (
        <main
          className={`flex-1 flex flex-col gap-4 p-4 max-w-[1600px] w-full mx-auto ${
            isTheater ? "" : "lg:flex-row lg:items-start"
          }`}
        >
          {/* Video Column */}
          <div
            className={`w-full transition-all duration-200 ${
              isTheater
                ? ""
                : panelCollapsed
                  ? "lg:flex-1"
                  : "lg:w-[44%] lg:sticky lg:top-4"
            }`}
          >
            <VideoPlayer
              videoId={analysis.video_id}
              title={analysis.title}
              channel={analysis.channel}
              transcriptSource={analysis.transcript_source}
              seekTarget={seekTarget}
              ffmpegAvailable={health?.ffmpeg_available ?? true}
              isTheater={isTheater}
              apiKey={apiKey}
              onToggleTheater={() => setIsTheater((v) => !v)}
              onOpenInstallGuide={() => setShowInstallGuide(true)}
              onNotify={showToast}
            />
          </div>

          {/* Right Knowledge & Deep Dive Panel */}
          {!isTheater && panelCollapsed ? (
            <div className="lg:w-12 shrink-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] flex lg:flex-col items-center justify-between p-2 gap-3">
              <button
                type="button"
                onClick={() => setPanelCollapsed(false)}
                title="展開知識面板"
                className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-main)] cursor-pointer transition"
              >
                <PanelRightOpen className="w-4 h-4" />
              </button>
              <span className="text-xs text-[var(--text-muted)] font-medium tracking-widest lg:[writing-mode:vertical-rl]">
                知識與追問面板
              </span>
              <span className="text-[11px] font-mono text-[var(--accent-blue)]">
                {masteredIds.size}/{analysis.prerequisites.length}
              </span>
            </div>
          ) : (
            <div
              className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col overflow-hidden ${
                isTheater ? "w-full" : "lg:flex-1"
              }`}
            >
              <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)]">
                  <button
                    onClick={() => setViewMode("graph")}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium inline-flex items-center gap-1.5 cursor-pointer transition ${
                      viewMode === "graph"
                        ? "bg-blue-600 text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    觀念依賴圖
                  </button>
                  <button
                    onClick={() => setViewMode("layers")}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium inline-flex items-center gap-1.5 cursor-pointer transition ${
                      viewMode === "layers"
                        ? "bg-blue-600 text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    三層知識結構
                  </button>
                  <button
                    onClick={() => setViewMode("chat")}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium inline-flex items-center gap-1.5 cursor-pointer transition ${
                      viewMode === "chat"
                        ? "bg-blue-600 text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <MessageSquareText className="w-3.5 h-3.5" />
                    AI 深入追問
                    {chatMessages.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-[var(--accent-blue)]">
                        {chatMessages.length}
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-[var(--text-muted)]">
                    已掌握前置：
                    <span className="font-mono font-semibold text-[var(--text-main)] ml-1">
                      {masteredIds.size} / {analysis.prerequisites.length}
                    </span>
                  </div>
                  {!isTheater && (
                    <button
                      type="button"
                      onClick={() => setPanelCollapsed(true)}
                      title="收合到右側，放大影片觀看空間"
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] cursor-pointer transition"
                    >
                      <PanelRightClose className="w-3.5 h-3.5" />
                      收合
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                {viewMode === "graph" ? (
                  <DependencyGraph
                    data={analysis}
                    onAskInApp={handleAskInApp}
                    onOpenExternalGemini={handleOpenExternalGemini}
                  />
                ) : viewMode === "layers" ? (
                  <KnowledgeLayers
                    data={analysis}
                    masteredIds={masteredIds}
                    onToggleMastered={handleToggleMastered}
                    onSeekVideo={handleSeekVideo}
                    onAskInApp={handleAskInApp}
                    onOpenExternalGemini={handleOpenExternalGemini}
                  />
                ) : (
                  <DeepDiveChat
                    messages={chatMessages}
                    isLoading={chatLoading}
                    onSendMessage={handleAskInApp}
                    onClear={() => {
                      setChatMessages([]);
                      updateHistoryState(
                        analysis.video_id,
                        Array.from(masteredIds),
                        []
                      ).catch(() => {});
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Modals */}
      <ConfirmModal
        open={pendingDelete !== null}
        title="確認刪除保存的解析檔？"
        message={
          pendingDelete
            ? `確定要刪除「${pendingDelete.title}」的解析紀錄嗎？刪除後若要再看需要重新分析。`
            : ""
        }
        onConfirm={handleConfirmDeleteSaved}
        onCancel={() => setPendingDelete(null)}
      />

      <MissingComponentModal
        open={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        onRecheck={async () => {
          try {
            const h = await fetchHealth();
            setHealth(h);
            return h.ffmpeg_available;
          } catch {
            return false;
          }
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-medium shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
