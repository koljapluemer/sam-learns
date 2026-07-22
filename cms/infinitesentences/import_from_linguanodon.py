"""One-time import of infinitesentences content from the linguanodon Django app.

Run via: uv run python infinitesentences/import_from_linguanodon.py

Same one-time-snapshot approach as the other cms/<slug>/import_from_linguanodon.py
scripts (see cms/arabicnumbers/ for the template): linguanodon curates this
content via Django admin, this script just dumps its sqlite3 tables to the
JSON files this repo's frontend fetches at runtime. Rerun by hand if the
upstream content changes - there is no sync, and no local curation UI.

Reads (stdlib sqlite3, no Django needed - it's just a sqlite file):
  ../linguanodon/infinitesentences.sqlite3 -> infinitesentences_language,
  infinitesentences_languagepair, infinitesentences_sentence,
  infinitesentences_sentencepart

Writes:
  public/data/infinitesentences/languages.json   - all Language rows
  public/data/infinitesentences/pairs.json        - all LanguagePair rows
  public/data/infinitesentences/sentences/<native>-<target>.json
      - one file per language pair, an object keyed by sentence `index`,
        each value shaped like linguanodon's api_sentence JSON response
        (sentence text, credits, translations, transcription, parts[]).
        Split per-pair (rather than one 22MB blob) so a practice session
        only ever fetches the one pair it needs.
"""

import argparse
import json
import sqlite3
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SQLITE_PATH = REPO_ROOT.parent / "linguanodon" / "infinitesentences.sqlite3"
OUTPUT_DIR = REPO_ROOT / "public" / "data" / "infinitesentences"


def export_infinitesentences(sqlite_path: Path) -> None:
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    try:
        language_rows = connection.execute(
            "SELECT code, display_name, symbols, is_native "
            "FROM infinitesentences_language ORDER BY display_name"
        ).fetchall()
        languages = [
            {
                "code": row["code"],
                "displayName": row["display_name"],
                "symbols": json.loads(row["symbols"]),
                "isNative": bool(row["is_native"]),
            }
            for row in language_rows
        ]

        pairs = [dict(row) for row in connection.execute(
            "SELECT id, native_id, target_id, sentence_count "
            "FROM infinitesentences_languagepair ORDER BY native_id, target_id"
        ).fetchall()]

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        (OUTPUT_DIR / "languages.json").write_text(
            json.dumps(languages, indent=2, ensure_ascii=False)
        )
        (OUTPUT_DIR / "pairs.json").write_text(
            json.dumps(
                [
                    {"native": p["native_id"], "target": p["target_id"], "sentenceCount": p["sentence_count"]}
                    for p in pairs
                ],
                indent=2,
                ensure_ascii=False,
            )
        )
        print(f"Wrote {len(languages)} languages and {len(pairs)} pairs.")

        sentences_dir = OUTPUT_DIR / "sentences"
        sentences_dir.mkdir(parents=True, exist_ok=True)

        total_sentences = 0
        for pair in pairs:
            sentence_rows = connection.execute(
                "SELECT id, \"index\", text, translations, credits, transcription "
                "FROM infinitesentences_sentence WHERE pair_id = ? ORDER BY \"index\"",
                (pair["id"],),
            ).fetchall()

            sentences_by_index = {}
            for sentence_row in sentence_rows:
                part_rows = connection.execute(
                    "SELECT content, translations, usage_examples, transcription "
                    "FROM infinitesentences_sentencepart WHERE sentence_id = ? ORDER BY \"order\"",
                    (sentence_row["id"],),
                ).fetchall()

                sentences_by_index[str(sentence_row["index"])] = {
                    "sentence": sentence_row["text"],
                    "credits": json.loads(sentence_row["credits"]),
                    "translations": json.loads(sentence_row["translations"]),
                    "transcription": sentence_row["transcription"],
                    "parts": [
                        {
                            "content": part_row["content"],
                            "translations": json.loads(part_row["translations"]),
                            "usageExamples": json.loads(part_row["usage_examples"]),
                            "transcription": part_row["transcription"],
                        }
                        for part_row in part_rows
                    ],
                }

            total_sentences += len(sentences_by_index)
            out_path = sentences_dir / f"{pair['native_id']}-{pair['target_id']}.json"
            out_path.write_text(json.dumps(sentences_by_index, ensure_ascii=False))

        print(f"Wrote {total_sentences} sentences across {len(pairs)} pair files to {sentences_dir.relative_to(REPO_ROOT)}")
    finally:
        connection.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sqlite-path",
        type=Path,
        default=DEFAULT_SQLITE_PATH,
        help="Path to linguanodon's infinitesentences.sqlite3 (default: sibling checkout)",
    )
    args = parser.parse_args()
    export_infinitesentences(args.sqlite_path)
