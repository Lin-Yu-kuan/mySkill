from fastapi.testclient import TestClient
import pytest

from main import app
from schemas import GeminiKnowledgeOutput
from services import gemini_service
from services.youtube_service import extract_video_id, format_timestamp


client = TestClient(app)


@pytest.mark.parametrize(
    "url,expected",
    [
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://youtu.be/dQw4w9WgXcQ?t=42", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ],
)
def test_extract_video_id_valid(url: str, expected: str):
    assert extract_video_id(url) == expected


def test_extract_video_id_invalid():
    with pytest.raises(ValueError):
        extract_video_id("https://example.com/not-youtube")


def test_format_timestamp():
    assert format_timestamp(65) == "01:05"
    assert format_timestamp(3661) == "01:01:01"


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert isinstance(data["ffmpeg_available"], bool)
    assert isinstance(data["gemini_key_configured"], bool)


def test_knowledge_schema_validation():
    sample = {
        "video_summary_one_liner": "介紹 Attention 機制的核心原理。",
        "prerequisites": [
            {
                "id": "p1",
                "name": "向量與點積",
                "importance": "required",
                "why_needed": "計算字詞相似度",
                "plain_explanation": "把詞變成箭頭，方向越像分數越高。",
            }
        ],
        "core_concepts": [
            {
                "id": "c1",
                "title": "Self-Attention",
                "timestamp": "05:42",
                "seconds": 342,
                "summary": "讓句子裡的字彼此計算關聯度。",
                "example_in_video": "代名詞指代消歧",
                "depends_on": ["向量與點積"],
            }
        ],
        "extensions": [
            {
                "id": "e1",
                "type": "vertical",
                "title": "縮放因子 sqrt(d_k)",
                "description": "避免點積過大導致梯度消失。",
                "suggested_prompt": "請解釋為什麼要除以根號 d_k？",
            }
        ],
        "graph_edges": [
            {"source_id": "p1", "target_id": "c1"},
            {"source_id": "c1", "target_id": "e1"},
        ],
    }
    parsed = GeminiKnowledgeOutput.model_validate(sample)
    assert parsed.core_concepts[0].seconds == 342


def test_save_and_load_local_api_key(tmp_path, monkeypatch):
    cfg_dir = tmp_path / ".yt-sum"
    cfg_file = cfg_dir / "config.json"
    monkeypatch.setattr(gemini_service, "USER_CONFIG_DIR", cfg_dir)
    monkeypatch.setattr(gemini_service, "USER_CONFIG_FILE", cfg_file)

    res = client.post("/api/config/key", json={"api_key": "test-key-123"})
    assert res.status_code == 200
    assert res.json()["gemini_key_configured"] is True
    assert gemini_service.load_local_api_key() == "test-key-123"
