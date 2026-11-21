import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Literal
from urllib.parse import parse_qs, urlparse

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi


PREFERRED_LANGS = ["zh-TW", "zh-Hant", "zh", "zh-Hans", "zh-CN", "en", "en-US", "ja"]


@dataclass
class VideoMetadata:
    video_id: str
    title: str
    channel: str
    duration_seconds: int


@dataclass
class TranscriptResult:
    text: str
    source_label: str


def has_ffmpeg() -> bool:
    """檢查系統是否已安裝 ffmpeg"""
    return shutil.which("ffmpeg") is not None


def extract_video_id(url: str) -> str:
    """從各種 YouTube 網址格式中提取 11 碼 Video ID"""
    raw = url.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", raw):
        return raw

    parsed = urlparse(raw)
    host = parsed.netloc.lower()
    if host.startswith("www."):
        host = host[4:]

    if host == "youtu.be":
        vid = parsed.path.lstrip("/").split("/")[0]
        if re.fullmatch(r"[A-Za-z0-9_-]{11}", vid):
            return vid

    if host in {"youtube.com", "m.youtube.com", "music.youtube.com"}:
        if parsed.path == "/watch":
            vid = parse_qs(parsed.query).get("v", [""])[0]
            if re.fullmatch(r"[A-Za-z0-9_-]{11}", vid):
                return vid
        for prefix in ("/shorts/", "/embed/", "/live/", "/v/"):
            if parsed.path.startswith(prefix):
                vid = parsed.path[len(prefix):].split("/")[0]
                if re.fullmatch(r"[A-Za-z0-9_-]{11}", vid):
                    return vid

    raise ValueError("無法辨識的 YouTube 影片網址，請確認連結是否正確。")


def format_timestamp(seconds: float) -> str:
    total = max(0, int(seconds))
    hours, rem = divmod(total, 3600)
    minutes, secs = divmod(rem, 60)
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def get_video_metadata(url: str, video_id: str) -> VideoMetadata:
    """透過 yt-dlp 取得影片標題、頻道與長度（不下載檔案）"""
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return VideoMetadata(
                video_id=video_id,
                title=info.get("title") or f"YouTube 影片 ({video_id})",
                channel=info.get("uploader") or info.get("channel") or "未知頻道",
                duration_seconds=int(info.get("duration") or 0),
            )
    except Exception:
        return VideoMetadata(
            video_id=video_id,
            title=f"YouTube 影片 ({video_id})",
            channel="未知頻道",
            duration_seconds=0,
        )


def get_transcript(video_id: str) -> TranscriptResult | None:
    """嘗試抓取 YouTube 字幕並格式化為含時間戳記的逐字稿"""
    ytt_api = YouTubeTranscriptApi()
    try:
        transcript_list = ytt_api.list(video_id)
    except Exception:
        return None

    selected = None
    try:
        selected = transcript_list.find_transcript(PREFERRED_LANGS)
    except Exception:
        # 若無指定語言，退而取清單中的第一份字幕
        for item in transcript_list:
            selected = item
            break

    if selected is None:
        return None

    try:
        fetched = selected.fetch()
    except Exception:
        return None

    lines = [
        f"[{format_timestamp(snippet.start)}] {snippet.text.strip()}"
        for snippet in fetched
        if snippet.text and snippet.text.strip()
    ]
    if not lines:
        return None

    kind = "自動字幕" if selected.is_generated else "人工字幕"
    return TranscriptResult(
        text="\n".join(lines),
        source_label=f"{selected.language} ({kind})",
    )


def extract_audio_for_gemini(url: str, temp_dir: Path) -> Path:
    """當影片無字幕時，使用 yt-dlp 擷取音訊檔供 Gemini 多模態分析"""
    temp_dir.mkdir(parents=True, exist_ok=True)
    out_tmpl = str(temp_dir / "%(id)s.%(ext)s")
    ydl_opts: dict = {
        "format": "bestaudio[ext=m4a]/bestaudio/best",
        "outtmpl": out_tmpl,
        "quiet": True,
        "no_warnings": True,
    }
    if has_ffmpeg():
        ydl_opts["postprocessors"] = [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "96",
            }
        ]

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        vid = info.get("id", "audio")

    for candidate in temp_dir.glob(f"{vid}.*"):
        if candidate.is_file():
            return candidate
    raise RuntimeError("無法擷取影片音訊以進行無字幕分析。")


def download_media(url: str, fmt: Literal["mp4", "mp3"], output_dir: Path) -> Path:
    """使用 yt-dlp + ffmpeg 下載為 MP4 或 MP3"""
    output_dir.mkdir(parents=True, exist_ok=True)
    ffmpeg_available = has_ffmpeg()

    if fmt == "mp3" and not ffmpeg_available:
        raise RuntimeError(
            "本機尚未安裝 ffmpeg，無法轉檔為 MP3。請執行 `winget install Gyan.FFmpeg` 安裝後重試。"
        )

    out_tmpl = str(output_dir / "%(title).80s [%(id)s].%(ext)s")

    if fmt == "mp3":
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": out_tmpl,
            "quiet": True,
            "no_warnings": True,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }
            ],
        }
    else:
        # MP4：有 ffmpeg 時合併最高畫質影音；無 ffmpeg 時退回單檔 mp4 串流
        fmt_selector = (
            "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
            if ffmpeg_available
            else "best[ext=mp4]/best"
        )
        ydl_opts = {
            "format": fmt_selector,
            "outtmpl": out_tmpl,
            "merge_output_format": "mp4",
            "quiet": True,
            "no_warnings": True,
        }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        vid = info.get("id", "")
        prepared = Path(ydl.prepare_filename(info))
        target_ext = ".mp3" if fmt == "mp3" else ".mp4"
        expected = prepared.with_suffix(target_ext)
        if expected.exists():
            return expected

    matches = sorted(
        output_dir.glob(f"*[{vid}]*{target_ext}"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if matches:
        return matches[0]
    raise RuntimeError("下載完成但找不到輸出檔案，請稍後再試。")
