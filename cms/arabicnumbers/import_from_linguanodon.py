"""One-time import of arabicnumbers content from the linguanodon Django app.

Run via: uv run python arabicnumbers/import_from_linguanodon.py

Unlike world_map's CMS (a Streamlit app with ongoing curation), this is a
plain snapshot: linguanodon curates this content via Django admin, and this
script just dumps its sqlite3 table to the JSON file this repo's frontend
fetches at runtime. Rerun by hand if the upstream content changes - there is
no sync, and no local curation UI for this app.

Reads (stdlib sqlite3, no Django needed - it's just a sqlite file):
  ../linguanodon/arabicnumbers.sqlite3 -> table arabicnumbers_arabicnumber

Writes:
  public/data/arabicnumbers/numbers.json
"""

import argparse
import json
import sqlite3
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SQLITE_PATH = REPO_ROOT.parent / "linguanodon" / "arabicnumbers.sqlite3"
OUTPUT_PATH = REPO_ROOT / "public" / "data" / "arabicnumbers" / "numbers.json"


def export_numbers(sqlite_path: Path) -> None:
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    try:
        rows = connection.execute(
            "SELECT value, numeral, script, english, transliteration "
            "FROM arabicnumbers_arabicnumber ORDER BY value"
        ).fetchall()
    finally:
        connection.close()

    numbers = [dict(row) for row in rows]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(numbers, indent=2, ensure_ascii=False))
    print(f"Wrote {len(numbers)} numbers to {OUTPUT_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sqlite-path",
        type=Path,
        default=DEFAULT_SQLITE_PATH,
        help="Path to linguanodon's arabicnumbers.sqlite3 (default: sibling checkout)",
    )
    args = parser.parse_args()
    export_numbers(args.sqlite_path)
