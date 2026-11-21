from typing import Literal
from pydantic import BaseModel, Field


class PrerequisiteItem(BaseModel):
    """前置觀念項目：看懂這部影片前必須先具備的基礎概念"""
    id: str = Field(description="唯一識別碼，例如 p1, p2")
    name: str = Field(description="前置觀念名稱（繁體中文，可附英文專有名詞）")
    importance: Literal["required", "recommended"] = Field(
        description="必要程度：required 為必備，recommended 為建議了解"
    )
    why_needed: str = Field(description="為什麼看這部影片前需要這個觀念（1~2句）")
    plain_explanation: str = Field(description="1 分鐘白話科普解說（含生活化比喻，2~4句）")


class CoreConceptItem(BaseModel):
    """影片核心觀念項目：拆解影片實際講述的知識骨幹"""
    id: str = Field(description="唯一識別碼，例如 c1, c2")
    title: str = Field(description="核心觀念標題")
    timestamp: str = Field(description="影片對應時間點，格式 mm:ss 或 hh:mm:ss")
    seconds: int = Field(ge=0, description="對應時間點的總秒數，供播放器跳轉")
    summary: str = Field(description="核心邏輯與觀念拆解（2~4句）")
    example_in_video: str = Field(description="影片中講者舉的例子或補充說明")
    depends_on: list[str] = Field(
        default_factory=list,
        description="此觀念依賴哪些前置觀念或前一個核心觀念的名稱",
    )


class ExtensionItem(BaseModel):
    """延伸與深入研究項目"""
    id: str = Field(description="唯一識別碼，例如 e1, e2")
    type: Literal["vertical", "horizontal"] = Field(
        description="vertical 為縱向深究（底層原理/迷思），horizontal 為橫向延伸（應用/跨領域）"
    )
    title: str = Field(description="延伸或深究主題標題")
    description: str = Field(description="簡短說明為什麼值得深入或如何延伸（1~2句）")
    suggested_prompt: str = Field(
        description="可直接送給 AI 進行深入探討的具體提問提示詞"
    )


class GraphEdge(BaseModel):
    """知識依賴圖連線"""
    source_id: str = Field(description="來源節點 id（例如 p1 或 c1）")
    target_id: str = Field(description="目標節點 id（例如 c1 或 e1）")


class GeminiKnowledgeOutput(BaseModel):
    """Gemini 結構化輸出格式"""
    video_summary_one_liner: str = Field(description="一句話總結整部影片的核心價值")
    prerequisites: list[PrerequisiteItem] = Field(description="3~5 個最關鍵的前置觀念")
    core_concepts: list[CoreConceptItem] = Field(description="3~7 個影片核心觀念（按時間軸排列）")
    extensions: list[ExtensionItem] = Field(description="4~6 個縱向深究與橫向延伸方向")
    graph_edges: list[GraphEdge] = Field(description="前置 -> 核心 -> 延伸 的依賴連線")


class AnalyzeRequest(BaseModel):
    url: str = Field(description="YouTube 影片網址")
    level: Literal["beginner", "intermediate", "advanced"] = Field(
        default="intermediate",
        description="使用者背景程度",
    )
    api_key: str | None = Field(
        default=None,
        description="可選：前端傳入的自備 Gemini API Key，未傳則使用後端 .env",
    )


class VideoAnalysisResponse(BaseModel):
    video_id: str
    title: str
    channel: str
    duration_seconds: int
    transcript_source: str
    level: Literal["beginner", "intermediate", "advanced"]
    video_summary_one_liner: str
    prerequisites: list[PrerequisiteItem]
    core_concepts: list[CoreConceptItem]
    extensions: list[ExtensionItem]
    graph_edges: list[GraphEdge]
    transcript_excerpt: str = Field(description="供後續追問對話使用的影片脈絡摘要")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    video_title: str
    video_context: str
    history: list[ChatMessage] = Field(default_factory=list)
    question: str
    api_key: str | None = None


class ChatResponse(BaseModel):
    answer: str


class DownloadRequest(BaseModel):
    url: str
    format: Literal["mp4", "mp3"]
