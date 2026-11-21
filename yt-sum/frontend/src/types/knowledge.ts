export type UserLevel = "beginner" | "intermediate" | "advanced";

export interface PrerequisiteItem {
  id: string;
  name: string;
  importance: "required" | "recommended";
  why_needed: string;
  plain_explanation: string;
}

export interface CoreConceptItem {
  id: string;
  title: string;
  timestamp: string;
  seconds: number;
  summary: string;
  example_in_video: string;
  depends_on: string[];
}

export interface ExtensionItem {
  id: string;
  type: "vertical" | "horizontal";
  title: string;
  description: string;
  suggested_prompt: string;
}

export interface GraphEdge {
  source_id: string;
  target_id: string;
}

export interface VideoAnalysisResponse {
  video_id: string;
  title: string;
  channel: string;
  duration_seconds: number;
  transcript_source: string;
  level: UserLevel;
  video_summary_one_liner: string;
  prerequisites: PrerequisiteItem[];
  core_concepts: CoreConceptItem[];
  extensions: ExtensionItem[];
  graph_edges: GraphEdge[];
  transcript_excerpt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface HealthStatus {
  status: string;
  ffmpeg_available: boolean;
  gemini_key_configured: boolean;
  model: string;
}
