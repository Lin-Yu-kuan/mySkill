import { VideoAnalysisResponse } from "@/types/knowledge";

export function buildMarkdownNote(data: VideoAnalysisResponse): string {
  const lines: string[] = [
    `# ${data.title}`,
    "",
    `- **頻道**：${data.channel}`,
    `- **影片連結**：https://www.youtube.com/watch?v=${data.video_id}`,
    `- **一句話總結**：${data.video_summary_one_liner}`,
    `- **分析來源**：${data.transcript_source}`,
    "",
    "---",
    "",
    "## 第一層：前置必備觀念（Prerequisites）",
    "",
  ];

  for (const p of data.prerequisites) {
    const tag = p.importance === "required" ? "必備" : "建議了解";
    lines.push(`### [${tag}] ${p.name}`);
    lines.push(`- **為什麼需要**：${p.why_needed}`);
    lines.push(`- **1 分鐘白話科普**：${p.plain_explanation}`);
    lines.push("");
  }

  lines.push("---", "", "## 第二層：影片核心觀念（Core Concepts）", "");
  for (const c of data.core_concepts) {
    lines.push(`### ${c.title} (\`${c.timestamp}\`)`);
    lines.push(`- **核心拆解**：${c.summary}`);
    lines.push(`- **影片實例**：${c.example_in_video}`);
    if (c.depends_on.length > 0) {
      lines.push(`- **前置依賴**：${c.depends_on.join("、")}`);
    }
    lines.push("");
  }

  lines.push("---", "", "## 第三層：延伸與深入研究（Extensions & Deep Dive）", "");
  const vertical = data.extensions.filter((e) => e.type === "vertical");
  const horizontal = data.extensions.filter((e) => e.type === "horizontal");

  if (vertical.length > 0) {
    lines.push("### 縱向深究");
    for (const v of vertical) {
      lines.push(`- **${v.title}**：${v.description}`);
      lines.push(`  - *建議提問*：\`${v.suggested_prompt}\``);
    }
    lines.push("");
  }

  if (horizontal.length > 0) {
    lines.push("### 橫向延伸");
    for (const h of horizontal) {
      lines.push(`- **${h.title}**：${h.description}`);
      lines.push(`  - *建議提問*：\`${h.suggested_prompt}\``);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function buildExternalGeminiPrompt(
  videoTitle: string,
  videoId: string,
  topicTitle: string,
  question: string
): string {
  return [
    `我正在看這部 YouTube 影片：《${videoTitle}》（https://www.youtube.com/watch?v=${videoId}）。`,
    `目前我想針對其中的觀念「${topicTitle}」進行深入研究。`,
    "",
    `請用台灣繁體中文回答以下問題，並善用白話比喻、具體例子與延伸思考：`,
    question,
  ].join("\n");
}
