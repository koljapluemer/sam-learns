"""One-time import of boringwords content from the linguanodon Django app.

Run via: uv run python boringwords/import_from_linguanodon.py

linguanodon curates this content via Django admin; this script just dumps
its sqlite3 tables (plus the background photos referenced by them) to the
files this repo's frontend fetches at runtime. Rerun by hand if the upstream
content changes - there is no sync, and no local curation UI for this app.

Reads (stdlib sqlite3, no Django needed - it's just a sqlite file):
  ../linguanodon/boringwords.sqlite3 -> tables boringwords_word, boringwords_background
  ../linguanodon/boringwords/static/boringwords/<language>/*.webp -> background photos

Writes:
  public/data/boringwords/words.json
  public/data/boringwords/backgrounds.json
  public/data/boringwords/<language>/*.webp
"""

import argparse
import json
import shutil
import sqlite3
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LINGUANODON_ROOT = REPO_ROOT.parent / "linguanodon"
DEFAULT_SQLITE_PATH = LINGUANODON_ROOT / "boringwords.sqlite3"
DEFAULT_STATIC_DIR = LINGUANODON_ROOT / "boringwords" / "static" / "boringwords"
OUTPUT_DIR = REPO_ROOT / "public" / "data" / "boringwords"

LANGUAGES = ["vie", "arz"]


def export_words(connection: sqlite3.Connection) -> None:
    rows = connection.execute(
        "SELECT id, language, front, back, credit FROM boringwords_word ORDER BY language, id"
    ).fetchall()
    words = [dict(row) for row in rows]
    (OUTPUT_DIR / "words.json").write_text(json.dumps(words, indent=2, ensure_ascii=False))
    print(f"Wrote {len(words)} words to public/data/boringwords/words.json")


def export_backgrounds(connection: sqlite3.Connection) -> None:
    rows = connection.execute(
        "SELECT language, filename, credit FROM boringwords_background ORDER BY language, id"
    ).fetchall()
    backgrounds = [dict(row) for row in rows]
    (OUTPUT_DIR / "backgrounds.json").write_text(json.dumps(backgrounds, indent=2, ensure_ascii=False))
    print(f"Wrote {len(backgrounds)} backgrounds to public/data/boringwords/backgrounds.json")


def copy_photos(static_dir: Path) -> None:
    for language in LANGUAGES:
        source_dir = static_dir / language
        dest_dir = OUTPUT_DIR / language
        dest_dir.mkdir(parents=True, exist_ok=True)
        count = 0
        for photo in source_dir.glob("*.webp"):
            shutil.copy2(photo, dest_dir / photo.name)
            count += 1
        print(f"Copied {count} photos for '{language}' to public/data/boringwords/{language}/")


def export_all(sqlite_path: Path, static_dir: Path) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    try:
        export_words(connection)
        export_backgrounds(connection)
    finally:
        connection.close()
    copy_photos(static_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite-path", type=Path, default=DEFAULT_SQLITE_PATH)
    parser.add_argument("--static-dir", type=Path, default=DEFAULT_STATIC_DIR)
    args = parser.parse_args()
    export_all(args.sqlite_path, args.static_dir)
