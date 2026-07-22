"""One-time import of viettonepractice content from the linguanodon Django app.

Run via: uv run python viettonepractice/import_from_linguanodon.py

linguanodon curates this content via Django admin; this script just dumps
its sqlite3 table (plus the audio clips it references) to the files this
repo's frontend fetches at runtime. Rerun by hand if the upstream content
changes - there is no sync, and no local curation UI for this app.

Reads (stdlib sqlite3, no Django needed - it's just a sqlite file):
  ../linguanodon/viettonepractice.sqlite3 -> table viettonepractice_clip
  ../linguanodon/viettonepractice/static/viettonepractice/audio/*.mp3 -> audio clips

Writes:
  public/data/viettonepractice/clips.json
  public/data/viettonepractice/audio/*.mp3
"""

import argparse
import json
import shutil
import sqlite3
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LINGUANODON_ROOT = REPO_ROOT.parent / "linguanodon"
DEFAULT_SQLITE_PATH = LINGUANODON_ROOT / "viettonepractice.sqlite3"
DEFAULT_STATIC_DIR = LINGUANODON_ROOT / "viettonepractice" / "static" / "viettonepractice" / "audio"
OUTPUT_DIR = REPO_ROOT / "public" / "data" / "viettonepractice"


def export_clips(connection: sqlite3.Connection) -> None:
    rows = connection.execute(
        "SELECT filename, transcript FROM viettonepractice_clip ORDER BY filename"
    ).fetchall()
    clips = [dict(row) for row in rows]
    (OUTPUT_DIR / "clips.json").write_text(json.dumps(clips, indent=2, ensure_ascii=False))
    print(f"Wrote {len(clips)} clips to public/data/viettonepractice/clips.json")


def copy_audio(static_dir: Path) -> None:
    dest_dir = OUTPUT_DIR / "audio"
    dest_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    for clip in static_dir.glob("*.mp3"):
        shutil.copy2(clip, dest_dir / clip.name)
        count += 1
    print(f"Copied {count} audio clips to public/data/viettonepractice/audio/")


def export_all(sqlite_path: Path, static_dir: Path) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    try:
        export_clips(connection)
    finally:
        connection.close()
    copy_audio(static_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite-path", type=Path, default=DEFAULT_SQLITE_PATH)
    parser.add_argument("--static-dir", type=Path, default=DEFAULT_STATIC_DIR)
    args = parser.parse_args()
    export_all(args.sqlite_path, args.static_dir)
