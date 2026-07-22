"""One-time import of egyptiansentences content from the linguanodon Django app.

Run via: uv run python egyptiansentences/import_from_linguanodon.py

linguanodon curates this content via Django admin; this is a plain snapshot,
not an ongoing sync - rerun by hand if the upstream content changes.

Reads (stdlib sqlite3, no Django needed - it's just a sqlite file):
  ../linguanodon/egyptiansentences.sqlite3
    -> tables egyptiansentences_sentence, egyptiansentences_clozeword

Writes:
  public/data/egyptiansentences/sentences.json - one combined array, each
  sentence carrying its cloze_words list, matching the shape of
  linguanodon's api_sentences endpoint.
"""

import argparse
import json
import sqlite3
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SQLITE_PATH = REPO_ROOT.parent / "linguanodon" / "egyptiansentences.sqlite3"
OUTPUT_PATH = REPO_ROOT / "public" / "data" / "egyptiansentences" / "sentences.json"


def export_sentences(sqlite_path: Path) -> None:
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    try:
        sentence_rows = connection.execute(
            "SELECT id, arz, transliteration, translations FROM egyptiansentences_sentence ORDER BY id"
        ).fetchall()
        cloze_rows = connection.execute(
            "SELECT sentence_id, word, distractors FROM egyptiansentences_clozeword ORDER BY sentence_id, id"
        ).fetchall()
    finally:
        connection.close()

    cloze_by_sentence: dict[int, list[dict]] = {}
    for row in cloze_rows:
        cloze_by_sentence.setdefault(row["sentence_id"], []).append(
            {"word": row["word"], "distractors": json.loads(row["distractors"])}
        )

    sentences = [
        {
            "id": row["id"],
            "arz": row["arz"],
            "transliteration": row["transliteration"],
            "translations": json.loads(row["translations"]),
            "cloze_words": cloze_by_sentence.get(row["id"], []),
        }
        for row in sentence_rows
    ]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(sentences, indent=2, ensure_ascii=False))
    total_cloze = sum(len(s["cloze_words"]) for s in sentences)
    print(f"Wrote {len(sentences)} sentences ({total_cloze} cloze words) to {OUTPUT_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sqlite-path",
        type=Path,
        default=DEFAULT_SQLITE_PATH,
        help="Path to linguanodon's egyptiansentences.sqlite3 (default: sibling checkout)",
    )
    args = parser.parse_args()
    export_sentences(args.sqlite_path)
