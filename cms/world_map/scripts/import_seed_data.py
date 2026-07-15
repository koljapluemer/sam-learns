"""One-off seed import for the CMS's own curation configs.

Run once via: uv run python world_map/scripts/import_seed_data.py

The geo data itself (world_map/worldmap.geo.json) is already checked into
this folder, so this script only derives an initial curation config
(everything disabled by default) from a sibling learn-worldmap repo's zoom
level table, and exports the frontend-facing files.

Re-running is safe: it will NOT clobber curation decisions already saved
in neighborhood-exercises.json for countries that already have an entry.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from country_codes import short_name_to_code  # noqa: E402
from data_io import (  # noqa: E402
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
from export_frontend_data import export_geo_data  # noqa: E402

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
    export_geo_data()

    source_repo = find_source_repo()
    zoom_level_data = json.loads((source_repo / "generate" / "in" / "zoomLevelData.json").read_text())
    name_to_code = short_name_to_code()

    config = load_neighborhood_config()
    added = 0
    for entry in zoom_level_data:
        code = name_to_code.get(entry["name"])
        if code is None or code in config:
            continue
        zoom_raw = entry.get("zoomNeighborhood", "")
        zoom = int(zoom_raw) if zoom_raw else DEFAULT_ZOOM
        config[code] = {"enabled": False, "zoom": zoom, "reviewed": False}
        added += 1

    save_neighborhood_config(config)
    print(f"wrote {neighborhood_config_path()} ({added} new countries added, {len(config)} total)")

    world_map_config = load_world_map_config()
    world_map_added = 0
    for code in config:
        if code in world_map_config:
            continue
        world_map_config[code] = {"enabled": False, "reviewed": False}
        world_map_added += 1

    save_world_map_config(world_map_config)
    print(f"wrote {world_map_config_path()} ({world_map_added} new countries added, {len(world_map_config)} total)")

    identify_country_config = load_identify_country_config()
    identify_country_added = 0
    for code in config:
        if code in identify_country_config:
            continue
        identify_country_config[code] = {"enabled": False, "reviewed": False}
        identify_country_added += 1

    save_identify_country_config(identify_country_config)
    print(
        f"wrote {identify_country_config_path()} "
        f"({identify_country_added} new countries added, {len(identify_country_config)} total)"
    )


if __name__ == "__main__":
    main()
