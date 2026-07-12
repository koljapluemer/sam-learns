"""Load/save the world-map neighborhood-exercise curation config.

The config is the single file the learner app fetches at runtime and this
CMS edits: public/data/world-map/neighborhood-exercises.json
"""

import json
from pathlib import Path
from typing import TypedDict


class CountryConfig(TypedDict):
    enabled: bool
    zoom: int
    reviewed: bool


def find_repo_root() -> Path:
    current = Path(__file__).resolve()
    for candidate in current.parents:
        if (candidate / "package.json").exists():
            return candidate
    raise FileNotFoundError("no package.json found above cms/world_map")


def data_dir() -> Path:
    path = find_repo_root() / "public" / "data" / "world-map"
    path.mkdir(parents=True, exist_ok=True)
    return path


def config_path() -> Path:
    return data_dir() / "neighborhood-exercises.json"


def geo_data_path() -> Path:
    return data_dir() / "map.geo.json"


def load_config() -> dict[str, CountryConfig]:
    """Load the config, backfilling `reviewed` for entries saved before that field existed.

    A missing `reviewed` defaults to the entry's `enabled` value: every
    pre-existing entry was either explicitly enabled (so it must have been
    reviewed) or left at the seed script's default `enabled: False` (so it
    was never reviewed).
    """
    path = config_path()
    if not path.exists():
        return {}
    raw: dict[str, dict] = json.loads(path.read_text())
    return {
        name: {
            "enabled": entry["enabled"],
            "zoom": entry["zoom"],
            "reviewed": entry.get("reviewed", entry["enabled"]),
        }
        for name, entry in raw.items()
    }


def save_config(config: dict[str, CountryConfig]) -> None:
    config_path().write_text(json.dumps(config, indent=2, sort_keys=True))
