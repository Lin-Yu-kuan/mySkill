import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

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
)
from services.youtube_service import (
    download_media,
    extract_audio_for_gemini,
    extract_video_id,
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


@app.get("/api/health")
def health_check():
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    has_api_key = bool(api_key and api_key != "your_gemini_api_key_here")
    return {
        "status": "ok",
        "ffmpeg_available": has_ffmpeg(),
        "gemini_key_configured": has_api_key,
        "model": os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
    }


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

    return VideoAnalysisResponse(
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


FRONTEND_OUT_DIR = BASE_DIR.parent / "frontend" / "out"
if FRONTEND_OUT_DIR.exists():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_OUT_DIR), html=True),
        name="frontend",
    )
