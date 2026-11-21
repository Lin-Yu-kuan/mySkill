"use client";

import { useMemo, useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { VideoAnalysisResponse } from "@/types/knowledge";

interface DependencyGraphProps {
  data: VideoAnalysisResponse;
  onAskInApp: (prompt: string) => void;
  onOpenExternalGemini: (topicTitle: string, prompt: string) => void;
}

interface SelectedNode {
  id: string;
  title: string;
  desc: string;
  prompt: string;
}

export default function DependencyGraph({
  data,
  onAskInApp,
  onOpenExternalGemini,
}: DependencyGraphProps) {
  const [selected, setSelected] = useState<SelectedNode | null>(null);

  const connectedIds = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>([selected.id]);
    for (const edge of data.graph_edges) {
      if (edge.source_id === selected.id) set.add(edge.target_id);
      if (edge.target_id === selected.id) set.add(edge.source_id);
    }
    return set;
  }, [selected, data.graph_edges]);

  const isHighlighted = (id: string) => !selected || connectedIds.has(id);

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--text-muted)]">
        點選任一節點，會自動高亮與它有依賴關係的上下游知識，並可於下方直接深入研究：
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)]">
        {/* Column 1: Prerequisites */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-center text-rose-300 mb-2">
            1. 前置觀念
          </div>
          {data.prerequisites.map((p) => (
            <button
              key={p.id}
              onClick={() =>
                setSelected({
                  id: p.id,
                  title: p.name,
                  desc: `${p.why_needed}｜${p.plain_explanation}`,
                  prompt: `請針對前置觀念「${p.name}」用白話文搭配例子詳細說明。`,
                })
              }
              className={`w-full p-2.5 rounded-lg border text-xs font-medium text-left transition cursor-pointer ${
                selected?.id === p.id
                  ? "border-blue-400 bg-blue-500/15"
                  : "border-rose-500/30 bg-[var(--bg-card)] hover:border-blue-400/60"
              } ${isHighlighted(p.id) ? "opacity-100" : "opacity-35"}`}
            >
              {p.importance === "required" ? "● " : "○ "}
              {p.name}
            </button>
          ))}
        </div>

        {/* Column 2: Core Concepts */}
        <div className="space-y-2 border-y md:border-y-0 md:border-x border-[var(--border-subtle)] py-3 md:py-0 md:px-4">
          <div className="text-xs font-semibold text-center text-blue-300 mb-2">
            2. 影片核心 ➔
          </div>
          {data.core_concepts.map((c) => (
            <button
              key={c.id}
              onClick={() =>
                setSelected({
                  id: c.id,
                  title: `${c.title} (${c.timestamp})`,
                  desc: c.summary,
                  prompt: `請深入解析影片中的核心觀念「${c.title}」：${c.summary}`,
                })
              }
              className={`w-full p-2.5 rounded-lg border text-xs font-medium text-left transition cursor-pointer ${
                selected?.id === c.id
                  ? "border-blue-400 bg-blue-500/25"
                  : "border-blue-500/40 bg-blue-500/10 hover:border-blue-400"
              } ${isHighlighted(c.id) ? "opacity-100" : "opacity-35"}`}
            >
              ◆ {c.title}
            </button>
          ))}
        </div>

        {/* Column 3: Extensions */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-center text-emerald-300 mb-2">
            3. 延伸探索 ➔
          </div>
          {data.extensions.map((e) => (
            <button
              key={e.id}
              onClick={() =>
                setSelected({
                  id: e.id,
                  title: e.title,
                  desc: e.description,
                  prompt: e.suggested_prompt,
                })
              }
              className={`w-full p-2.5 rounded-lg border text-xs font-medium text-left transition cursor-pointer ${
                selected?.id === e.id
                  ? "border-blue-400 bg-blue-500/15"
                  : "border-emerald-500/30 bg-[var(--bg-card)] hover:border-blue-400/60"
              } ${isHighlighted(e.id) ? "opacity-100" : "opacity-35"}`}
            >
              ✦ {e.title}
            </button>
          ))}
        </div>
      </div>

      {/* Node Inspector */}
      <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-[220px]">
          <div className="text-sm font-semibold text-[var(--text-main)]">
            {selected ? selected.title : "點選上方任一節點查看知識關聯"}
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {selected
              ? selected.desc
              : "系統會自動標記該節點的前置依賴與後續延伸主題。"}
          </p>
        </div>

        {selected && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenExternalGemini(selected.title, selected.prompt)}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              帶去 Gemini
            </button>
            <button
              onClick={() => onAskInApp(selected.prompt)}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              左側深入研究
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
