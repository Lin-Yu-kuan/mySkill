import {
  ChatMessage,
  HealthStatus,
  UserLevel,
  VideoAnalysisResponse,
} from "@/types/knowledge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function analyzeVideo(params: {
  url: string;
  level: UserLevel;
  apiKey?: string;
}): Promise<VideoAnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
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
  const res = await fetch(`${API_BASE}/api/chat`, {
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
  const res = await fetch(`${API_BASE}/api/download`, {
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
