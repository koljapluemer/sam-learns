"""Download a YouTube video's audio, title and subtitles (json3, word timings for auto subs) via yt-dlp.

Output: data/<id>/audio.m4a, data/<id>/info.json, data/<id>/audio.<lang>.json3
"""

import json
import subprocess
import sys
import time
from pathlib import Path

from common import read_json, subtitle_path, video_dir, write_json


class RateLimited(subprocess.CalledProcessError):
    """YouTube answered 429; further requests only extend the block."""


def yt_dlp(args: list[str], capture: bool = False) -> str:
    # node instead of the default deno; needed for YouTube signature solving
    command = [sys.executable, "-m", "yt_dlp", "--js-runtimes", "node", *args]
    proc = subprocess.run(command, stdout=subprocess.PIPE if capture else None, stderr=subprocess.PIPE, text=True)
    sys.stderr.write(proc.stderr)
    if proc.returncode:
        error = RateLimited if "HTTP Error 429" in proc.stderr else subprocess.CalledProcessError
        raise error(proc.returncode, command, proc.stdout, proc.stderr)
    return proc.stdout


def load_info(directory: Path, url: str) -> dict:
    cache = directory / "info.json"
    if cache.exists():
        return read_json(cache)
    full = json.loads(yt_dlp(["-J", "--skip-download", url], capture=True))
    info = {key: full.get(key) for key in ("title", "subtitles", "automatic_captions")}
    write_json(cache, info)
    return info


def _matching_track(keys, lang: str, original_only: bool = False) -> str | None:
    exact = [f"{lang}-orig"] if original_only else [lang]
    for key in exact:
        if key in keys:
            return key
    regional = sorted(key for key in keys if key.startswith(f"{lang}-") and (not original_only or key.endswith("-orig")))
    return regional[0] if regional else None


def pick_subtitle_track(info: dict, lang: str, allow_translated: bool = True) -> tuple[str, bool] | None:
    """Returns (track key, is_auto). Manual subs first, then the original ASR track (<lang>-orig);
    plain auto <lang> may be a machine translation, which YouTube rate-limits heavily (429)."""
    manual = info.get("subtitles") or {}
    auto = info.get("automatic_captions") or {}
    if key := _matching_track(manual, lang):
        return key, False
    if key := _matching_track(auto, lang, original_only=True):
        return key, True
    if allow_translated and (key := _matching_track(auto, lang)):
        return key, True
    return None


def download_subtitles(
    directory: Path, url: str, key: str, is_auto: bool, retry_waits: tuple[int | None, ...] = (30, 90, 180, None)
) -> None:
    for attempt, wait in enumerate(retry_waits, start=1):
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


def download_transcript(youtube_id: str, subtitle_lang: str) -> Path | None:
    """Fetch only metadata and the best original subtitle track for discovery.
    Returns None when the video has no original-language track (likely the wrong language)."""
    directory = video_dir(youtube_id)
    url = f"https://www.youtube.com/watch?v={youtube_id}"
    info = load_info(directory, url)
    target = subtitle_path(directory, subtitle_lang)
    if target.exists():
        return target
    track = pick_subtitle_track(info, subtitle_lang, allow_translated=False)
    if track is None:
        return None
    key, is_auto = track
    download_subtitles(directory, url, key, is_auto, (None,))
    downloaded = subtitle_path(directory, key)
    if not downloaded.exists():
        return None
    if downloaded != target:
        downloaded.replace(target)
    return target
