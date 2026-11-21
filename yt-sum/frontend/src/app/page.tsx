"use client";

import { useEffect, useState } from "react";
import {
  FileDown,
  GitBranch,
  KeyRound,
  Layers,
  Loader2,
  Sparkles,
  Youtube,
} from "lucide-react";
import DeepDiveChat from "@/components/DeepDiveChat";
import DependencyGraph from "@/components/DependencyGraph";
import KnowledgeLayers from "@/components/KnowledgeLayers";
import VideoPlayer from "@/components/VideoPlayer";
import { analyzeVideo, fetchHealth, sendChatFollowUp } from "@/lib/api";
import { buildExternalGeminiPrompt, buildMarkdownNote } from "@/lib/exportMarkdown";
import {
  ChatMessage,
  HealthStatus,
  UserLevel,
  VideoAnalysisResponse,
} from "@/types/knowledge";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [level, setLevel] = useState<UserLevel>("intermediate");
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysisResponse | null>(null);

  const [viewMode, setViewMode] = useState<"layers" | "graph">("layers");
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [seekTarget, setSeekTarget] = useState<{ seconds: number; nonce: number } | null>(
    null
  );

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem("yt_sum_gemini_key");
    if (savedKey) setApiKey(savedKey);
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const handleSaveApiKey = (val: string) => {
    setApiKey(val);
    if (val.trim()) localStorage.setItem("yt_sum_gemini_key", val.trim());
    else localStorage.removeItem("yt_sum_gemini_key");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失敗，請稍後再試");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleMastered = (id: string) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSeekVideo = (seconds: number, label: string) => {
    setSeekTarget({ seconds, nonce: Date.now() });
    showToast(`影片已跳轉至 ${label}`);
  };

  const handleAskInApp = async (prompt: string) => {
    if (!analysis || chatLoading) return;
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
      setChatMessages([...nextHistory, { role: "assistant", content: answer }]);
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
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${analysis.video_id}-knowledge-notes.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    showToast("已匯出 Markdown 學習筆記！");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-3">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              YT
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight">YT-Sum 知識導航儀</h1>
              <p className="text-xs text-[var(--text-muted)]">
                前置掃雷 · 核心拆解 · 延伸研究
              </p>
            </div>
          </div>

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
              onClick={() => setShowKeyInput((v) => !v)}
              title="設定 Gemini API Key（若後端 .env 已設定可略過）"
              className={`text-xs px-2.5 py-1.5 rounded-lg border inline-flex items-center gap-1 cursor-pointer transition ${
                apiKey || health?.gemini_key_configured
                  ? "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  : "border-amber-500/60 text-amber-300 bg-amber-500/10"
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
          <div className="max-w-[1440px] mx-auto mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[var(--text-muted)]">
              自備 Gemini API Key（僅存於你的瀏覽器 LocalStorage）：
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => handleSaveApiKey(e.target.value)}
              placeholder={
                health?.gemini_key_configured
                  ? "後端 .env 已設定 Key（若要覆寫可填於此）"
                  : "請貼上 AIzaSy... 開頭的 Gemini API Key"
              }
              className="flex-1 max-w-md px-3 py-1.5 rounded-md bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-main)]"
            />
            <button
              onClick={() => setShowKeyInput(false)}
              className="px-2.5 py-1.5 rounded-md bg-[var(--bg-elevated)] hover:opacity-80 cursor-pointer"
            >
              完成
            </button>
          </div>
        )}
      </header>

      {/* Error banner */}
      {error && (
        <div className="max-w-[1440px] w-full mx-auto px-4 pt-4">
          <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      {!analysis ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full text-center space-y-4 p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto">
              <Youtube className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold">看懂每一部知識型 YouTube 影片</h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              貼上任何 YouTube 連結，系統會先幫你抓出<strong>前置必備觀念（沒先懂會看不懂的地方）</strong>，再拆解<strong>核心知識與時間軸</strong>，最後提供<strong>縱向深究與橫向延伸</strong>路線。
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2 text-xs text-[var(--text-muted)]">
              <div className="p-2.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)]">
                1. 前置掃雷科普
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)]">
                2. 核心時間軸跳轉
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)]">
                3. 延伸研究 + MP4/MP3
              </div>
            </div>
            {health && !health.gemini_key_configured && !apiKey && (
              <p className="text-xs text-amber-300 pt-1">
                提示：尚未偵測到後端 GEMINI_API_KEY，請先點擊右上角「Key」填入或在 backend/.env 設定。
              </p>
            )}
          </div>
        </main>
      ) : (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 max-w-[1440px] w-full mx-auto">
          {/* Left Column: Player + In-App Deep Dive Chat */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <VideoPlayer
              videoId={analysis.video_id}
              title={analysis.title}
              channel={analysis.channel}
              transcriptSource={analysis.transcript_source}
              seekTarget={seekTarget}
              ffmpegAvailable={health?.ffmpeg_available ?? true}
              onNotify={showToast}
            />

            <DeepDiveChat
              messages={chatMessages}
              isLoading={chatLoading}
              onSendMessage={handleAskInApp}
              onClear={() => setChatMessages([])}
            />
          </div>

          {/* Right Column: 3-Layer Knowledge / Graph */}
          <div className="lg:col-span-7 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)]">
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
              </div>

              <div className="text-xs text-[var(--text-muted)]">
                已掌握前置：
                <span className="font-mono font-semibold text-[var(--text-main)] ml-1">
                  {masteredIds.size} / {analysis.prerequisites.length}
                </span>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {viewMode === "layers" ? (
                <KnowledgeLayers
                  data={analysis}
                  masteredIds={masteredIds}
                  onToggleMastered={handleToggleMastered}
                  onSeekVideo={handleSeekVideo}
                  onAskInApp={handleAskInApp}
                  onOpenExternalGemini={handleOpenExternalGemini}
                />
              ) : (
                <DependencyGraph
                  data={analysis}
                  onAskInApp={handleAskInApp}
                  onOpenExternalGemini={handleOpenExternalGemini}
                />
              )}
            </div>
          </div>
        </main>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-medium shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
