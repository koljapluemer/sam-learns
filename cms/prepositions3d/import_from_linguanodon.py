"""One-time import of prepositions3d content from the linguanodon Django app.

Run via: uv run python prepositions3d/import_from_linguanodon.py

linguanodon curates this content via Django admin; this is a plain snapshot,
not an ongoing sync. Rerun by hand if the upstream content changes.

Reads (stdlib sqlite3, no Django needed):
  ../linguanodon/prepositions3d.sqlite3 -> tables prepositions3d_language,
  prepositions3d_glosstask, prepositions3d_translation

Writes:
  public/data/prepositions3d/languages.json - {code: name}
  public/data/prepositions3d/glossary.json - {taskKey: {languageCode: text, audio: {languageCode: audioPath}}}
    (mirrors linguanodon's api_glossary response shape exactly)

Also copies (not derived from sqlite - static assets):
  ../linguanodon/prepositions3d/static/prepositions3d/models/ -> public/data/prepositions3d/models/
  ../linguanodon/prepositions3d/static/prepositions3d/sound/  -> public/data/prepositions3d/sound/
  ../linguanodon/prepositions3d/static/prepositions3d/audio/  -> public/data/prepositions3d/audio/
"""

import argparse
import json
import shutil
import sqlite3
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LINGUANODON_ROOT = REPO_ROOT.parent / "linguanodon"
DEFAULT_SQLITE_PATH = LINGUANODON_ROOT / "prepositions3d.sqlite3"
STATIC_ROOT = LINGUANODON_ROOT / "prepositions3d" / "static" / "prepositions3d"
OUTPUT_DIR = REPO_ROOT / "public" / "data" / "prepositions3d"


def export_content(sqlite_path: Path) -> None:
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    try:
        languages = {
            row["code"]: row["name"]
            for row in connection.execute("SELECT code, name FROM prepositions3d_language")
        }

        translations = connection.execute(
            """
            SELECT t.task_id, t.language_id, t.text, t.audio_path
            FROM prepositions3d_translation t
            JOIN prepositions3d_glosstask task ON task.key = t.task_id
            ORDER BY task."order", t.language_id
            """
        ).fetchall()
    finally:
        connection.close()

    glossary: dict[str, dict] = {}
    for row in translations:
        entry = glossary.setdefault(row["task_id"], {})
        entry[row["language_id"]] = row["text"]
        if row["audio_path"]:
            entry.setdefault("audio", {})[row["language_id"]] = f"/data/prepositions3d/audio/{row['audio_path']}"

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "languages.json").write_text(json.dumps(languages, indent=2, ensure_ascii=False, sort_keys=True))
    (OUTPUT_DIR / "glossary.json").write_text(json.dumps(glossary, indent=2, ensure_ascii=False, sort_keys=True))
    print(f"Wrote {len(languages)} languages and {len(glossary)} gloss tasks to {OUTPUT_DIR.relative_to(REPO_ROOT)}")


def copy_assets() -> None:
    for name in ("models", "sound", "audio"):
        source = STATIC_ROOT / name
        if not source.exists():
            continue
        destination = OUTPUT_DIR / name
        shutil.copytree(source, destination, dirs_exist_ok=True)
        print(f"Copied {source} -> {destination.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite-path", type=Path, default=DEFAULT_SQLITE_PATH)
    args = parser.parse_args()
    export_content(args.sqlite_path)
    copy_assets()
