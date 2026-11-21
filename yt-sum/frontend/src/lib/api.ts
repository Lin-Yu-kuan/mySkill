import {
  ChatMessage,
  HealthStatus,
  HistorySummaryItem,
  SavedHistoryRecord,
  UserLevel,
  VideoAnalysisResponse,
} from "@/types/knowledge";

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_BASE) return process.env.NEXT_PUBLIC_API_BASE;
  if (typeof window !== "undefined" && window.location.port === "3000") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "";
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    // ignore JSON parse failure
  }
  return `請求失敗 (HTTP ${res.status})`;
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${getApiBase()}/api/health`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function saveApiKeyToLocal(apiKey: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/config/key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function analyzeVideo(params: {
  url: string;
  level: UserLevel;
  apiKey?: string;
}): Promise<VideoAnalysisResponse> {
  const res = await fetch(`${getApiBase()}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: params.url,
      level: params.level,
      api_key: params.apiKey?.trim() || null,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function sendChatFollowUp(params: {
  videoTitle: string;
  videoContext: string;
  history: ChatMessage[];
  question: string;
  apiKey?: string;
}): Promise<string> {
  const res = await fetch(`${getApiBase()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video_title: params.videoTitle,
      video_context: params.videoContext,
      history: params.history,
      question: params.question,
      api_key: params.apiKey?.trim() || null,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.answer as string;
}

export async function downloadMediaFile(
  url: string,
  format: "mp4" | "mp3"
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${getApiBase()}/api/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, format }),
  });
  if (!res.ok) throw new Error(await parseError(res));

  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i);
  const filename = match ? decodeURIComponent(match[1]) : `video.${format}`;
  const blob = await res.blob();
  return { blob, filename };
}

export async function downloadTranscriptFile(params: {
  url: string;
  format: "txt" | "srt";
  translateToZhTw: boolean;
  apiKey?: string;
}): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${getApiBase()}/api/transcript/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: params.url,
      format: params.format,
      translate_to_zh_tw: params.translateToZhTw,
      api_key: params.apiKey?.trim() || null,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));

  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i);
  const filename = match ? decodeURIComponent(match[1]) : `transcript.${params.format}`;
  const blob = await res.blob();
  return { blob, filename };
}

export async function fetchHistoryList(): Promise<HistorySummaryItem[]> {
  const res = await fetch(`${getApiBase()}/api/history`);
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return (data.items || []) as HistorySummaryItem[];
}

export async function loadHistoryItem(videoId: string): Promise<SavedHistoryRecord> {
  const res = await fetch(`${getApiBase()}/api/history/${videoId}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateHistoryState(
  videoId: string,
  masteredIds: string[],
  chatMessages: ChatMessage[]
): Promise<void> {
  await fetch(`${getApiBase()}/api/history/${videoId}/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mastered_ids: masteredIds,
      chat_messages: chatMessages,
    }),
  });
}

export async function deleteHistoryItem(videoId: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/history/${videoId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await parseError(res));
}
