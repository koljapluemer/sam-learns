"""Download a YouTube video's audio, title and subtitles (json3, word timings for auto subs) via yt-dlp.

Output: data/<id>/audio.m4a, data/<id>/info.json, data/<id>/audio.<lang>.json3
"""

import json
import subprocess
import sys
import time
from pathlib import Path

from common import read_json, subtitle_path, video_dir, write_json


def yt_dlp(args: list[str], capture: bool = False) -> str:
    # node instead of the default deno; needed for YouTube signature solving
    proc = subprocess.run(
        [sys.executable, "-m", "yt_dlp", "--js-runtimes", "node", *args],
        check=True, capture_output=capture, text=True,
    )
    return proc.stdout


def load_info(directory: Path, url: str) -> dict:
    cache = directory / "info.json"
    if cache.exists():
        return read_json(cache)
    full = json.loads(yt_dlp(["-J", "--skip-download", url], capture=True))
    info = {key: full.get(key) for key in ("title", "subtitles", "automatic_captions")}
    write_json(cache, info)
    return info


def pick_subtitle_track(info: dict, lang: str) -> tuple[str, bool] | None:
    """Returns (track key, is_auto). Manual subs first, then the original ASR track (<lang>-orig);
    plain auto <lang> may be a machine translation, which YouTube rate-limits heavily (429)."""
    manual = info.get("subtitles") or {}
    auto = info.get("automatic_captions") or {}
    if lang in manual:
        return lang, False
    if f"{lang}-orig" in auto:
        return f"{lang}-orig", True
    if lang in auto:
        return lang, True
    return None


def download_subtitles(directory: Path, url: str, key: str, is_auto: bool) -> None:
    for attempt, wait in enumerate([30, 90, 180, None], start=1):
        try:
            yt_dlp([
                "--skip-download",
                "--write-auto-subs" if is_auto else "--write-subs",
                "--sub-langs", key,
                "--sub-format", "json3",
                "-o", str(directory / "audio.%(ext)s"),
                url,
            ])
            return
        except subprocess.CalledProcessError:
            if wait is None:
                raise
            print(f"Subtitle download failed (attempt {attempt}), retrying in {wait}s", file=sys.stderr)
            time.sleep(wait)


def download(youtube_id: str, subtitle_lang: str) -> str:
    """Returns the video title."""
    directory = video_dir(youtube_id)
    url = f"https://www.youtube.com/watch?v={youtube_id}"
    info = load_info(directory, url)

    if not (directory / "audio.m4a").exists():
        yt_dlp(["-f", "ba[ext=m4a]/ba", "-x", "--audio-format", "m4a", "-o", str(directory / "audio.%(ext)s"), url])

    subs = subtitle_path(directory, subtitle_lang)
    if not subs.exists():
        track = pick_subtitle_track(info, subtitle_lang)
        if track is None:
            print(f"WARNING: no '{subtitle_lang}' subtitles for {youtube_id}", file=sys.stderr)
        else:
            key, is_auto = track
            download_subtitles(directory, url, key, is_auto)
            downloaded = subtitle_path(directory, key)
            if downloaded != subs:
                downloaded.replace(subs)

    return info["title"]
