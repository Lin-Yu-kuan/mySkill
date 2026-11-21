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
    <div className="flex flex-col h-full min-h-[460px]">
      <div className="pb-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[var(--accent-blue)]" />
            AI 觀念深入追問區
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            在「觀念依賴圖」或「三層知識結構」點選深入研究會自動帶入此處，也可直接提問
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] inline-flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清除對話
          </button>
        )}
      </div>

      <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[56vh] text-xs leading-relaxed">
        {messages.length === 0 ? (
          <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
            我已拆解完這部影片的三層知識結構。你可以切回前兩個分頁點擊任何觀念的「深入研究」，或在下方直接輸入你的疑問！
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-500/10 border-blue-500/30 ml-8 text-[var(--text-main)]"
                  : "bg-[var(--bg-page)] border-[var(--border-subtle)] mr-6 text-[var(--text-main)]"
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
          <div className="p-3.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] mr-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-blue)]" />
            Gemini 正在思考解析中...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="pt-3 border-t border-[var(--border-subtle)] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="針對影片或某個前置觀念繼續追問..."
          className="flex-1 text-xs px-3 py-2.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-main)] focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="text-xs px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium inline-flex items-center gap-1.5 cursor-pointer transition"
        >
          <Send className="w-3.5 h-3.5" />
          送出
        </button>
      </form>
    </div>
  );
}
