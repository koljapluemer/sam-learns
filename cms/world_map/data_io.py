"""Load/save the world-map exercise curation configs, and export the
frontend-facing files derived from them.

Four config files, one per exercise type, all under world_map/data/ and
keyed by country code (see country_codes.py). These are curation
source-of-truth only, not served to the frontend:

- neighborhood-exercises.json: "find in its neighborhood" exercise
- world-map-exercises.json: "find on world map" exercise
- identify-country-exercises.json: "which country is this" exercise
- distractor-choice-exercises.json: zoomed "which country is this" exercise
  with a curated per-country distractor list

Every save_* function re-exports public/data/world-map/countries.json (see
export_countries below) so the frontend dev server's CMS preview reflects
edits immediately, without a separate build step.
"""

import json
from pathlib import Path
from typing import TypedDict

from country_codes import load_countries


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


class DistractorChoiceConfig(TypedDict):
    enabled: bool
    zoom: int
    distractors: list[str]
    reviewed: bool


def find_repo_root() -> Path:
    current = Path(__file__).resolve()
    for candidate in current.parents:
        if (candidate / "package.json").exists():
            return candidate
    raise FileNotFoundError("no package.json found above cms/world_map")


def cms_data_dir() -> Path:
    path = Path(__file__).resolve().parent / "data"
    path.mkdir(parents=True, exist_ok=True)
    return path


def public_data_dir() -> Path:
    path = find_repo_root() / "public" / "data" / "world-map"
    path.mkdir(parents=True, exist_ok=True)
    return path


def neighborhood_config_path() -> Path:
    return cms_data_dir() / "neighborhood-exercises.json"


def world_map_config_path() -> Path:
    return cms_data_dir() / "world-map-exercises.json"


def identify_country_config_path() -> Path:
    return cms_data_dir() / "identify-country-exercises.json"


def distractor_choice_config_path() -> Path:
    return cms_data_dir() / "distractor-choice-exercises.json"


def countries_export_path() -> Path:
    return public_data_dir() / "countries.json"


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
        code: {
            "enabled": entry["enabled"],
            "zoom": entry["zoom"],
            "reviewed": entry.get("reviewed", entry["enabled"]),
        }
        for code, entry in raw.items()
    }


def save_neighborhood_config(config: dict[str, NeighborhoodConfig]) -> None:
    neighborhood_config_path().write_text(json.dumps(config, indent=2, sort_keys=True))
    export_countries()


def load_world_map_config() -> dict[str, WorldMapConfig]:
    """Load the config, backfilling `reviewed` the same way as the neighborhood config."""
    path = world_map_config_path()
    if not path.exists():
        return {}
    raw: dict[str, dict] = json.loads(path.read_text())
    return {
        code: {
            "enabled": entry["enabled"],
            "reviewed": entry.get("reviewed", entry["enabled"]),
        }
        for code, entry in raw.items()
    }


def save_world_map_config(config: dict[str, WorldMapConfig]) -> None:
    world_map_config_path().write_text(json.dumps(config, indent=2, sort_keys=True))
    export_countries()


def load_identify_country_config() -> dict[str, IdentifyCountryConfig]:
    """Load the config, backfilling `reviewed` the same way as the neighborhood config."""
    path = identify_country_config_path()
    if not path.exists():
        return {}
    raw: dict[str, dict] = json.loads(path.read_text())
    return {
        code: {
            "enabled": entry["enabled"],
            "reviewed": entry.get("reviewed", entry["enabled"]),
        }
        for code, entry in raw.items()
    }


def save_identify_country_config(config: dict[str, IdentifyCountryConfig]) -> None:
    identify_country_config_path().write_text(json.dumps(config, indent=2, sort_keys=True))
    export_countries()


def load_distractor_choice_config() -> dict[str, DistractorChoiceConfig]:
    """Load the config, backfilling `reviewed`/`distractors` for legacy entries."""
    path = distractor_choice_config_path()
    if not path.exists():
        return {}
    raw: dict[str, dict] = json.loads(path.read_text())
    return {
        code: {
            "enabled": entry["enabled"],
            "zoom": entry["zoom"],
            "distractors": entry.get("distractors", []),
            "reviewed": entry.get("reviewed", entry["enabled"]),
        }
        for code, entry in raw.items()
    }


def save_distractor_choice_config(config: dict[str, DistractorChoiceConfig]) -> None:
    distractor_choice_config_path().write_text(json.dumps(config, indent=2, sort_keys=True))
    export_countries()


def export_countries() -> None:
    """Rebuild public/data/world-map/countries.json from the four CMS configs.

    A single combined file, keyed by country code, holding only the fields
    the frontend actually needs (no `reviewed`). A country only gets a
    sub-key for an exercise type if it has a curation entry there at all.
    """
    codes = {country.code for country in load_countries()}
    neighborhood = load_neighborhood_config()
    world_map = load_world_map_config()
    identify_country = load_identify_country_config()
    distractor_choice = load_distractor_choice_config()

    combined: dict[str, dict] = {}
    for code in codes:
        entry: dict = {}
        if code in neighborhood:
            entry["neighborhood"] = {"enabled": neighborhood[code]["enabled"], "zoom": neighborhood[code]["zoom"]}
        if code in world_map:
            entry["worldMap"] = {"enabled": world_map[code]["enabled"]}
        if code in identify_country:
            entry["identifyCountry"] = {"enabled": identify_country[code]["enabled"]}
        if code in distractor_choice:
            entry["distractorChoice"] = {
                "enabled": distractor_choice[code]["enabled"],
                "zoom": distractor_choice[code]["zoom"],
                "distractors": distractor_choice[code]["distractors"],
            }
        if entry:
            combined[code] = entry

    countries_export_path().write_text(json.dumps(combined, indent=2, sort_keys=True))
