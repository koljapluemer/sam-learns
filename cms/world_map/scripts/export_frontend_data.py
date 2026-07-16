"""Rebuild every file the world-map frontend fetches from public/data/world-map/,
from the CMS's own source data.

Run via: uv run python world_map/scripts/export_frontend_data.py

The CMS app already re-exports countries.json after every save (see
data_io.export_countries), so this script is mainly for the geo data
export (which only needs re-running when worldmap.geo.json changes) or for
rebuilding everything from scratch, e.g. after cloning the repo.

Writes:
- public/data/world-map/map.geo.json: geometry plus only {code, name} per
  feature (code = adm0_a3, name = the un-abbreviated name_long)
- public/data/world-map/countries.json: per-country exercise config, one
  combined file instead of one per exercise type, with no CMS-only fields
  (like `reviewed`)
- public/data/world-map/groups.json: ordered country groups for the
  group-sequence exercise (see data_io.export_country_groups)
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from country_codes import GEO_SOURCE_PATH  # noqa: E402
from data_io import export_countries, export_country_groups, public_data_dir  # noqa: E402


def export_geo_data() -> None:
    source = json.loads(GEO_SOURCE_PATH.read_text())
    trimmed = {
        "type": source["type"],
        "features": [
            {
                "type": feature["type"],
                "properties": {
                    "code": feature["properties"]["adm0_a3"],
                    "name": feature["properties"]["name_long"],
                },
                "geometry": feature["geometry"],
            }
            for feature in source["features"]
        ],
    }
    path = public_data_dir() / "map.geo.json"
    path.write_text(json.dumps(trimmed))
    print(f"wrote {path} ({len(trimmed['features'])} countries)")


def main() -> None:
    export_geo_data()
    export_countries()
    print(f"wrote {public_data_dir() / 'countries.json'}")
    export_country_groups()
    print(f"wrote {public_data_dir() / 'groups.json'}")


if __name__ == "__main__":
    main()
