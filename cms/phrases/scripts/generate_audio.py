"""Generate ElevenLabs TTS audio for every target-language phrase in
public/data/phrases/<iso3>/*.json.

Run via: uv run python phrases/scripts/generate_audio.py

Each phrase file nests target-language phrases as keys of an "expressions"
object, at any depth. For every phrase found, writes an mp3 to a sibling
audio/ folder (public/data/phrases/<iso3>/audio/), named after a slug of
the phrase text plus a content hash for uniqueness. Phrases whose audio
file already exists are skipped, so reruns only fill in new phrases.

Voices are chosen randomly per phrase from ElevenLabs voices labeled for
the phrase's language (via the ISO 639-1 code derived from the folder's
ISO 639-3 code with pycountry); if none are labeled for that language,
falls back to the full voice list.

Requires ELEVENLABS_API_KEY in a .env file at the repo root.
"""

import hashlib
import json
import os
import random
import re
from pathlib import Path

import pycountry
import requests
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[3]
PHRASES_DIR = REPO_ROOT / "public" / "data" / "phrases"
API_BASE = "https://api.elevenlabs.io"
MODEL_ID = "eleven_multilingual_v2"

load_dotenv(REPO_ROOT / ".env")
API_KEY = os.environ["ELEVENLABS_API_KEY"]
HEADERS = {"xi-api-key": API_KEY}


def iso3_to_iso1(iso3: str) -> str | None:
    language = pycountry.languages.get(alpha_3=iso3)
    return getattr(language, "alpha_2", None) if language else None


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


def audio_filename(phrase: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", phrase.lower()).strip("-") or "phrase"
    digest = hashlib.md5(phrase.encode("utf-8")).hexdigest()[:8]
    return f"{slug}-{digest}.mp3"


def fetch_voices(iso1: str | None) -> list[dict]:
    params = {"page_size": 100}
    if iso1:
        params["language"] = iso1
    response = requests.get(f"{API_BASE}/v2/voices", headers=HEADERS, params=params)
    response.raise_for_status()
    voices = response.json()["voices"]
    if voices:
        return voices
    if iso1:
        return fetch_voices(None)
    return voices


def generate_audio(phrase: str, voice_id: str) -> bytes:
    response = requests.post(
        f"{API_BASE}/v1/text-to-speech/{voice_id}",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={"text": phrase, "model_id": MODEL_ID},
    )
    response.raise_for_status()
    return response.content


def process_language(lang_dir: Path) -> None:
    phrases: set[str] = set()
    for json_file in lang_dir.glob("*.json"):
        phrases.update(find_phrases(json.loads(json_file.read_text())))
    if not phrases:
        return

    audio_dir = lang_dir / "audio"
    audio_dir.mkdir(exist_ok=True)

    pending = [p for p in phrases if not (audio_dir / audio_filename(p)).exists()]
    skipped = len(phrases) - len(pending)
    if not pending:
        print(f"{lang_dir.name}: {skipped} phrase(s) already have audio, nothing to do")
        return

    voices = fetch_voices(iso3_to_iso1(lang_dir.name))
    if not voices:
        print(f"{lang_dir.name}: no ElevenLabs voices available, skipping")
        return

    for phrase in pending:
        voice = random.choice(voices)
        audio = generate_audio(phrase, voice["voice_id"])
        (audio_dir / audio_filename(phrase)).write_bytes(audio)
        print(f"{lang_dir.name}: generated '{phrase}' with voice '{voice['name']}'")

    print(f"{lang_dir.name}: generated {len(pending)}, skipped {skipped} already-present")


def main() -> None:
    for lang_dir in sorted(p for p in PHRASES_DIR.iterdir() if p.is_dir()):
        process_language(lang_dir)


if __name__ == "__main__":
    main()
