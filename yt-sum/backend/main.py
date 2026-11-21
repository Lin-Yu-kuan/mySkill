import os
import re
import tempfile
from pathlib import Path
from typing import Literal
from urllib.parse import quote

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from schemas import (
    AnalyzeRequest,
    ChatRequest,
    ChatResponse,
    DownloadRequest,
    VideoAnalysisResponse,
)
from services.gemini_service import (
    analyze_audio_with_gemini,
    analyze_transcript_with_gemini,
    chat_follow_up,
    has_configured_api_key,
    save_local_api_key,
    translate_transcript_to_zh_tw,
)
from services.history_service import (
    delete_history,
    get_history,
    list_history,
    save_history,
    update_history_state,
)
from services.youtube_service import (
    download_media,
    extract_audio_for_gemini,
    extract_video_id,
    format_transcript_as_srt,
    get_transcript,
    get_video_metadata,
    has_ffmpeg,
)

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DOWNLOADS_DIR = BASE_DIR / "downloads"

app = FastAPI(title="YT-Sum Knowledge Navigator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


class SaveKeyRequest(BaseModel):
    api_key: str


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "ffmpeg_available": has_ffmpeg(),
        "gemini_key_configured": has_configured_api_key(),
        "model": os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
    }


@app.post("/api/config/key")
def save_api_key(req: SaveKeyRequest):
    try:
        save_local_api_key(req.api_key)
        return {"status": "ok", "gemini_key_configured": True}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/analyze", response_model=VideoAnalysisResponse)
def analyze_video(req: AnalyzeRequest):
    try:
        video_id = extract_video_id(req.url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    canonical_url = f"https://www.youtube.com/watch?v={video_id}"
    meta = get_video_metadata(canonical_url, video_id)
    transcript = get_transcript(video_id)

    try:
        if transcript is not None:
            knowledge = analyze_transcript_with_gemini(
                video_title=meta.title,
                transcript_text=transcript.text,
                level=req.level,
                api_key_override=req.api_key,
            )
            source_label = transcript.source_label
            excerpt = transcript.text[:15_000]
        else:
            # 無字幕備援：擷取音訊交由 Gemini 多模態理解
            with tempfile.TemporaryDirectory() as tmp:
                audio_path = extract_audio_for_gemini(canonical_url, Path(tmp))
                knowledge = analyze_audio_with_gemini(
                    video_title=meta.title,
                    audio_path=audio_path,
                    level=req.level,
                    api_key_override=req.api_key,
                )
            source_label = "無字幕（由音訊直接解析）"
            excerpt = knowledge.video_summary_one_liner
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gemini 分析失敗：{exc}") from exc

    result = VideoAnalysisResponse(
        video_id=meta.video_id,
        title=meta.title,
        channel=meta.channel,
        duration_seconds=meta.duration_seconds,
        transcript_source=source_label,
        level=req.level,
        video_summary_one_liner=knowledge.video_summary_one_liner,
        prerequisites=knowledge.prerequisites,
        core_concepts=knowledge.core_concepts,
        extensions=knowledge.extensions,
        graph_edges=knowledge.graph_edges,
        transcript_excerpt=excerpt,
    )
    save_history(result.model_dump())
    return result


@app.post("/api/chat", response_model=ChatResponse)
def chat_about_video(req: ChatRequest):
    try:
        answer = chat_follow_up(
            video_title=req.video_title,
            video_context=req.video_context,
            history=req.history,
            question=req.question,
            api_key_override=req.api_key,
        )
        return ChatResponse(answer=answer)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"對話生成失敗：{exc}") from exc


@app.post("/api/download")
def download_video_or_audio(req: DownloadRequest):
    try:
        video_id = extract_video_id(req.url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    canonical_url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        file_path = download_media(canonical_url, req.format, DOWNLOADS_DIR)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"下載失敗：{exc}") from exc

    media_type = "audio/mpeg" if req.format == "mp3" else "video/mp4"
    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=file_path.name,
    )


class TranscriptDownloadRequest(BaseModel):
    url: str
    format: Literal["txt", "srt"] = "txt"
    translate_to_zh_tw: bool = False
    api_key: str | None = None


@app.post("/api/transcript/download")
def download_transcript(req: TranscriptDownloadRequest):
    try:
        video_id = extract_video_id(req.url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    canonical_url = f"https://www.youtube.com/watch?v={video_id}"
    meta = get_video_metadata(canonical_url, video_id)
    transcript = get_transcript(video_id)
    if transcript is None:
        raise HTTPException(status_code=404, detail="此影片沒有提供任何文字字幕，無法下載逐字稿。")

    content = (
        format_transcript_as_srt(transcript.snippets)
        if req.format == "srt"
        else transcript.text + "\n"
    )

    is_already_zh_tw = transcript.language_code.lower() in {"zh-tw", "zh-hant"}
    if req.translate_to_zh_tw and not is_already_zh_tw:
        try:
            content = translate_transcript_to_zh_tw(content, api_key_override=req.api_key)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"繁體中文轉換失敗：{exc}") from exc

    safe_title = re.sub(r'[\\/:*?"<>|]+', "_", meta.title)[:60].strip() or video_id
    suffix = "_zh-TW" if req.translate_to_zh_tw else ""
    filename = f"{safe_title} [{video_id}]{suffix}.{req.format}"
    encoded_name = quote(filename)

    return Response(
        content=content.encode("utf-8-sig"),
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_name}"},
    )


class HistoryStateUpdateRequest(BaseModel):
    mastered_ids: list[str] = Field(default_factory=list)
    chat_messages: list[dict] = Field(default_factory=list)


@app.get("/api/history")
def get_history_list():
    return {"items": list_history()}


@app.get("/api/history/{video_id}")
def get_history_detail(video_id: str):
    try:
        record = get_history(video_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if record is None:
        raise HTTPException(status_code=404, detail="找不到此影片的保存紀錄")
    return record


@app.put("/api/history/{video_id}/state")
def save_history_state(video_id: str, req: HistoryStateUpdateRequest):
    try:
        updated = update_history_state(video_id, req.mastered_ids, req.chat_messages)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not updated:
        raise HTTPException(status_code=404, detail="找不到此影片的保存紀錄")
    return {"status": "ok"}


@app.delete("/api/history/{video_id}")
def remove_history_item(video_id: str):
    try:
        deleted = delete_history(video_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="找不到此影片的保存紀錄")
    return {"status": "ok"}


FRONTEND_OUT_DIR = BASE_DIR.parent / "frontend" / "out"
if FRONTEND_OUT_DIR.exists():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_OUT_DIR), html=True),
        name="frontend",
    )
