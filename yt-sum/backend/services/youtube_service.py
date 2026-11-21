import os
import re
import shutil
import subprocess
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Literal
from urllib.parse import parse_qs, urlparse

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi


PREFERRED_LANGS = ["zh-TW", "zh-Hant", "zh", "zh-Hans", "zh-CN", "en", "en-US", "ja"]


class DownloadPausedError(Exception):
    """使用者暫停下載"""


class DownloadCancelledError(Exception):
    """使用者終止下載"""


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
    language_code: str
    snippets: list[dict]


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

    snippets = [
        {
            "start": float(snippet.start),
            "duration": float(snippet.duration),
            "text": snippet.text.strip(),
        }
        for snippet in fetched
        if snippet.text and snippet.text.strip()
    ]
    if not snippets:
        return None

    lines = [
        f"[{format_timestamp(s['start'])}] {s['text']}"
        for s in snippets
    ]
    kind = "自動字幕" if selected.is_generated else "人工字幕"
    return TranscriptResult(
        text="\n".join(lines),
        source_label=f"{selected.language} ({kind})",
        language_code=selected.language_code,
        snippets=snippets,
    )


def _format_srt_time(seconds: float) -> str:
    ms_total = max(0, int(round(seconds * 1000)))
    hours, rem = divmod(ms_total, 3_600_000)
    minutes, rem = divmod(rem, 60_000)
    secs, ms = divmod(rem, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def format_transcript_as_srt(snippets: list[dict]) -> str:
    """將字幕片段轉成標準 SRT 字幕格式"""
    blocks: list[str] = []
    for idx, s in enumerate(snippets, start=1):
        start = float(s["start"])
        duration = max(0.5, float(s.get("duration") or 2.0))
        start_str = _format_srt_time(start)
        end_str = _format_srt_time(start + duration)
        blocks.append(f"{idx}\n{start_str} --> {end_str}\n{s['text']}")
    return "\n\n".join(blocks) + "\n"


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


def cleanup_partial_files(output_dir: Path, video_id: str) -> None:
    """終止下載時清理殘留的 .part / 暫存檔"""
    if not output_dir.exists():
        return
    for p in output_dir.glob(f"*[{video_id}]*.part*"):
        try:
            p.unlink()
        except Exception:
            pass


def terminate_process_tree(proc: subprocess.Popen | None) -> None:
    """立即終止 yt-dlp 及其子行程 (ffmpeg)"""
    if proc is None or proc.poll() is not None:
        return
    try:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        else:
            proc.terminate()
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass


def download_media(
    url: str,
    fmt: Literal["mp4", "mp3"],
    output_dir: Path,
    progress_callback: Callable[[int, str], None] | None = None,
    control_check: Callable[[], Literal["run", "pause", "cancel"]] | None = None,
    process_callback: Callable[[subprocess.Popen], None] | None = None,
) -> Path:
    """使用 yt-dlp 子行程 + ffmpeg 下載為 MP4 或 MP3（支援即時暫停與終止）"""
    output_dir.mkdir(parents=True, exist_ok=True)
    ffmpeg_available = has_ffmpeg()

    if fmt == "mp3" and not ffmpeg_available:
        raise RuntimeError(
            "本機尚未安裝 ffmpeg，無法轉檔為 MP3。請執行 `winget install Gyan.FFmpeg` 安裝後重試。"
        )

    def _check_control() -> None:
        if not control_check:
            return
        state = control_check()
        if state == "pause":
            raise DownloadPausedError("已暫停下載")
        if state == "cancel":
            raise DownloadCancelledError("已終止下載")

    _check_control()
    if progress_callback:
        progress_callback(2, "正在連線 YouTube 取得串流資訊...")

    video_id = extract_video_id(url)
    out_tmpl = str(output_dir / "%(title).80s [%(id)s].%(ext)s")
    target_ext = ".mp3" if fmt == "mp3" else ".mp4"

    cmd = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--newline",
        "--continue",
        "--no-warnings",
        "--no-playlist",
        "-o",
        out_tmpl,
    ]
    if fmt == "mp3":
        cmd.extend(["-f", "bestaudio/best", "-x", "--audio-format", "mp3", "--audio-quality", "192K"])
    else:
        fmt_selector = (
            "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
            if ffmpeg_available
            else "best[ext=mp4]/best"
        )
        cmd.extend(["-f", fmt_selector, "--merge-output-format", "mp4"])
    cmd.append(url)

    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if process_callback:
        process_callback(proc)

    pct_re = re.compile(r"\[download\]\s+(\d+(?:\.\d+)?)%(?:.*?at\s+([^\s]+))?")
    last_lines: list[str] = []

    if proc.stdout:
        for raw_line in proc.stdout:
            _check_control()
            line = raw_line.strip()
            if not line:
                continue
            last_lines.append(line)
            if len(last_lines) > 8:
                last_lines.pop(0)

            m = pct_re.search(line)
            if m and progress_callback:
                pct = float(m.group(1))
                speed = m.group(2)
                speed_str = f" · {speed}" if speed else ""
                progress_callback(
                    min(95, max(1, int(pct))),
                    f"下載串流中 {pct:.1f}%{speed_str}",
                )
            elif (
                "[Merger]" in line
                or "[ExtractAudio]" in line
                or "[ffmpeg]" in line
            ) and progress_callback:
                progress_callback(97, "FFmpeg 合併／轉檔中...")

    returncode = proc.wait()
    _check_control()

    if returncode != 0:
        detail = last_lines[-1] if last_lines else f"exit code {returncode}"
        raise RuntimeError(f"下載失敗：{detail}")

    matches = sorted(
        output_dir.glob(f"*[{video_id}]*{target_ext}"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if matches:
        return matches[0]
    raise RuntimeError("下載完成但找不到輸出檔案，請稍後再試。")
