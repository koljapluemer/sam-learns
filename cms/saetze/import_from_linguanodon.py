"""One-time import of saetze content from the linguanodon Django app.

Run via: uv run python saetze/import_from_linguanodon.py

Plain snapshot, not an ongoing sync - see cms/arabicnumbers/import_from_linguanodon.py
for the pattern this follows. Rerun by hand if the upstream content changes.

Reads (stdlib sqlite3): ../linguanodon/saetze.sqlite3
  tables: saetze_lesson, saetze_exercise

Writes:
  public/data/saetze/lessons.json   - [{key, name, order}]
  public/data/saetze/exercises.json - [{id, lesson, english, english_credit,
                                         cloze, correct_answer, wrong_answer,
                                         german_credit}]
"""

import argparse
import json
import sqlite3
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SQLITE_PATH = REPO_ROOT.parent / "linguanodon" / "saetze.sqlite3"
OUTPUT_DIR = REPO_ROOT / "public" / "data" / "saetze"


def export_saetze(sqlite_path: Path) -> None:
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    try:
        lessons = [
            dict(row)
            for row in connection.execute(
                'SELECT key, name, "order" FROM saetze_lesson ORDER BY "order"'
            ).fetchall()
        ]
        exercises = [
            dict(row)
            for row in connection.execute(
                "SELECT id, lesson_id AS lesson, english, english_credit, cloze, "
                "correct_answer, wrong_answer, german_credit "
                "FROM saetze_exercise ORDER BY lesson_id, id"
            ).fetchall()
        ]
    finally:
        connection.close()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "lessons.json").write_text(json.dumps(lessons, indent=2, ensure_ascii=False))
    (OUTPUT_DIR / "exercises.json").write_text(json.dumps(exercises, indent=2, ensure_ascii=False))
    print(f"Wrote {len(lessons)} lessons and {len(exercises)} exercises to {OUTPUT_DIR.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite-path", type=Path, default=DEFAULT_SQLITE_PATH)
    args = parser.parse_args()
    export_saetze(args.sqlite_path)
