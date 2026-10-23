"""Detect speaking pauses with ffmpeg silencedetect and split the audio into 5-30s snippets.
Cuts are placed in the middle of pauses (longest pause within the allowed window wins);
if a window contains no pause, the snippet is force-cut at the max length.
Subtitle text is attached to each snippet by word/event timing.

Output: data/<id>/silences.json (cached ffmpeg result), data/<id>/snippets.json ([{id, start, end, text}])
"""

import re
import subprocess
import sys
from pathlib import Path

from common import read_json, subtitle_path, video_dir, write_json

MIN_LEN = 5.0
MAX_LEN = 30.0
NOISE = "-30dB"
MIN_PAUSE = 0.3


def probe_duration(audio: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(audio)],
        check=True, capture_output=True, text=True,
    ).stdout
    return float(out.strip())


def detect_silences(audio: Path) -> list[tuple[float, float]]:
    proc = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(audio), "-vn",
         "-af", f"silencedetect=noise={NOISE}:d={MIN_PAUSE}", "-f", "null", "-"],
        check=True, capture_output=True, text=True,
    )
    silences: list[tuple[float, float]] = []
    start = None
    for line in proc.stderr.splitlines():
        if m := re.search(r"silence_start: (-?[\d.]+)", line):
            start = max(0.0, float(m.group(1)))
        elif (m := re.search(r"silence_end: ([\d.]+)", line)) and start is not None:
            silences.append((start, float(m.group(1))))
            start = None
    return silences


def load_or_detect_silences(directory: Path, audio: Path) -> dict:
    cache = directory / "silences.json"
    params = {"noise": NOISE, "min_pause": MIN_PAUSE}
    if cache.exists():
        data = read_json(cache)
        if data.get("params") == params:
            return data

    data = {"params": params, "duration": probe_duration(audio), "silences": detect_silences(audio)}
    write_json(cache, data)
    return data


def split(duration: float, silences: list[tuple[float, float]]) -> list[tuple[float, float]]:
    # candidate cut = middle of a pause, weighted by pause length
    cuts = [((a + b) / 2, b - a) for a, b in silences]

    # skip leading/trailing silence
    start = silences[0][1] if silences and silences[0][0] <= 0.05 else 0.0
    end_of_speech = silences[-1][0] if silences and silences[-1][1] >= duration - 0.05 else duration

    segments: list[tuple[float, float]] = []
    while end_of_speech - start > MAX_LEN:
        window = [c for c in cuts if start + MIN_LEN <= c[0] <= start + MAX_LEN]
        cut = max(window, key=lambda c: c[1])[0] if window else start + MAX_LEN
        segments.append((start, cut))
        start = cut
    if end_of_speech > start:
        segments.append((start, end_of_speech))

    # too-short tail: merge into the previous snippet, or re-cut both so each is >= MIN_LEN
    if len(segments) >= 2 and segments[-1][1] - segments[-1][0] < MIN_LEN:
        prev_start, end = segments[-2][0], segments[-1][1]
        if end - prev_start <= MAX_LEN:
            segments[-2:] = [(prev_start, end)]
        else:
            window = [c for c in cuts if prev_start + MIN_LEN <= c[0] <= end - MIN_LEN and c[0] - prev_start <= MAX_LEN]
            cut = max(window, key=lambda c: c[1])[0] if window else end - MIN_LEN
            segments[-2:] = [(prev_start, cut), (cut, end)]
    return segments


def load_subtitle_words(path: Path) -> list[tuple[float, str]]:
    """Returns (time, text) pieces. Auto subs have per-word offsets, manual subs per-event text."""
    pieces: list[tuple[float, str]] = []
    for event in read_json(path).get("events", []):
        if "segs" not in event or event.get("aAppend"):
            continue
        event_start = event.get("tStartMs", 0)
        event_end = event_start + event.get("dDurationMs", 0)
        for seg_idx, seg in enumerate(event["segs"]):
            text = seg.get("utf8", "")
            if not text.strip():
                continue
            if "tOffsetMs" in seg or len(event["segs"]) > 1:
                t = event_start + seg.get("tOffsetMs", 0)
            else:
                t = (event_start + event_end) / 2  # whole-line event: use its midpoint
            # events are separate lines, keep a word boundary between them
            pieces.append((t / 1000, f" {text}" if seg_idx == 0 else text))
    return pieces


def attach_text(segments: list[tuple[float, float]], pieces: list[tuple[float, str]]) -> list[dict]:
    snippets = []
    for idx, (start, end) in enumerate(segments):
        text = "".join(t for time, t in pieces if start <= time < end)
        snippets.append({"id": f"{idx:04d}", "start": round(start, 3), "end": round(end, 3), "text": " ".join(text.split())})
    return snippets


def split_snippets(youtube_id: str, subtitle_lang: str | None) -> list[dict]:
    directory = video_dir(youtube_id)
    audio = directory / "audio.m4a"
    data = load_or_detect_silences(directory, audio)
    segments = split(data["duration"], [tuple(s) for s in data["silences"]])

    subs = subtitle_path(directory, subtitle_lang) if subtitle_lang else None
    pieces = load_subtitle_words(subs) if subs and subs.exists() else []
    if subs and not pieces:
        print(f"WARNING: no subtitle text for {youtube_id}, snippets have empty text", file=sys.stderr)

    snippets = attach_text(segments, pieces)
    write_json(directory / "snippets.json", snippets)
    return snippets
