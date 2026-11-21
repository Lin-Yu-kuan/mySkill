import os
from pathlib import Path
from typing import Literal

from google import genai
from google.genai import types

from schemas import ChatMessage, GeminiKnowledgeOutput


LEVEL_INSTRUCTIONS = {
    "beginner": "使用者為【初學者】，請務必抓出所有專有名詞與基礎背景當作前置觀念，用生活化比喻做白話科普。",
    "intermediate": "使用者【有基礎/程式或領域常識】，請略過過於基礎的常識，聚焦在真正會卡住理解的核心前置概念與架構邏輯。",
    "advanced": "使用者為【進階領域專家】，前置觀念僅列高階關鍵依賴，重點放在深入原理、數學/系統權衡與前沿延伸研究。",
}

SYSTEM_PROMPT = """你是一位頂尖的知識架構師與學習導師，專門幫助學習者「真正看懂」YouTube 知識型與技術型影片。
請勿只做流水帳式的章節摘要！你的任務是分析整部影片的知識依賴脈絡，並嚴格使用【台灣繁體中文】輸出以下三層結構：

1. **前置觀念（Prerequisites）**：
   - 找出「若不先懂這些觀念，直接看這部影片會聽不懂或一知半解」的關鍵概念（3~5個）。
   - 說明「為什麼看這部片前需要它」，並提供「1分鐘白話科普（含比喻）」。
2. **影片核心觀念（Core Concepts）**：
   - 按時間軸拆解影片真正講述的知識骨幹（3~7個）。
   - 附上準確的 `[mm:ss]` 時間點與總秒數 `seconds`，以及影片中的實例。
   - `depends_on` 填入這個觀念依賴哪些前置觀念或前一個核心觀念的名稱。
3. **延伸與深入研究（Extensions & Deep Dive）**：
   - 分為 `vertical`（縱向深究：底層原理、常見迷思、極限條件）與 `horizontal`（橫向延伸：跨領域應用、下一步學習路線）。
   - 每個項目都要附帶一個具體、高品質的 `suggested_prompt`，方便使用者一鍵發問深入研究。
4. **觀念依賴連線（graph_edges）**：
   - 建立 `前置 id -> 核心 id` 與 `核心 id -> 延伸 id` 的合理依賴連線，方便視覺化呈現。
"""


def _get_client(api_key_override: str | None = None) -> genai.Client:
    api_key = (api_key_override or os.getenv("GEMINI_API_KEY") or "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError(
            "尚未設定 GEMINI_API_KEY。請在 backend/.env 填入你的 Google Gemini API Key，或在頁面上輸入。"
        )
    return genai.Client(api_key=api_key)


def _get_model_name() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"


def analyze_transcript_with_gemini(
    video_title: str,
    transcript_text: str,
    level: Literal["beginner", "intermediate", "advanced"],
    api_key_override: str | None = None,
) -> GeminiKnowledgeOutput:
    """使用逐字稿呼叫 Gemini 產出結構化三層知識"""
    client = _get_client(api_key_override)
    model_name = _get_model_name()

    # 避免極長影片超出單次輸入建議上限，保留前 120,000 字元
    trimmed_transcript = transcript_text[:120_000]
    prompt = (
        f"影片標題：{video_title}\n"
        f"學習者背景設定：{LEVEL_INSTRUCTIONS[level]}\n\n"
        f"以下是影片逐字稿（含時間戳記）：\n{trimmed_transcript}"
    )

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=GeminiKnowledgeOutput,
            temperature=0.3,
        ),
    )

    if response.parsed is not None:
        return response.parsed
    return GeminiKnowledgeOutput.model_validate_json(response.text)


def analyze_audio_with_gemini(
    video_title: str,
    audio_path: Path,
    level: Literal["beginner", "intermediate", "advanced"],
    api_key_override: str | None = None,
) -> GeminiKnowledgeOutput:
    """無字幕備援：上傳音訊檔給 Gemini 進行多模態分析"""
    client = _get_client(api_key_override)
    model_name = _get_model_name()

    uploaded = client.files.upload(file=str(audio_path))
    try:
        prompt = (
            f"影片標題：{video_title}\n"
            f"學習者背景設定：{LEVEL_INSTRUCTIONS[level]}\n"
            "這部影片沒有提供文字字幕，請直接聆聽音訊內容，推估對應的時間點（秒數），"
            "並嚴格按照系統指令產出三層知識結構。"
        )
        response = client.models.generate_content(
            model=model_name,
            contents=[uploaded, prompt],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=GeminiKnowledgeOutput,
                temperature=0.3,
            ),
        )
        if response.parsed is not None:
            return response.parsed
        return GeminiKnowledgeOutput.model_validate_json(response.text)
    finally:
        try:
            client.files.delete(name=uploaded.name)
        except Exception:
            pass


def chat_follow_up(
    video_title: str,
    video_context: str,
    history: list[ChatMessage],
    question: str,
    api_key_override: str | None = None,
) -> str:
    """處理 APP 內建深入追問對話"""
    client = _get_client(api_key_override)
    model_name = _get_model_name()

    system = (
        "你是一位親切且專業的學習導師，請使用台灣繁體中文回答使用者針對這部影片觀念的深入提問。"
        "回答請清晰有條理，善用白話比喻與具體例子，避免空泛。\n\n"
        f"目前研究的影片：{video_title}\n"
        f"影片脈絡參考：\n{video_context[:30_000]}"
    )

    contents: list[types.Content] = []
    for msg in history[-10:]:
        role = "user" if msg.role == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.content)]))
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=question)]))

    response = client.models.generate_content(
        model=model_name,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.5,
        ),
    )
    return response.text or "抱歉，暫時無法產生回覆，請再試一次。"
