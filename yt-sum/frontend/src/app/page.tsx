"use client";

import { useEffect, useState } from "react";
import {
  FileDown,
  GitBranch,
  KeyRound,
  Layers,
  Loader2,
  MessageSquareText,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Sun,
  Youtube,
} from "lucide-react";
import DeepDiveChat from "@/components/DeepDiveChat";
import DependencyGraph from "@/components/DependencyGraph";
import KnowledgeLayers from "@/components/KnowledgeLayers";
import VideoPlayer from "@/components/VideoPlayer";
import {
  analyzeVideo,
  fetchHealth,
  saveApiKeyToLocal,
  sendChatFollowUp,
} from "@/lib/api";
import { buildExternalGeminiPrompt, buildMarkdownNote } from "@/lib/exportMarkdown";
import {
  ChatMessage,
  HealthStatus,
  UserLevel,
  VideoAnalysisResponse,
} from "@/types/knowledge";

type RightTab = "graph" | "layers" | "chat";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [level, setLevel] = useState<UserLevel>("intermediate");
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isTheater, setIsTheater] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const [health, setHealth] = useState<HealthStatus | null>(null);
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

  useEffect(() => {
    const savedKey = localStorage.getItem("yt_sum_gemini_key");
    if (savedKey) setApiKey(savedKey);

    const savedTheme = localStorage.getItem("yt_sum_theme");
    if (savedTheme === "light") {
      setTheme("light");
      document.documentElement.classList.add("light");
    }

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

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    localStorage.setItem("yt_sum_theme", next);
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
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
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
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full text-center space-y-4 p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-[var(--accent-blue)] flex items-center justify-center mx-auto">
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
              <p className="text-xs text-[var(--accent-amber)] pt-1">
                提示：尚未偵測到本機 GEMINI_API_KEY，請先點擊右上角「Key」填入並儲存。
              </p>
            )}
          </div>
        </main>
      ) : (
        <main
          className={`flex-1 flex flex-col gap-4 p-4 max-w-[1600px] w-full mx-auto ${
            isTheater ? "" : "lg:flex-row lg:items-start"
          }`}
        >
          {/* Video Column (expands automatically when theater mode or right panel collapsed) */}
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
              onToggleTheater={() => setIsTheater((v) => !v)}
              onNotify={showToast}
            />
          </div>

          {/* Right Knowledge & Deep Dive Panel (collapsible to right edge in standard mode) */}
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
              <span
                className="text-xs text-[var(--text-muted)] font-medium tracking-widest lg:[writing-mode:vertical-rl]"
              >
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
              {/* Panel Header: Graph on Left, 3-Layer on Right, Chat 3rd + Collapse button */}
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
                    onClear={() => setChatMessages([])}
                  />
                )}
              </div>
            </div>
          )}
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
