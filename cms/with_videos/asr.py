"""Transcribe snippets locally for languages whose YouTube captions are untrustworthy (e.g. French ASR on Creole).

Each snippet's audio is cut to a 16kHz clip and transcribed by omni_asr.py, which runs in its own uv script env.
Output: data/<id>/asr.json ({"<start>-<end>": raw transcript}), so re-runs only transcribe new snippet boundaries.
"""

import re
import subprocess
from pathlib import Path

from common import read_json, video_dir, write_json

# ISO 639-3 -> Omnilingual ASR language code
ASR_LANGUAGES = {"mfe": "mfe_Latn"}
SCRIPT = Path(__file__).parent / "omni_asr.py"
# a phrase of up to 6 words repeated 4+ times in a row
REPEAT = re.compile(r"\b(\S+(?:\s+\S+){0,5}?)(?:\s+\1\b){3,}")


def collapse_repeats(text: str) -> str:
    """The LLM decoder sometimes loops on noisy audio ("a b a b a b ..."); keep a single occurrence."""
    return " ".join(REPEAT.sub(r"\1", text).split())


def cut_clip(audio: Path, clip: Path, start: float, end: float) -> None:
    subprocess.run(
        ["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-ss", str(start), "-to", str(end),
         "-i", str(audio), "-ac", "1", "-ar", "16000", str(clip)],
        check=True,
    )


def run_asr(clips: list[Path], lang: str) -> list[str]:
    out = clips[0].parent / "transcripts.json"
    # --python overrides cms/.python-version, which is too new for fairseq2
    command = ["uv", "run", "--python", "3.12", "--script", str(SCRIPT), lang, str(out), *map(str, clips)]
    subprocess.run(command, check=True)
    return read_json(out)


def transcribe_snippets(youtube_id: str, snippets: list[dict], lang: str) -> list[dict]:
    directory = video_dir(youtube_id)
    cache_path = directory / "asr.json"
    cache = read_json(cache_path) if cache_path.exists() else {}
    keys = [f"{snippet['start']}-{snippet['end']}" for snippet in snippets]

    pending = [(snippet, key) for snippet, key in zip(snippets, keys) if key not in cache]
    if pending:
        clip_dir = directory / "clips"
        clip_dir.mkdir(exist_ok=True)
        clips = [clip_dir / f"{snippet['id']}.wav" for snippet, _ in pending]
        for (snippet, _), clip in zip(pending, clips):
            cut_clip(directory / "audio.m4a", clip, snippet["start"], snippet["end"])
        for (_, key), text in zip(pending, run_asr(clips, lang), strict=True):
            cache[key] = text
        write_json(cache_path, cache)

    return [{**snippet, "text": collapse_repeats(cache[key])} for snippet, key in zip(snippets, keys)]
