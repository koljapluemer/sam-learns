"""Generate ElevenLabs TTS audio for every target-language phrase in
public/data/phrases/<iso3>.json.

Run via: uv run python phrases/scripts/generate_audio.py

Each phrase file nests target-language phrases as keys of an "expressions"
object, at any depth. For every phrase found, writes an mp3 to that
language's audio/ folder (public/data/phrases/<iso3>/audio/), named after
a slug of the phrase text. Phrases whose audio file already exists are
skipped, so reruns only fill in new phrases.

Batch counterpart to the CMS app's per-phrase "Generate audio" button -
see ../audio.py for the filename convention and generation details, which
this script reuses.
"""

import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from audio import audio_path, fetch_voices, generate_audio_bytes, iso3_to_iso1  # noqa: E402
from data_io import phrases_dir  # noqa: E402


def find_phrases(node: object) -> set[str]:
    phrases: set[str] = set()
    if isinstance(node, dict):
        expressions = node.get("expressions")
        if isinstance(expressions, dict):
            phrases.update(expressions.keys())
        for value in node.values():
            phrases.update(find_phrases(value))
    elif isinstance(node, list):
        for item in node:
            phrases.update(find_phrases(item))
    return phrases


def process_language(json_path: Path) -> None:
    iso3 = json_path.stem
    phrases = find_phrases(json.loads(json_path.read_text()))
    if not phrases:
        return

    pending = [p for p in phrases if not audio_path(iso3, p).exists()]
    skipped = len(phrases) - len(pending)
    if not pending:
        print(f"{iso3}: {skipped} phrase(s) already have audio, nothing to do")
        return

    voices = fetch_voices(iso3_to_iso1(iso3))
    if not voices:
        print(f"{iso3}: no ElevenLabs voices available, skipping")
        return

    for phrase in pending:
        voice = random.choice(voices)
        audio = generate_audio_bytes(phrase, voice["voice_id"])
        path = audio_path(iso3, phrase)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(audio)
        print(f"{iso3}: generated '{phrase}' with voice '{voice['name']}'")

    print(f"{iso3}: generated {len(pending)}, skipped {skipped} already-present")


def main() -> None:
    for json_path in sorted(phrases_dir().glob("*.json")):
        if json_path.stem == "languages":
            continue
        process_language(json_path)


if __name__ == "__main__":
    main()
