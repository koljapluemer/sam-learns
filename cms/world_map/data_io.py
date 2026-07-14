"""Load/save the world-map exercise curation configs.

Three config files, one per exercise type, all under
public/data/world-map/ and all fetched at runtime by the learner app:

- neighborhood-exercises.json: "find in its neighborhood" exercise
- world-map-exercises.json: "find on world map" exercise
- identify-country-exercises.json: "which country is this" exercise
"""

import json
from pathlib import Path
from typing import TypedDict


class NeighborhoodConfig(TypedDict):
    enabled: bool
    zoom: int
    reviewed: bool


class WorldMapConfig(TypedDict):
    enabled: bool
    reviewed: bool


class IdentifyCountryConfig(TypedDict):
    enabled: bool
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


def neighborhood_config_path() -> Path:
    return data_dir() / "neighborhood-exercises.json"


def world_map_config_path() -> Path:
    return data_dir() / "world-map-exercises.json"


def identify_country_config_path() -> Path:
    return data_dir() / "identify-country-exercises.json"


def geo_data_path() -> Path:
    return data_dir() / "map.geo.json"


def load_neighborhood_config() -> dict[str, NeighborhoodConfig]:
    """Load the config, backfilling `reviewed` for entries saved before that field existed.

    A missing `reviewed` defaults to the entry's `enabled` value: every
    pre-existing entry was either explicitly enabled (so it must have been
    reviewed) or left at the seed script's default `enabled: False` (so it
    was never reviewed).
    """
    path = neighborhood_config_path()
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


def save_neighborhood_config(config: dict[str, NeighborhoodConfig]) -> None:
    neighborhood_config_path().write_text(json.dumps(config, indent=2, sort_keys=True))


def load_world_map_config() -> dict[str, WorldMapConfig]:
    """Load the config, backfilling `reviewed` the same way as the neighborhood config."""
    path = world_map_config_path()
    if not path.exists():
        return {}
    raw: dict[str, dict] = json.loads(path.read_text())
    return {
        name: {
            "enabled": entry["enabled"],
            "reviewed": entry.get("reviewed", entry["enabled"]),
        }
        for name, entry in raw.items()
    }


def save_world_map_config(config: dict[str, WorldMapConfig]) -> None:
    world_map_config_path().write_text(json.dumps(config, indent=2, sort_keys=True))


def load_identify_country_config() -> dict[str, IdentifyCountryConfig]:
    """Load the config, backfilling `reviewed` the same way as the neighborhood config."""
    path = identify_country_config_path()
    if not path.exists():
        return {}
    raw: dict[str, dict] = json.loads(path.read_text())
    return {
        name: {
            "enabled": entry["enabled"],
            "reviewed": entry.get("reviewed", entry["enabled"]),
        }
        for name, entry in raw.items()
    }


def save_identify_country_config(config: dict[str, IdentifyCountryConfig]) -> None:
    identify_country_config_path().write_text(json.dumps(config, indent=2, sort_keys=True))
