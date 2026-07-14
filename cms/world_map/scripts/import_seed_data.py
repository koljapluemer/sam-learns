"""One-off seed import from the sibling learn-worldmap repo.

Run once via: uv run python world_map/scripts/import_seed_data.py

Copies the geojson map data as-is and derives an initial curation config
(everything disabled by default) from learn-worldmap's zoom level table.
Re-running is safe for the geojson (always overwritten) but will NOT
clobber curation decisions already saved in neighborhood-exercises.json
for countries that already have an entry.
"""

import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from data_io import (  # noqa: E402
    geo_data_path,
    identify_country_config_path,
    load_identify_country_config,
    load_neighborhood_config,
    load_world_map_config,
    neighborhood_config_path,
    save_identify_country_config,
    save_neighborhood_config,
    save_world_map_config,
    world_map_config_path,
)

DEFAULT_ZOOM = 150

SOURCE_REPO_CANDIDATES = [
    Path(__file__).resolve().parents[4] / "learn-worldmap",
    Path(__file__).resolve().parents[3] / "learn-worldmap",
]


def find_source_repo() -> Path:
    for candidate in SOURCE_REPO_CANDIDATES:
        if (candidate / "generate" / "in" / "zoomLevelData.json").exists():
            return candidate
    raise FileNotFoundError(
        "could not find a sibling learn-worldmap checkout with generate/in/zoomLevelData.json"
    )


def main() -> None:
    source_repo = find_source_repo()

    source_geojson = source_repo / "src" / "modules" / "map-data" / "map.geo.json"
    shutil.copyfile(source_geojson, geo_data_path())
    print(f"copied {source_geojson} -> {geo_data_path()}")

    zoom_level_data = json.loads((source_repo / "generate" / "in" / "zoomLevelData.json").read_text())

    config = load_neighborhood_config()
    added = 0
    for entry in zoom_level_data:
        country = entry["name"]
        if country in config:
            continue
        zoom_raw = entry.get("zoomNeighborhood", "")
        zoom = int(zoom_raw) if zoom_raw else DEFAULT_ZOOM
        config[country] = {"enabled": False, "zoom": zoom, "reviewed": False}
        added += 1

    save_neighborhood_config(config)
    print(f"wrote {neighborhood_config_path()} ({added} new countries added, {len(config)} total)")

    world_map_config = load_world_map_config()
    world_map_added = 0
    for country in config:
        if country in world_map_config:
            continue
        world_map_config[country] = {"enabled": False, "reviewed": False}
        world_map_added += 1

    save_world_map_config(world_map_config)
    print(f"wrote {world_map_config_path()} ({world_map_added} new countries added, {len(world_map_config)} total)")

    identify_country_config = load_identify_country_config()
    identify_country_added = 0
    for country in config:
        if country in identify_country_config:
            continue
        identify_country_config[country] = {"enabled": False, "reviewed": False}
        identify_country_added += 1

    save_identify_country_config(identify_country_config)
    print(
        f"wrote {identify_country_config_path()} "
        f"({identify_country_added} new countries added, {len(identify_country_config)} total)"
    )


if __name__ == "__main__":
    main()
