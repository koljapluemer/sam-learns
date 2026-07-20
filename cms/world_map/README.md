# world_map CMS

Curates the four config files (one per exercise type) that determine which
countries have which `world-map` frontend exercise enabled. These configs
are curation source-of-truth and live entirely in this folder, keyed by
country code (not name — see "Country codes" below):

- `world_map/data/neighborhood-exercises.json` — "find in its
  neighborhood" exercise: enabled + zoom level per country.
- `world_map/data/world-map-exercises.json` — "find on world map"
  exercise: enabled per country (no zoom — this exercise always starts at
  the full, un-zoomed world view).
- `world_map/data/identify-country-exercises.json` — "which country
  is this" exercise: enabled per country (no zoom — full world view with
  the target circled; the learner picks the name from two options).
- `world_map/data/distractor-choice-exercises.json` — zoomed "which
  country is this" exercise: enabled + zoom level + a curated list of
  plausible distractor countries per country (the learner picks the name
  from two options, but the wrong option always comes from that country's
  own curated list rather than a random country anywhere in the world).

Each config also carries a `reviewed` flag used only by this CMS to track
curation progress — never exported to the frontend.

A fifth file, `world_map/data/learning-priority.json`, curates a
`learningPriority` per country used by the frontend's country picker to bias
which country comes up next. Unlike the other four, it's keyed by
human-readable country name rather than code (matching `name_long`, e.g.
"United States") and lists every country up front at the baseline priority
2 — 1 boosts a country, 3 demotes it. It has no CMS UI — hand-edit it
directly, then re-run the export script below (or save anything in the CMS,
since every save re-exports `countries.json`).

None of the above are fetched directly by the frontend. Every save
re-exports `public/data/world-map/countries.json`, a single combined,
per-country file holding only the fields the frontend actually needs (see
`data_io.export_countries`). Run
`uv run python world_map/scripts/export_frontend_data.py` to rebuild it (and
the geo data below) from scratch, e.g. after cloning the repo or hand-editing
the config files directly.

## Country codes

`world_map/worldmap.geo.json` is the original, un-truncated Natural-Earth-style
geo data (240 features) that everything else in this folder derives from.
Countries are identified everywhere — config keys, distractor lists, the
frontend's `map.geo.json`/`countries.json` — by `code`, i.e. Natural
Earth's `adm0_a3` (e.g. `"USA"`), which is short, unique, and set for every
feature (unlike `iso_a2`/`iso_a3`, which are missing for a handful of
countries, including France and Norway). Countries are displayed to humans
using `name_long` (e.g. "Central African Republic"), since Natural Earth's
short `name` is often abbreviated (e.g. "Central African Rep."). See
`country_codes.py`.

## First-time setup

```
uv run python world_map/scripts/import_seed_data.py
```

This creates the first three config files with every country disabled by
default, using zoom levels from a sibling `learn-worldmap` checkout's
`generate/in/zoomLevelData.json`, and exports the geo data + countries.json.
Re-running is safe — it won't overwrite curation decisions already saved for
countries that already have a config entry.

The fourth config file (`distractor-choice-exercises.json`) is seeded
separately from `world_map/countryInfo.txt` (a geonames.org country-info
dump — tooling input only, not shipped to the frontend):

```
uv run python world_map/scripts/import_distractor_seed_data.py
```

This derives each country's initial distractor list from its land
neighbours and a default zoom level from its land area (smaller countries
get a tighter default zoom). Also idempotent — safe to re-run without
clobbering existing curation.

## Curating

```
uv run streamlit run world_map/app.py
```

Four tabs, one per exercise type:

- **Find in neighborhood**: pick a country, adjust zoom, toggle it
  enabled, and flip through the 9 pan crops (0-8) to eyeball quality
  before deciding.
- **Find on world map**: pick a country and toggle it enabled — the
  preview always shows the full world view with the target highlighted,
  since this exercise has no zoom/pan crop to curate.
- **Identify country**: pick a country and toggle it enabled — the
  preview shows the full world view with the target highlighted and
  circled, matching what the "which country is this" multiple-choice
  exercise shows learners.
- **Distractor choice**: pick a country, adjust zoom, flip through the 9
  pan crops, toggle it enabled, and manage its distractor list (remove
  existing entries, add new ones via the searchable country dropdown). The
  preview highlights the target country in amber and every curated
  distractor in purple so you can eyeball whether the list is actually
  plausible/nearby.

Changes save immediately. Requires `npm run dev` running (repo root) so
the preview iframes can load the actual exercise at
`/world-map?preview=1&country=...&highlight=1` (neighborhood and
distractor-choice tabs also add `&zoom=...&panIndex=...`; identify-country
also adds `&marker=1`; distractor-choice also adds `&distractors=A,B,C` — no
circle marker, just the fill highlight).
