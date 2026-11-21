"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  Layers,
  Microscope,
  Play,
  Sparkles,
} from "lucide-react";
import { VideoAnalysisResponse } from "@/types/knowledge";

interface KnowledgeLayersProps {
  data: VideoAnalysisResponse;
  masteredIds: Set<string>;
  onToggleMastered: (id: string) => void;
  onSeekVideo: (seconds: number, label: string) => void;
  onAskInApp: (prompt: string) => void;
  onOpenExternalGemini: (topicTitle: string, prompt: string) => void;
}

type LayerKey = "layer1" | "layer2" | "layer3";

export default function KnowledgeLayers({
  data,
  masteredIds,
  onToggleMastered,
  onSeekVideo,
  onAskInApp,
  onOpenExternalGemini,
}: KnowledgeLayersProps) {
  const [expandedPrereqs, setExpandedPrereqs] = useState<Set<string>>(() => {
    const first = data.prerequisites[0]?.id;
    return first ? new Set([first]) : new Set();
  });

  const [collapsedLayers, setCollapsedLayers] = useState<Set<LayerKey>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedPrereqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLayer = (layer: LayerKey) => {
    setCollapsedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  };

  const verticalExts = data.extensions.filter((e) => e.type === "vertical");
  const horizontalExts = data.extensions.filter((e) => e.type === "horizontal");

  return (
    <div className="space-y-5">
      {/* One-liner summary banner */}
      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs leading-relaxed">
        <span className="font-semibold text-[var(--accent-blue)]">一句話核心總結：</span>
        <span className="text-[var(--text-main)]">{data.video_summary_one_liner}</span>
      </div>

      {/* Layer 1: Prerequisites */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-3.5">
        <button
          type="button"
          onClick={() => toggleLayer("layer1")}
          className="w-full flex items-center justify-between gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/15 text-[var(--accent-rose)] border border-rose-500/30">
              第一層 · 掃雷區
            </span>
            <h3 className="text-sm font-semibold text-left">
              前置必備觀念（{data.prerequisites.length}）
            </h3>
          </div>
          <span className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1">
            {collapsedLayers.has("layer1") ? (
              <>
                展開 <ChevronDown className="w-4 h-4" />
              </>
            ) : (
              <>
                收合 <ChevronUp className="w-4 h-4" />
              </>
            )}
          </span>
        </button>

        {!collapsedLayers.has("layer1") && (
          <div className="space-y-2.5 mt-3">
            {data.prerequisites.map((p) => {
              const isMastered = masteredIds.has(p.id);
              const isExpanded = expandedPrereqs.has(p.id) && !isMastered;
              return (
                <div
                  key={p.id}
                  className={`rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] transition ${
                    isMastered ? "opacity-50" : ""
                  }`}
                >
                  <div className="p-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(p.id)}
                      className="flex items-center gap-2.5 flex-1 text-left cursor-pointer"
                    >
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                          p.importance === "required"
                            ? "bg-rose-500/15 text-[var(--accent-rose)]"
                            : "bg-amber-500/15 text-[var(--accent-amber)]"
                        }`}
                      >
                        {p.importance === "required" ? "必備" : "建議"}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-main)]">{p.name}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                      )}
                    </button>

                    <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={isMastered}
                        onChange={() => onToggleMastered(p.id)}
                        className="accent-blue-500"
                      />
                      我已掌握
                    </label>
                  </div>

                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-2.5 border-t border-[var(--border-subtle)] text-xs space-y-2 leading-relaxed">
                      <p>
                        <strong className="text-[var(--text-main)]">為什麼看這部片需要它：</strong>
                        <span className="text-[var(--text-muted)]">{p.why_needed}</span>
                      </p>
                      <p>
                        <strong className="text-[var(--text-main)]">1 分鐘白話科普：</strong>
                        <span className="text-[var(--text-muted)]">{p.plain_explanation}</span>
                      </p>
                      <div className="pt-1 flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() =>
                            onOpenExternalGemini(
                              p.name,
                              `請針對前置觀念「${p.name}」用白話文搭配生活例子深入解釋，讓我能順利看懂這部影片。`
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          帶去 Gemini
                        </button>
                        <button
                          onClick={() =>
                            onAskInApp(
                              `請用初學者也能秒懂的方式，舉一個具體例子解釋前置觀念「${p.name}」，並說明它如何銜接影片內容。`
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-blue-500/15 border border-blue-500/35 text-[var(--accent-blue)] hover:bg-blue-500/25 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          深入研究
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Layer 2: Core Concepts */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-3.5">
        <button
          type="button"
          onClick={() => toggleLayer("layer2")}
          className="w-full flex items-center justify-between gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/15 text-[var(--accent-blue)] border border-blue-500/30 inline-flex items-center gap-1">
              <Layers className="w-3 h-3" />
              第二層 · 知識骨幹
            </span>
            <h3 className="text-sm font-semibold text-left">
              影片核心觀念拆解（{data.core_concepts.length}）
            </h3>
          </div>
          <span className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1">
            {collapsedLayers.has("layer2") ? (
              <>
                展開 <ChevronDown className="w-4 h-4" />
              </>
            ) : (
              <>
                收合 <ChevronUp className="w-4 h-4" />
              </>
            )}
          </span>
        </button>

        {!collapsedLayers.has("layer2") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {data.core_concepts.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3.5 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-[var(--text-main)] leading-snug">
                      {c.title}
                    </h4>
                    <button
                      onClick={() => onSeekVideo(c.seconds, c.timestamp)}
                      className="shrink-0 inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-blue-500/15 text-[var(--accent-blue)] hover:bg-blue-500/25 cursor-pointer transition"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {c.timestamp}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{c.summary}</p>
                  {c.example_in_video && (
                    <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-card)] px-2.5 py-1.5 rounded border border-[var(--border-subtle)]">
                      <span className="text-[var(--text-main)] font-medium">影片實例：</span>
                      {c.example_in_video}
                    </p>
                  )}
                </div>

                {c.depends_on.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                    前置依賴：{c.depends_on.join("、")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Layer 3: Extensions & Deep Dive */}
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-3.5">
        <button
          type="button"
          onClick={() => toggleLayer("layer3")}
          className="w-full flex items-center justify-between gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-[var(--accent-emerald)] border border-emerald-500/30">
              第三層 · 探索延伸
            </span>
            <h3 className="text-sm font-semibold text-left">
              觀念延伸與深入研究方向（{data.extensions.length}）
            </h3>
          </div>
          <span className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1">
            {collapsedLayers.has("layer3") ? (
              <>
                展開 <ChevronDown className="w-4 h-4" />
              </>
            ) : (
              <>
                收合 <ChevronUp className="w-4 h-4" />
              </>
            )}
          </span>
        </button>

        {!collapsedLayers.has("layer3") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {/* Vertical Deep Dive */}
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3.5 space-y-2.5">
              <div className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                <Microscope className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                縱向深究（針對既有觀念挖深）
              </div>
              <div className="space-y-2">
                {verticalExts.map((ext) => (
                  <div
                    key={ext.id}
                    className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-2"
                  >
                    <div className="text-xs font-semibold text-[var(--text-main)]">{ext.title}</div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{ext.description}</p>
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => onOpenExternalGemini(ext.title, ext.suggested_prompt)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        帶去 Gemini
                      </button>
                      <button
                        onClick={() => onAskInApp(ext.suggested_prompt)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple-500/15 text-[var(--accent-purple)] hover:bg-purple-500/25 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        深入研究
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Horizontal Extension */}
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3.5 space-y-2.5">
              <div className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                橫向延伸（應用與跨領域連結）
              </div>
              <div className="space-y-2">
                {horizontalExts.map((ext) => (
                  <div
                    key={ext.id}
                    className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-2"
                  >
                    <div className="text-xs font-semibold text-[var(--text-main)]">{ext.title}</div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{ext.description}</p>
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => onOpenExternalGemini(ext.title, ext.suggested_prompt)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        帶去 Gemini
                      </button>
                      <button
                        onClick={() => onAskInApp(ext.suggested_prompt)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-emerald-500/15 text-[var(--accent-emerald)] hover:bg-emerald-500/25 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        延伸探索
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
