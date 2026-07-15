"""One-off seed import for the "distractor choice" exercise.

Run once via: uv run python world_map/scripts/import_distractor_seed_data.py

Parses world_map/countryInfo.txt (a geonames.org countryInfo dump) to derive,
for every country already present in worldmap.geo.json, an initial distractor
list (its land neighbours) and a default zoom level (heuristic based on land
area). Everything is seeded disabled/unreviewed; a curator enables + tunes
distractors in the "Distractor choice" CMS tab.

Re-running is safe: it will NOT clobber curation decisions already saved in
distractor-choice-exercises.json for countries that already have an entry,
matching import_seed_data.py's convention.

countryInfo.txt names differ from worldmap.geo.json's Natural-Earth-style
short names (e.g. "Ivory Coast" vs "Côte d'Ivoire", "Bosnia and Herzegovina"
vs "Bosnia and Herz."). ALIAS maps the former to the latter for every case
where they differ and both datasets actually contain the country; from there,
short_name_to_code() resolves to the country code used as the config key.
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from country_codes import short_name_to_code  # noqa: E402
from data_io import (  # noqa: E402
    distractor_choice_config_path,
    load_distractor_choice_config,
    save_distractor_choice_config,
)

COUNTRY_INFO_PATH = Path(__file__).resolve().parents[1] / "countryInfo.txt"

DEPRECATED_ISO_CODES = {"CS", "AN"}

# countryInfo.txt name -> map.geo.json name, for every country present in
# both datasets whose names differ (see cms/world_map/README.md for how this
# was derived).
ALIAS = {
    "Bosnia and Herzegovina": "Bosnia and Herz.",
    "Democratic Republic of the Congo": "Dem. Rep. Congo",
    "Republic of the Congo": "Congo",
    "Ivory Coast": "Côte d'Ivoire",
    "The Netherlands": "Netherlands",
    "South Sudan": "S. Sudan",
    "Eswatini": "eSwatini",
    "Western Sahara": "W. Sahara",
    "Timor Leste": "Timor-Leste",
    "Dominican Republic": "Dominican Rep.",
    "Equatorial Guinea": "Eq. Guinea",
    "United States": "United States of America",
    "Palestinian Territory": "Palestine",
    "Saint Kitts and Nevis": "St. Kitts and Nevis",
    "Saint Martin": "St-Martin",
    "Antigua and Barbuda": "Antigua and Barb.",
    "Central African Republic": "Central African Rep.",
    "Cayman Islands": "Cayman Is.",
    "Cook Islands": "Cook Is.",
    "Curacao": "Curaçao",
    "Falkland Islands": "Falkland Is.",
    "Faroe Islands": "Faeroe Is.",
    "Marshall Islands": "Marshall Is.",
    "Northern Mariana Islands": "N. Mariana Is.",
    "French Polynesia": "Fr. Polynesia",
    "Saint Pierre and Miquelon": "St. Pierre and Miquelon",
    "Pitcairn": "Pitcairn Is.",
    "Solomon Islands": "Solomon Is.",
    "Sao Tome and Principe": "São Tomé and Principe",
    "Turks and Caicos Islands": "Turks and Caicos Is.",
    "British Virgin Islands": "British Virgin Is.",
    "U.S. Virgin Islands": "U.S. Virgin Is.",
    "Wallis and Futuna": "Wallis and Futuna Is.",
    "Saint Vincent and the Grenadines": "St. Vin. and Gren.",
    "Aland Islands": "Åland",
    "Saint Barthelemy": "St-Barthélemy",
    "Heard Island and McDonald Islands": "Heard I. and McDonald Is.",
    "British Indian Ocean Territory": "Br. Indian Ocean Ter.",
    "South Georgia and the South Sandwich Islands": "S. Geo. and the Is.",
}

ZOOM_MIN = 105
ZOOM_MAX = 175
LOG_AREA_MIN = math.log10(0.4)  # ~Vatican, smallest real country
LOG_AREA_MAX = math.log10(17_100_000)  # Russia, largest
FALLBACK_ZOOM = 140


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def estimate_zoom(area_sq_km: float) -> int:
    log_area = math.log10(max(area_sq_km, 1))
    progress = clamp01((LOG_AREA_MAX - log_area) / (LOG_AREA_MAX - LOG_AREA_MIN))
    return round(ZOOM_MIN + progress * (ZOOM_MAX - ZOOM_MIN))


def parse_country_info() -> list[dict]:
    rows = []
    for line in COUNTRY_INFO_PATH.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) < 18:
            continue
        iso = parts[0]
        if iso in DEPRECATED_ISO_CODES:
            continue
        country = parts[4].strip()
        area_raw = parts[6].strip()
        neighbours = [n for n in parts[17].split(",") if n]
        rows.append(
            {
                "iso": iso,
                "country": country,
                "area": float(area_raw) if area_raw else 0.0,
                "neighbours": neighbours,
            }
        )
    return rows


def main() -> None:
    name_to_code = short_name_to_code()

    rows = parse_country_info()
    iso_to_code: dict[str, str] = {}
    iso_to_area: dict[str, float] = {}
    iso_to_neighbours: dict[str, list[str]] = {}
    for row in rows:
        geo_name = ALIAS.get(row["country"], row["country"])
        if geo_name in name_to_code:
            iso_to_code[row["iso"]] = name_to_code[geo_name]
        iso_to_area[row["iso"]] = row["area"]
        iso_to_neighbours[row["iso"]] = row["neighbours"]

    config = load_distractor_choice_config()
    added = 0
    for iso, code in iso_to_code.items():
        if code in config:
            continue

        distractors = sorted(
            {
                iso_to_code[n_iso]
                for n_iso in iso_to_neighbours.get(iso, [])
                if n_iso in iso_to_code and iso_to_code[n_iso] != code
            }
        )
        zoom = estimate_zoom(iso_to_area.get(iso, 0.0))
        config[code] = {"enabled": False, "zoom": zoom, "distractors": distractors, "reviewed": False}
        added += 1

    # worldmap.geo.json features with no countryInfo.txt row at all (disputed
    # territories/glaciers with no ISO code) still get a bare entry so the
    # CMS can list and manually curate them.
    for code in name_to_code.values():
        if code in config:
            continue
        config[code] = {"enabled": False, "zoom": FALLBACK_ZOOM, "distractors": [], "reviewed": False}
        added += 1

    save_distractor_choice_config(config)
    print(f"wrote {distractor_choice_config_path()} ({added} new countries added, {len(config)} total)")


if __name__ == "__main__":
    main()
