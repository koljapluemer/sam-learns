"""Generate pronunciation clips for the `ancient-greek-alphabet` app.

Every `<term>.webp` image in `public/data/greek-alphabet/` names an Ancient
Greek term. For each one, speaks the term with espeak-ng's Ancient Greek
voice (`grc`), transcodes it to `audio/<term>.mp3` via ffmpeg, and writes
`words.json` (the list of terms - the frontend can't list a directory).

Existing mp3s are kept; pass `--force` to regenerate them.

Run with:
    uv run python greek_alphabet/build_audio.py [--force]
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "public" / "data" / "greek-alphabet"
AUDIO_DIR = DATA_DIR / "audio"

VOICE = "grc"
WORDS_PER_MINUTE = "120"
MP3_BITRATE = "64k"


def speak_to_mp3(term: str, target: Path) -> None:
    with tempfile.NamedTemporaryFile(suffix=".wav") as wav:
        subprocess.run(
            ["espeak-ng", "-v", VOICE, "-s", WORDS_PER_MINUTE, "-w", wav.name, term],
            check=True,
        )
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", wav.name, "-b:a", MP3_BITRATE, str(target)],
            check=True,
        )


def main() -> None:
    force = "--force" in sys.argv[1:]
    AUDIO_DIR.mkdir(exist_ok=True)
    terms = sorted(image.stem for image in DATA_DIR.glob("*.webp"))

    for term in terms:
        target = AUDIO_DIR / f"{term}.mp3"
        if force or not target.exists():
            speak_to_mp3(term, target)
            print(f"{term} -> {target.name}")

    (DATA_DIR / "words.json").write_text(json.dumps(terms, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(terms)} terms to words.json")


if __name__ == "__main__":
    main()
