"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { ChatMessage } from "@/types/knowledge";

interface DeepDiveChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onClear: () => void;
}

export default function DeepDiveChat({
  messages,
  isLoading,
  onSendMessage,
  onClear,
}: DeepDiveChatProps) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    onSendMessage(trimmed);
  };

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col flex-1 min-h-[340px]">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-400" />
            AI 觀念深入追問區
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            點右側「深入 ✨」即時發問，或用「帶去 Gemini」開啟瀏覽器研究
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] inline-flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清除
          </button>
        )}
      </div>

      <div className="flex-1 p-3.5 space-y-3 overflow-y-auto max-h-[360px] text-xs leading-relaxed">
        {messages.length === 0 ? (
          <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
            我已拆解完這部影片的三層知識結構。點擊右側任一觀念的「深入 ✨」，或在下方直接輸入你的疑問！
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-500/10 border-blue-500/30 ml-6 text-[var(--text-main)]"
                  : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] mr-4 text-[var(--text-main)]"
              }`}
            >
              <div className="font-semibold mb-1 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                {m.role === "user" ? "你" : "Gemini 學習導師"}
              </div>
              {m.content}
            </div>
          ))
        )}
        {isLoading && (
          <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] mr-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            Gemini 正在思考解析中...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--border-subtle)] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="針對影片或某個前置觀念繼續追問..."
          className="flex-1 text-xs px-3 py-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-main)] focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="text-xs px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium inline-flex items-center gap-1 cursor-pointer transition"
        >
          <Send className="w-3.5 h-3.5" />
          送出
        </button>
      </form>
    </div>
  );
}
