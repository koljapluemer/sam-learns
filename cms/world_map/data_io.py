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
    path = config_path()
    if not path.exists():
        return {}
    return json.loads(path.read_text())


def save_config(config: dict[str, CountryConfig]) -> None:
    config_path().write_text(json.dumps(config, indent=2, sort_keys=True))
