"""Shared country code/name lookup, derived from the Natural-Earth-style
worldmap.geo.json (the un-truncated source data checked into this folder).

Every other tool in this CMS keys countries by `code` (Natural Earth's
`adm0_a3`, e.g. "USA"), never by name: `iso_a2`/`iso_a3` are unset for a
handful of countries (e.g. France, Norway), while `adm0_a3` is unique and
set for all 240 features. Countries are displayed to humans (CMS UI,
learner app) using `name_long`, since Natural Earth's short `name` is
often abbreviated (e.g. "Dem. Rep. Congo").
"""

import json
from pathlib import Path
from typing import NamedTuple

GEO_SOURCE_PATH = Path(__file__).resolve().parent / "worldmap.geo.json"


class Country(NamedTuple):
    code: str
    name: str
    short_name: str  # Natural Earth's abbreviated `name`; only used to reconcile aliases with legacy name-keyed sources like countryInfo.txt


def load_countries() -> list[Country]:
    data = json.loads(GEO_SOURCE_PATH.read_text())
    return [
        Country(
            code=feature["properties"]["adm0_a3"],
            name=feature["properties"]["name_long"],
            short_name=feature["properties"]["name"],
        )
        for feature in data["features"]
    ]


def code_to_name() -> dict[str, str]:
    return {country.code: country.name for country in load_countries()}


def short_name_to_code() -> dict[str, str]:
    return {country.short_name: country.code for country in load_countries()}
