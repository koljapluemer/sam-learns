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
from data_io import config_path, geo_data_path, load_config, save_config  # noqa: E402

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

    config = load_config()
    added = 0
    for entry in zoom_level_data:
        country = entry["name"]
        if country in config:
            continue
        zoom_raw = entry.get("zoomNeighborhood", "")
        zoom = int(zoom_raw) if zoom_raw else DEFAULT_ZOOM
        config[country] = {"enabled": False, "zoom": zoom}
        added += 1

    save_config(config)
    print(f"wrote {config_path()} ({added} new countries added, {len(config)} total)")


if __name__ == "__main__":
    main()
