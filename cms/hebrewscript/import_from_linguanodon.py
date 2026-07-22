"""One-time import of hebrewscript content from the linguanodon Django app.

Run via: uv run python hebrewscript/import_from_linguanodon.py

Snapshot only, like arabicnumbers' import script - linguanodon curates this
via Django admin, this just dumps its sqlite3 table plus the matching audio
files. Rerun by hand if the upstream content changes.

Reads (stdlib sqlite3, no Django needed):
  ../linguanodon/hebrewscript.sqlite3 -> table hebrewscript_clip

Writes:
  public/data/hebrewscript/clips.json
  public/data/hebrewscript/audio/<filename>.opus (copied, not derived from
  sqlite - the clip table only has the transcript, not the audio bytes)
"""

import argparse
import json
import shutil
import sqlite3
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SQLITE_PATH = REPO_ROOT.parent / "linguanodon" / "hebrewscript.sqlite3"
DEFAULT_AUDIO_SOURCE_DIR = REPO_ROOT.parent / "linguanodon" / "hebrewscript" / "static" / "hebrewscript" / "audio"
OUTPUT_DIR = REPO_ROOT / "public" / "data" / "hebrewscript"


def export_clips(sqlite_path: Path) -> None:
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    try:
        rows = connection.execute(
            "SELECT filename, transcript FROM hebrewscript_clip ORDER BY filename"
        ).fetchall()
    finally:
        connection.close()

    clips = [dict(row) for row in rows]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "clips.json").write_text(json.dumps(clips, indent=2, ensure_ascii=False))
    print(f"Wrote {len(clips)} clips to {(OUTPUT_DIR / 'clips.json').relative_to(REPO_ROOT)}")


def copy_audio(audio_source_dir: Path) -> None:
    audio_output_dir = OUTPUT_DIR / "audio"
    audio_output_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    for source_file in audio_source_dir.glob("*.opus"):
        shutil.copyfile(source_file, audio_output_dir / source_file.name)
        count += 1
    print(f"Copied {count} audio files to {audio_output_dir.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite-path", type=Path, default=DEFAULT_SQLITE_PATH)
    parser.add_argument("--audio-source-dir", type=Path, default=DEFAULT_AUDIO_SOURCE_DIR)
    args = parser.parse_args()
    export_clips(args.sqlite_path)
    copy_audio(args.audio_source_dir)
