import json
import re
from datetime import datetime, timezone
from pathlib import Path


HISTORY_DIR = Path.home() / ".yt-sum" / "history"


def _safe_video_path(video_id: str) -> Path:
    if not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
        raise ValueError("無效的 Video ID")
    return HISTORY_DIR / f"{video_id}.json"


def save_history(
    analysis: dict,
    mastered_ids: list[str] | None = None,
    chat_messages: list[dict] | None = None,
) -> dict:
    """將影片分析結果與學習進度儲存於本機 (~/.yt-sum/history/)"""
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    path = _safe_video_path(analysis["video_id"])

    existing_mastered: list[str] = []
    existing_chat: list[dict] = []
    if path.exists():
        try:
            old = json.loads(path.read_text(encoding="utf-8"))
            existing_mastered = old.get("mastered_ids", [])
            existing_chat = old.get("chat_messages", [])
        except Exception:
            pass

    record = {
        "analysis": analysis,
        "mastered_ids": mastered_ids if mastered_ids is not None else existing_mastered,
        "chat_messages": chat_messages if chat_messages is not None else existing_chat,
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }
    path.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    return record


def list_history() -> list[dict]:
    """列出所有已保存的解析紀錄摘要（依時間由新到舊）"""
    if not HISTORY_DIR.exists():
        return []
    items: list[dict] = []
    for file_path in HISTORY_DIR.glob("*.json"):
        try:
            data = json.loads(file_path.read_text(encoding="utf-8"))
            a = data.get("analysis", {})
            items.append(
                {
                    "video_id": a.get("video_id", file_path.stem),
                    "title": a.get("title", "未命名影片"),
                    "channel": a.get("channel", ""),
                    "level": a.get("level", "intermediate"),
                    "video_summary_one_liner": a.get("video_summary_one_liner", ""),
                    "saved_at": data.get("saved_at", ""),
                    "mastered_count": len(data.get("mastered_ids", [])),
                    "prereq_count": len(a.get("prerequisites", [])),
                }
            )
        except Exception:
            continue
    items.sort(key=lambda x: x.get("saved_at", ""), reverse=True)
    return items


def get_history(video_id: str) -> dict | None:
    path = _safe_video_path(video_id)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def update_history_state(
    video_id: str,
    mastered_ids: list[str],
    chat_messages: list[dict],
) -> bool:
    path = _safe_video_path(video_id)
    if not path.exists():
        return False
    data = json.loads(path.read_text(encoding="utf-8"))
    data["mastered_ids"] = mastered_ids
    data["chat_messages"] = chat_messages
    data["saved_at"] = datetime.now(timezone.utc).isoformat()
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return True


def delete_history(video_id: str) -> bool:
    path = _safe_video_path(video_id)
    if not path.exists():
        return False
    path.unlink()
    return True
