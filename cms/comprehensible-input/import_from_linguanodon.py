"""One-time import of comprehensible_input content from the linguanodon Django app.

Run via: uv run python comprehensible-input/import_from_linguanodon.py

Snapshot only, same as every other cms/<slug>/import_from_linguanodon.py -
linguanodon curates this via Django admin, we just dump it. Rerun by hand if
upstream content changes.

Reads (stdlib sqlite3):
  ../linguanodon/comprehensible_input.sqlite3
    -> comprehensible_input_language, comprehensible_input_video

Writes:
  public/data/comprehensible-input/videos.json - each video carries its
  language name/code inline (the dataset is tiny - 2 languages, 40 videos -
  so no need for normalized separate files). Thumbnail URLs are derived from
  youtube_id at export time (same formula as linguanodon's Video model
  properties), not stored server-side.
"""

import argparse
import json
import sqlite3
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SQLITE_PATH = REPO_ROOT.parent / "linguanodon" / "comprehensible_input.sqlite3"
OUTPUT_PATH = REPO_ROOT / "public" / "data" / "comprehensible-input" / "videos.json"


def export_videos(sqlite_path: Path) -> None:
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    try:
        rows = connection.execute(
            """
            SELECT
                v.id AS video_id,
                v.youtube_id,
                v.title,
                l.id AS language_id,
                l.name AS language_name,
                l.code AS language_code
            FROM comprehensible_input_video v
            JOIN comprehensible_input_language l ON l.id = v.language_id
            ORDER BY l.name, v.title
            """
        ).fetchall()
    finally:
        connection.close()

    videos = [
        {
            "videoId": row["video_id"],
            "youtubeId": row["youtube_id"],
            "title": row["title"],
            "languageId": row["language_id"],
            "languageName": row["language_name"],
            "languageCode": row["language_code"],
            "thumbnailUrl": f"https://img.youtube.com/vi/{row['youtube_id']}/mqdefault.jpg",
            "thumbnailUrlLarge": f"https://img.youtube.com/vi/{row['youtube_id']}/hqdefault.jpg",
        }
        for row in rows
    ]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(videos, indent=2, ensure_ascii=False))
    print(f"Wrote {len(videos)} videos to {OUTPUT_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite-path", type=Path, default=DEFAULT_SQLITE_PATH)
    args = parser.parse_args()
    export_videos(args.sqlite_path)
