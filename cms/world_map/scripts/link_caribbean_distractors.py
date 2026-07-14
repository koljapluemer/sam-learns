"""One-off enrichment: add Caribbean islands as each other's distractors.

Run once via: uv run python world_map/scripts/link_caribbean_distractors.py

The main distractor seed script (import_distractor_seed_data.py) only
derives distractors from land-border neighbours (countryInfo.txt's
`neighbours` column), so most Caribbean islands seeded with an empty list —
they don't share a land border with anything. This script fills those in by
treating the whole Caribbean island group as mutual (all-vs-all) distractors
of each other, a regional grouping rather than land adjacency.

Merges into any existing distractors (e.g. Haiti/Dominican Republic keep
each other from the land-border seed) rather than overwriting. Does NOT
touch `enabled` or `reviewed` — curating those stays a manual CMS step so
zoom/reasonableness can still be checked per island before enabling.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from data_io import load_distractor_choice_config, save_distractor_choice_config  # noqa: E402

CARIBBEAN_ISLANDS = [
    "Anguilla",
    "Antigua and Barb.",
    "Aruba",
    "Bahamas",
    "Barbados",
    "British Virgin Is.",
    "Cayman Is.",
    "Cuba",
    "Curaçao",
    "Dominica",
    "Dominican Rep.",
    "Grenada",
    "Haiti",
    "Jamaica",
    "Montserrat",
    "Puerto Rico",
    "Saint Lucia",
    "Sint Maarten",
    "St-Martin",
    "St. Kitts and Nevis",
    "St. Vin. and Gren.",
    "Trinidad and Tobago",
    "Turks and Caicos Is.",
    "U.S. Virgin Is.",
]


def main() -> None:
    config = load_distractor_choice_config()
    missing = [name for name in CARIBBEAN_ISLANDS if name not in config]
    if missing:
        raise SystemExit(f"not present in distractor-choice-exercises.json: {missing}")

    updated = 0
    for island in CARIBBEAN_ISLANDS:
        entry = config[island]
        others = {other for other in CARIBBEAN_ISLANDS if other != island}
        merged = sorted(set(entry["distractors"]) | others)
        if merged != entry["distractors"]:
            entry["distractors"] = merged
            updated += 1

    save_distractor_choice_config(config)
    print(f"updated {updated} of {len(CARIBBEAN_ISLANDS)} Caribbean islands with mutual distractors")


if __name__ == "__main__":
    main()
